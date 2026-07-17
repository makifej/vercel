import express from "express";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(express.json());

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

if (!GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not defined in environment variables");
}

// Which Gemini model both endpoints (/chat + /timeline) call. Single source of truth,
// env-overridable WITHOUT a code change: set GEMINI_MODEL in Vercel to flip.
// NOTE (2026-07-13): "gemini-2.5-pro" is NOT usable with this API key — Google returns
// 404 "no longer available to new users" (the model is gated to existing paying users).
// The newer 3.x-pro-preview models also 404 on this key/tier. So the default stays on the
// known-good, accessible "gemini-2.5-flash"; accessing a Pro model needs a billing-enabled
// / upgraded Google API key first (then set GEMINI_MODEL to the working Pro id).
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

// Optional thinking control for the 3.x models. Gemini 3.x uses a thinkingLevel
// ("low" | "high"), NOT a numeric budget — and the Pro models REJECT budget 0
// ("This model only works in thinking mode"). Setting GEMINI_THINKING_LEVEL=low makes
// gemini-3.1-pro-preview answer in ~4s instead of ~10s while keeping Pro's capability
// (a "fast Pro"). Empty = the model's own default thinking. Only sent when non-empty, so
// models that don't accept it (or when we want the default) are unaffected.
const GEMINI_THINKING_LEVEL = process.env.GEMINI_THINKING_LEVEL || "";
// 2.5-family speed fix (measured live 2026-07-15): gemini-2.5-flash "thinks" by default and
// burned 288-550 thought-tokens even on a one-line command — 2.0-3.8s versus 0.9-1.3s with
// thinkingBudget=0, identical output. Structured extraction with our explicit rules doesn't
// need thinking, so the budget defaults to 0; GEMINI_THINKING_BUDGET in Vercel re-enables it
// (e.g. "-1" = dynamic) without a code change. thinkingLevel (3.x naming, above) wins if set.
const GEMINI_THINKING_BUDGET = process.env.GEMINI_THINKING_BUDGET ?? "0";
// TEMP DIAG (2026-07-15): az utolso Gemini-hivassorozat idozitese, x-diag fejlecbe.
let LAST_GEMINI_DIAG = "";
const THINKING_CONFIG = GEMINI_THINKING_LEVEL
  ? { thinkingConfig: { thinkingLevel: GEMINI_THINKING_LEVEL } }
  : GEMINI_THINKING_BUDGET !== "" && GEMINI_MODEL.startsWith("gemini-2.5")
    ? { thinkingConfig: { thinkingBudget: parseInt(GEMINI_THINKING_BUDGET, 10) } }
    : {};

// Cuts the first balanced {...} or [...] region out of a reply that wraps its JSON in
// markdown fences or prose — the model intermittently disobeys "JSON only" (proven live
// 2026-07-15 10:23: "a koi bisztró post legyen kritikus értesítés" got a non-JSON-shaped
// reply on every attempt, and the raw text used to reach the client as HTTP 200). A
// truncated region (no balanced close) is returned as-is for the repair pass to finish.
function extractJsonRegion(text: string): string | null {
  const start = text.search(/[{\[]/);
  if (start === -1) return null;
  let inStr = false, esc = false, depth = 0;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (esc) { esc = false; continue; }
    if (ch === "\\") { esc = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{" || ch === "[") depth++;
    else if (ch === "}" || ch === "]") { depth--; if (depth === 0) return text.slice(start, i + 1); }
  }
  return text.slice(start);
}

// Repairs a JSON string the model mangled in either proven live failure mode: TRUNCATED at
// the end (3.x thinking Pro: a complete object missing only its trailing `}` with
// finishReason=STOP), or wrapped in fences/prose (handled by [extractJsonRegion] first).
// We scan once, close an open string if needed, drop a dangling comma, and append the
// closers for every still-open { or [. Returns the parsed value, or null if it still
// won't parse.
function parseWithRepair(text: string): any | null {
  try {
    return JSON.parse(text);
  } catch {
    const region = extractJsonRegion(text);
    if (region === null) return null;
    let s = region.trim().replace(/,\s*$/, "");
    let inStr = false, esc = false;
    const stack: string[] = [];
    for (const ch of s) {
      if (esc) { esc = false; continue; }
      if (ch === "\\") { esc = true; continue; }
      if (ch === '"') { inStr = !inStr; continue; }
      if (inStr) continue;
      if (ch === "{" || ch === "[") stack.push(ch);
      else if (ch === "}" || ch === "]") stack.pop();
    }
    if (inStr) s += '"';
    s = s.replace(/,\s*$/, "");
    for (let i = stack.length - 1; i >= 0; i--) s += stack[i] === "{" ? "}" : "]";
    try { return JSON.parse(s); } catch { return null; }
  }
}

// Returns the first Gemini response whose (parsed-or-repaired) JSON `normalise()` accepts —
// the exact string to send the client. The 3.x thinking Pro models intermittently truncate
// the JSON even with finishReason=STOP (proven live), so one call is unreliable for ANY of
// them. First [parseWithRepair] rescues the common "missing trailing brace" case with no
// extra latency; only if that fails does it retry the whole call (up to `maxAttempts`). This
// server-side repair+retry is far more robust than the Android client's single silent retry.
//
// THROWS when every attempt failed: the old `return lastText` fallback sent the raw
// unparseable reply to the client as HTTP 200, which the Android app's strict decoder
// surfaced as an opaque ParseError (live 2026-07-15 10:23). A thrown error becomes the
// caller's 500 — an honest, retryable signal instead of a fake success.
async function generateNormalisedJson(
  requestBody: any,
  normalise: (parsed: any) => string | null,
  maxAttempts = 3
): Promise<string> {
  let lastText = "";
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const tCall = Date.now();
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      { headers: { "Content-Type": "application/json" } }
    );
    lastText = response.data.candidates[0].content.parts[0].text;
    const usage = response.data.usageMetadata || {};
    // TEMP DIAG (2026-07-15 lassúság-vadászat): per-hívás bontás a runtime logba.
    LAST_GEMINI_DIAG =
      `a${attempt + 1}=${Date.now() - tCall}ms model=${GEMINI_MODEL} ` +
      `pTok=${usage.promptTokenCount} thinkTok=${usage.thoughtsTokenCount ?? 0} ` +
      `outTok=${usage.candidatesTokenCount}`;
    console.log("gemini " + LAST_GEMINI_DIAG);
    const parsed = parseWithRepair(lastText);
    if (parsed !== null) {
      const norm = normalise(parsed);
      if (norm !== null) return norm;
    }
  }
  console.error(
    `generateNormalisedJson: no parseable JSON after ${maxAttempts} attempts; ` +
      `last reply head: ${lastText.slice(0, 300)}`
  );
  throw new Error(`Gemini returned no parseable JSON after ${maxAttempts} attempts`);
}

// ---------------------------------------------------------------------------
// Rate limiting — two layers, both env-tunable without redeploying code:
//  1) per-IP window: stops a single source hammering the endpoint;
//  2) GLOBAL minute + daily ceilings: cap the total Gemini spend no matter how
//     many IPs the traffic rotates through (VPN/botnet scenario) — the global
//     counters are what actually price-cap the worst case.
// Counters live in Upstash Redis when UPSTASH_REDIS_REST_URL/_TOKEN are set
// (exact, shared across serverless instances); otherwise an in-memory
// per-instance fallback still catches sequential hammering. The Android app
// already maps HTTP 429 to a friendly "try again" error, so no client change
// is needed.
// ---------------------------------------------------------------------------
const RL_PER_IP_PER_MIN = parseInt(process.env.RL_PER_IP_PER_MIN || "12", 10);
const RL_GLOBAL_PER_MIN = parseInt(process.env.RL_GLOBAL_PER_MIN || "120", 10);
const RL_GLOBAL_PER_DAY = parseInt(process.env.RL_GLOBAL_PER_DAY || "2000", 10);
// The Vercel Marketplace "Upstash for Redis" resource injects KV_REST_API_*; a directly
// created Upstash database injects UPSTASH_REDIS_REST_*. Same REST protocol — accept both.
const UPSTASH_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const memBuckets = new Map<string, { count: number; resetAt: number }>();

function memIncr(key: string, ttlSeconds: number): number {
  const now = Date.now();
  if (memBuckets.size > 5000) {
    for (const [k, b] of memBuckets) if (b.resetAt <= now) memBuckets.delete(k);
  }
  const bucket = memBuckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    memBuckets.set(key, { count: 1, resetAt: now + ttlSeconds * 1000 });
    return 1;
  }
  bucket.count += 1;
  return bucket.count;
}

async function redisIncr(key: string, ttlSeconds: number): Promise<number | null> {
  try {
    const r = await axios.get(`${UPSTASH_URL}/incr/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      timeout: 1500,
    });
    const count = r.data?.result as number;
    if (count === 1) {
      await axios.get(`${UPSTASH_URL}/expire/${encodeURIComponent(key)}/${ttlSeconds}`, {
        headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
        timeout: 1500,
      });
    }
    return count;
  } catch {
    return null; // Redis unreachable → fall back to memory rather than blocking users
  }
}

async function incrWindow(key: string, ttlSeconds: number): Promise<number> {
  if (UPSTASH_URL && UPSTASH_TOKEN) {
    const n = await redisIncr(key, ttlSeconds);
    if (n !== null) return n;
  }
  return memIncr(key, ttlSeconds);
}

function clientIp(req: express.Request): string {
  const forwarded = (req.headers["x-forwarded-for"] as string) || "";
  return forwarded.split(",")[0].trim() || req.socket?.remoteAddress || "unknown";
}

/** Returns true when the request may proceed; otherwise it has already sent 429. */
async function allowRequest(req: express.Request, res: express.Response): Promise<boolean> {
  const minuteWindow = Math.floor(Date.now() / 60_000);
  const dayWindow = new Date().toISOString().slice(0, 10);
  const [ipCount, globalMinute, globalDay] = await Promise.all([
    incrWindow(`rl:ip:${clientIp(req)}:${minuteWindow}`, 120),
    incrWindow(`rl:global:m:${minuteWindow}`, 120),
    incrWindow(`rl:global:d:${dayWindow}`, 90_000),
  ]);
  if (ipCount > RL_PER_IP_PER_MIN || globalMinute > RL_GLOBAL_PER_MIN || globalDay > RL_GLOBAL_PER_DAY) {
    res.status(429).send({ error: "Too many requests" });
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Promó kódok — SZERVER-oldali beváltás (user-kérés 2026-07-17: "akarok látni
// számokat... egy kód csak egyszer, egy telefonon legyen felhasználható").
//
// A v1.0.7-es kliens-oldali készlet (5 kód, egyenként +20 AI-hívás) korlátja az
// volt, hogy nem számolt semmit és több eszközön is beváltható volt. Mostantól a
// beváltás itt dől el, atomian: SET NX a `promo:used:<kód>` kulcsra — az ELSŐ
// eszköz nyeri a kódot, minden további kérés (bármely eszközről, újratelepítés
// után is) "used"-ot kap. Redis-kiesésnél FAIL-CLOSED (503): kétszer-beváltást
// sosem engedünk memória-fallbackkel.
//
// Statisztika: GET /promo/stats?key=<PROMO_STATS_KEY env> — kódonként mutatja,
// be lett-e váltva, mikor és melyik eszköz-azonosítóval.
// ---------------------------------------------------------------------------
const PROMO_CALLS_PER_CODE = parseInt(process.env.PROMO_CALLS_PER_CODE || "20", 10);
const PROMO_CODES: string[] = (process.env.PROMO_CODES ||
  "SR-AI-7F3K9Q,SR-AI-P2M8XW,SR-AI-4B6VZ1,SR-AI-9H5N2T,SR-AI-K3RJ8D,SR-AI-QA0000")
  .split(",").map((c) => c.trim().toUpperCase()).filter(Boolean);

async function redisSetNx(key: string, value: string): Promise<boolean | null> {
  try {
    const r = await axios.get(
      `${UPSTASH_URL}/set/${encodeURIComponent(key)}/${encodeURIComponent(value)}?NX=true`,
      { headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` }, timeout: 2500 },
    );
    return r.data?.result === "OK"; // null result = NX vesztett (már létezik)
  } catch {
    return null; // Redis elérhetetlen
  }
}

async function redisGet(key: string): Promise<string | null | undefined> {
  try {
    const r = await axios.get(`${UPSTASH_URL}/get/${encodeURIComponent(key)}`, {
      headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
      timeout: 2500,
    });
    return r.data?.result ?? null; // null = nincs ilyen kulcs
  } catch {
    return undefined; // undefined = Redis-hiba (megkülönböztetve a "nincs"-től)
  }
}

app.post("/promo", async (req, res): Promise<any> => {
  if (!(await allowRequest(req, res))) return;
  const code = String(req.body?.code || "").trim().toUpperCase();
  const deviceId = String(req.body?.deviceId || "").trim();
  if (!code || !deviceId) return res.send({ ok: false, reason: "invalid" });
  if (!PROMO_CODES.includes(code)) return res.send({ ok: false, reason: "invalid" });
  if (!UPSTASH_URL || !UPSTASH_TOKEN) {
    return res.status(503).send({ ok: false, reason: "unavailable" });
  }
  const claimed = await redisSetNx(
    `promo:used:${code}`,
    `${deviceId}|${new Date().toISOString()}`,
  );
  if (claimed === null) return res.status(503).send({ ok: false, reason: "unavailable" });
  if (!claimed) return res.send({ ok: false, reason: "used" });
  return res.send({ ok: true, calls: PROMO_CALLS_PER_CODE });
});

app.get("/promo/stats", async (req, res): Promise<any> => {
  const adminKey = process.env.PROMO_STATS_KEY || "";
  if (!adminKey || req.query.key !== adminKey) return res.status(403).send({ error: "forbidden" });
  const rows = await Promise.all(
    PROMO_CODES.map(async (code) => {
      const v = await redisGet(`promo:used:${code}`);
      if (v === undefined) return { code, status: "error" };
      if (v === null) return { code, status: "unused" };
      const [deviceId, redeemedAt] = v.split("|");
      return { code, status: "redeemed", deviceId, redeemedAt };
    }),
  );
  const redeemed = rows.filter((r) => r.status === "redeemed").length;
  return res.send({ redeemed, total: PROMO_CODES.length, callsPerCode: PROMO_CALLS_PER_CODE, rows });
});

// ---------------------------------------------------------------------------
// Deterministic calendar reference — the weekday/relative-date fix.
//
// WHY: LLMs cannot reliably do calendar arithmetic. Given only "Current Date is
// 2026-07-10 14:32" the model must derive that this is a FRIDAY and then count
// weeks — it consistently gets both wrong (observed live: "jövő hét csütörtök"
// resolved to a Friday date, "szerda" to a Thursday date, "két hét múlva" to
// +3 weeks). The fix: WE compute a 4-week date⇄weekday lookup table plus the
// exact dates for every "next week X" / "in N weeks" phrase in TypeScript
// (exact by construction), inject it into the prompt, and forbid the model
// from doing any weekday math itself — it only looks dates up.
//
// The anchor date is parsed from the "Current Date is yyyy-MM-dd HH:mm" suffix
// that both the Android and iOS apps already append to every command — that is
// the USER'S wall clock in their own timezone. We rebuild it as a UTC Date and
// only ever read it back with getUTC* accessors, so the server's timezone
// never contaminates the user's calendar. Fallback (no suffix found): server
// clock — still better than letting the model guess.
// ---------------------------------------------------------------------------
const DAY_EN = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_HU = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];

function pad2(n: number): string {
  return n < 10 ? "0" + n : String(n);
}

/** dd/mm/yyyy — the exact output date format the schema demands. */
function fmtDate(d: Date): string {
  return `${pad2(d.getUTCDate())}/${pad2(d.getUTCMonth() + 1)}/${d.getUTCFullYear()}`;
}

function calendarReference(command: string): string {
  const m = command.match(/Current Date is (\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})/);
  const base = m
    ? new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]))
    : new Date();
  const addDays = (n: number) => new Date(base.getTime() + n * 86_400_000);
  const dow = base.getUTCDay();

  const tableRows: string[] = [];
  for (let i = 0; i <= 28; i++) {
    const d = addDays(i);
    const w = d.getUTCDay();
    tableRows.push(
      `          ${fmtDate(d)} = ${DAY_EN[w]} / ${DAY_HU[w]}${i === 0 ? "   <-- TODAY / MA" : ""}`
    );
  }

  // First Monday strictly after the current (Monday-started) week ends.
  // Sun(0)→+1, Mon(1)→+7, Tue(2)→+6, ... Sat(6)→+2.
  const daysUntilNextMonday = ((8 - dow) % 7) || 7;
  const nextWeekRows = DAY_EN.map((_, k) => {
    // k iterates Monday..Sunday of next week (offset 0..6 from next Monday)
    const d = addDays(daysUntilNextMonday + k);
    const w = d.getUTCDay();
    return `          "next ${DAY_EN[w]}" / "jövő ${DAY_HU[w]}" = ${fmtDate(d)}`;
  });

  const hhmm = `${pad2(base.getUTCHours())}:${pad2(base.getUTCMinutes())}`;

  return `
        CALENDAR REFERENCE (authoritative — computed by a real calendar, NOT by you):
        Today is ${DAY_EN[dow]} / ${DAY_HU[dow]}, ${fmtDate(base)}, current time ${hhmm}.

        Date-to-weekday table for the next 4 weeks:
${tableRows.join("\n")}

        MANDATORY date resolution rules — NEVER do weekday or week arithmetic yourself,
        ALWAYS resolve by looking up the table and mappings above/below:
        - Bare day name ("csütörtökön", "on Thursday"): the FIRST date in the table
          strictly after today whose weekday matches (today itself only if the
          requested time is still in the future).
        - "jövő hét <day>" / "jövő <day>" / "next <day>" / "<day> next week" — the
          named day of NEXT week (the week starting Monday ${fmtDate(addDays(daysUntilNextMonday))}):
${nextWeekRows.join("\n")}
        - "jövő héten" / "next week" with NO day named = ${fmtDate(addDays(7))}.
        - "egy hét múlva" / "in a week" = ${fmtDate(addDays(7))}.
        - "két hét múlva" / "in two weeks" = ${fmtDate(addDays(14))}.
        - "három hét múlva" / "in three weeks" = ${fmtDate(addDays(21))}.
        - "négy hét múlva" / "in four weeks" = ${fmtDate(addDays(28))}.
        - "N nap múlva" / "in N days" = today + N days; look the result up in the table.
        - "holnap" / "tomorrow" = ${fmtDate(addDays(1))}; "holnapután" / "day after tomorrow" = ${fmtDate(addDays(2))}.
        - Every resolved date MUST appear in the table with the weekday the user named.
          If your candidate date's weekday does not match the user's word, you made an
          error — re-read the table and correct it.
    `;
}

app.post("/chat", async (req, res): Promise<any> => {
  const tReq = Date.now();
  if (!(await allowRequest(req, res))) return;
  const tRl = Date.now();
  const { command } = req.body;

  if (!command) {
    return res.status(400).send({ error: "Command is required" });
  }

  const systemPrompt = `
        You are a reminder parsing assistant for English and Hungarian. Parse reminder requests and return valid JSON.
        
        - Reminder Parsing Rules (Simple Format)
          - Set title for all reminders in English or Hungarian based on the command
          - Set description in English or Hungarian based on the command or null for all reminders
          - Set categories from one of these:
            - fitness, health, mind, todo, finance, creativity, social
          - Follow below instructions for remaining fields
          - syncToCalendar shall be true when user wants to sync the reminder to their calendar, otherwise false.
          - specificTime shall always be according to Current Date.
            - i.e. 10 minutes should be parsed as current date + 10 minutes
            - i.e. 2 pm should be parsed as current date at 14:00
          - Time Parsing Note for Hungarian
            - Times like "délután 2 óra", "14 óra", "14h", all mean 2 PM and should be parsed as 14:00 in 24-hour format.
            - And times like "hajnali 2 óra", "2 óra", "2h" all mean 2 AM and should be parsed as 02:00 in 24-hour format.
            - "1.00" in time context means "1 óra", "2.00" means "2 óra" and so on.


        - Specific One-Time Reminders
          - Use when it's a single reminder for a specific day and/or time
            or specific time but multiple days like today, tomorrow, etc.
          - Set:
            - type: "Once"
            - specificDates: [exact datetime in dd/mm/yyyy HH:mm (if no day specified then use current day)]
            - isRepeating: false
            - all remaining fields: null
          - Examples:
            - "meeting tomorrow at 2:30 PM"
            - "call Norbi on Monday at 2:30 PM"
            - "Ma, holnap és holnapután futni menni este 7kor"       
        
        - Repeating Reminders (Every X Minutes/Hours/Days etc)
          - Use when the reminder repeats every few minutes/hours/days etc
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Daily"
            - repeatDailyFrequency: "Interval"
            - isRepeating: true
            - intervalMinutes: the interval in minutes/hours etc
            - all remaining fields: null
          - Example:
            - "do pushups every 45 minutes"
            - "drink water every 2 hours"

        - Repeating with Time Range
          - Use when reminder repeats every few minutes/hours/days etc within a time range or has a start time
            or ending time or day like today, tomorrow, etc but repeat after a specific interval
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Daily"
            - repeatDailyFrequency: "Interval"
            - isRepeating: true
            - intervalMinutes: how often
            - startDate: when to start (format: dd/mm/yyyy HH:mm) (current time if today or 12 am if tomorrow etc)
            - endDate: when to stop (format: dd/mm/yyyy HH:mm) (or null) (11:59 pm if today, tomorrow etc)
            - all remaining fields: null
          - Examples:
            - "start jumping every 30 minutes from 12pm to 4pm"
            - "do meditation every 1 minute after 16:50"
            - "Emlékeztess ma, hogy óránként pihenjek
          
        - Repeating Reminders (Same day, specific times)
          - Use when the reminder repeats on the same day but different times
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Daily"
            - repeatDailyFrequency: "Specific Times"
            - isRepeating: true
            - dailySpecificTimes: array of times in format dd/mm/yyyy HH:mm (e.g. ["01/01/2023 10:00", "01/01/2023 11:00", "01/01/2023 12:00"])
            - all remaining fields: null
          - Example:
            - "do pushups on Monday at 6:00 AM and 6:00 PM"
            - "go far walk on Wednesday at 10:00 AM and 3:00 PM"

        - Repeating Reminders (Every X day, specific time)
          - Use when the reminder repeats on specific time after every x day
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Daily"
            - repeatDailyFrequency: "Every X Days"
            - isRepeating: true
            - repeatAfterDays: number of days to repeat after (or 1)
            - specificTime: exact time in format dd/mm/yyyy HH:mm (e.g. "01/01/2023 10:00")
            - all remaining fields: null
          - Example:
            - "do pushups every 2 days at 10:00 AM"
            - "do jogging every 3 days at 6:00 PM"
          
        - Weekly Reminders (Same time, specific days, x week)
          - Use when reminder repeats every x week on specific days but same time
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Weekly"
            - repeatWeeklyFrequency: "Simple Schedule"
            - isRepeating: false
            - weeklyTime: time (format HH:mm)
            - weekdays: array of numbers (1 = Sunday, 2 = Monday etc for English and 1 = Vasárnap, 2 = Hétfő etc for Hungarian)
            - repeatAfterWeeks: number of weeks to repeat after (or 1)
            - all remaining fields: null
          - Examples:
            - "take medicine every day at 8:00"
            - "go to gym every Monday and Friday at 6:00 PM"
            - "every 2 weeks go to market on Wednesday and Saturday at 10:00 AM"
          
        - Weekly Reminders (specific days + times, x week)
          - Use when reminder repeats every x week on specific days and times
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Weekly"
            - repeatWeeklyFrequency: "Advanced Schedule"
            - isRepeating: false
            - weeklySpecificTimes: array of times in format dd/mm/yyyy HH:mm (e.g. ["01/01/2023 10:00", "01/01/2023 11:00", "15/01/2023 12:00"])
            - repeatAfterWeeks: number of weeks to repeat after (or 1)
            - all remaining fields: null
          - Examples:
            - "go to market every Monday at 4:00 PM and Friday at 6:00 PM"
            - "every 2 weeks walk dog on Wednesday 9:00 AM and Saturday at 10:00 AM"

        - Monthly Reminders (Same month, specific days and time)
          - Use when reminder repeats on specific days in a month
          - Set:
            - type: "Repeat"
            - repeatFrequency: "Monthly"
            - isRepeating: false
            - monthlyDates: array of dates in format dd/mm/yyyy HH:mm (e.g. ["01/01/2023 10:00", "15/01/2023 10:00"])
            - all remaining fields: null
          - Examples:
            - "pay rent on 1 and 15 july at 10:00"
            - "appointment with doctor on 5 July at 3:00 PM and 20 July at 11:00 AM"

        - Pomodoro Reminders (Focus, Break, Pomodoro)
          - Use when the reminder follows the Pomodoro technique (i.e., alternating focus and break periods).
          - Set:
            - type: "Pomodoro"
            - isRepeating: false
            - pomodoroFocus: focus duration in minutes (e.g. 25)
            - pomodoroBreak: break duration in minutes (e.g. 5)
            - pomodoroCycles: total number of cycles (e.g. 4)
            - all remaining fields: null
          - Examples:
            - "Start a Pomodoro session with 25 minutes focus and 5 minutes break for 4 cycles"
            - "Kezdj egy Pomodoro munkamenetet 20 perc fókusz és 10 perc szünet, 3 ciklussal"

        IMPORTANT:
          - Return ONLY valid JSON without any markdown formatting, code blocks, or extra text.
          - When parsing day names (e.g. Monday / Hétfő) or relative-date phrases
            ("jövő hét csütörtök", "két hét múlva", "next Thursday", "in two weeks"),
            NEVER calculate the date yourself. A CALENDAR REFERENCE block with an
            exact date-to-weekday table and pre-resolved mappings is provided with
            the request — resolving any day or date expression MUST be a pure
            lookup in that block. The final resolved date's weekday must match the
            day name the user said, as verified against the table.
          - Do not use \`\`\`json or \`\`\` tags. Return single raw JSON only.
    `;

  const userPrompt = `
        Parse this reminder request: "${command}"
        ${calendarReference(command)}
        Return ONLY valid JSON in this exact format:
        {
            "title": "activity name",
            "description": "optional description or null",
            "type": "Once" or "Repeat", "Pomodoro",
            "repeatFrequency": "Daily" or "Weekly" or "Monthly",
            "repeatDailyFrequency": "Interval" or "Specific Times" or "Every X Days",
            "repeatWeeklyFrequency": "Simple Schedule" or "Advanced Schedule",
            "intervalMinutes": null or number,
            "dailySpecificTimes": null or ["dd/mm/yyyy HH:mm", "dd/mm/yyyy HH:mm"],
            "isRepeating": true or false,
            "category": "category name or null",
            "specificTime": null or "dd/mm/yyyy HH:mm",
            "specificDates": null or ["dd/mm/yyyy HH:mm"],
            "weeklyTime": null or "HH:mm",
            "weekdays": null or [1,2,3,4,5,6,7],
            "weeklySpecificTimes": null or ["dd/mm/yyyy HH:mm", "dd/mm/yyyy HH:mm"],
            "repeatAfterWeeks": null or number,
            "repeatAfterDays": null or number,
            "startDate": null or "dd/mm/yyyy HH:mm", 
            "endDate": null or "dd/mm/yyyy HH:mm",
            "monthlyDates": null or ["dd/mm/yyyy HH:mm", "dd/mm/yyyy HH:mm"]
            "pomodoroFocus": null or number,
            "pomodoroBreak": null or number,
            "pomodoroCycles": null or number,
            "syncToCalendar": true or false,
        }

        Remember: Return ONLY the JSON object, no extra text or formatting.
    `;

  const requestBody = {
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Okay, I understand. I will parse your reminder requests and return only valid JSON according to your specified format and rules." }] },
      { role: "user", parts: [{ text: userPrompt }] },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      ...THINKING_CONFIG,
    },
  };

  try {
    // /chat must return a SINGLE reminder object. Unwrap a top-level array (Pro wraps even
    // one reminder in [ ... ]); the helper retries on truncated/invalid JSON.
    const out = await generateNormalisedJson(requestBody, (parsed) => {
      const obj = Array.isArray(parsed) ? parsed[0] : parsed;
      return obj && typeof obj === "object" ? JSON.stringify(obj) : null;
    });
    res.setHeader("x-diag", `rl=${tRl - tReq}ms gemini=${Date.now() - tRl}ms ${LAST_GEMINI_DIAG}`);
    res.send(out);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).send({ error: `Failed to fetch response from Gemini\n${error}` });
  }
});

app.post("/timeline", async (req, res): Promise<any> => {
  if (!(await allowRequest(req, res))) return;
  const { command } = req.body;

  if (!command) {
    return res.status(400).send({ error: "Command is required" });
  }

  const systemPrompt = `
        You are a task timeline parsing assistant for English and Hungarian. Your goal is to parse user commands and return a valid JSON array of task objects.

        - Task Parsing Rules:
          - For each task identified in the command, create a separate JSON object within the array.
          - Set 'title' for each task in English or Hungarian based on the command.
          - Set 'description' in English or Hungarian based on the command, or null if no specific description is provided.
          - Set 'category' from one of these: fitness, health, mind, todo, finance, creativity, social. Choose the most relevant category.
          - Set 'syncToCalendar' true when user wants to sync the task to their calendar, otherwise false.
          - 'startTime' and 'endTime' shall always be in 'dd/mm/yyyy HH:mm' format.
            - If only a time is specified (e.g., "10 AM"), assume it's for the current date.
            - If a duration is given (e.g., "2-hour workout"), calculate 'endTime' based on 'startTime' and the duration.
            - If no duration is specified for a task, infer a default duration of 30 minutes.
            - Times like "10 minutes" should be parsed as current date + 10 minutes for startTime, and an appropriate endTime.
            - Times like "2 pm" should be parsed as current date at 14:00.

          - Time Parsing Note for Hungarian:
            - Times like "délután 2 óra", "14 óra", "14h" all mean 2 PM and should be parsed as 14:00 in 24-hour format.
            - And times like "hajnali 2 óra", "2 óra", "2h" all mean 2 AM and should be parsed as 02:00 in 24-hour format.

        IMPORTANT:
          - Return ONLY valid JSON without any markdown formatting, code blocks, or extra text.
          - When parsing day names (e.g. Monday / Hétfő) or relative-date phrases
            ("jövő hét csütörtök", "két hét múlva", "next Thursday", "in two weeks"),
            NEVER calculate the date yourself. A CALENDAR REFERENCE block with an
            exact date-to-weekday table and pre-resolved mappings is provided with
            the request — resolving any day or date expression MUST be a pure
            lookup in that block. The final resolved date's weekday must match the
            day name the user said, as verified against the table.
          - Do not use \`\`\`json or \`\`\` tags. Return single raw JSON only.
    `;

  const userPrompt = `
        Parse this task timeline request: "${command}"
        ${calendarReference(command)}
        Return ONLY valid JSON in this exact format (an array of task objects):
        [
            {
                "title": "activity name",
                "description": "optional description or null",
                "category": "category name",
                "startTime": "dd/mm/yyyy HH:mm",
                "endTime": "dd/mm/yyyy HH:mm",
                "syncToCalendar": true or false,
            },
            {
                "title": "another activity name",
                "description": "optional description or null",
                "category": "category name",
                "startTime": "dd/mm/yyyy HH:mm",
                "endTime": "dd/mm/yyyy HH:mm",
                "syncToCalendar": true or false,
            }
            // ... more task objects if applicable
        ]

        Remember: Return ONLY the JSON array, no extra text or formatting.
    `;

  const requestBody = {
    contents: [
      { role: "user", parts: [{ text: systemPrompt }] },
      { role: "model", parts: [{ text: "Okay, I understand. I will parse your task timeline requests and return only valid JSON according to your specified format and rules, as an array of task objects." }] },
      { role: "user", parts: [{ text: userPrompt }] },
    ],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
      ...THINKING_CONFIG,
    },
  };

  try {
    // /timeline must return a JSON ARRAY of task objects. Wrap a bare object (one-task day);
    // the helper retries on truncated/invalid JSON.
    const out = await generateNormalisedJson(requestBody, (parsed) => {
      if (Array.isArray(parsed)) return JSON.stringify(parsed);
      return parsed && typeof parsed === "object" ? JSON.stringify([parsed]) : null;
    });
    res.send(out);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).send({ error: `Failed to fetch response from Gemini\n${error}` });
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;