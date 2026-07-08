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

app.post("/chat", async (req, res): Promise<any> => {
  if (!(await allowRequest(req, res))) return;
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
          - When parsing day names (e.g. Monday / Hétfő), resolve them to the next correct calendar date using the following rule:
            - Compare the target weekday to the current date’s weekday.
            - If the day is **later in the week**, move forward to that day this week.
            - If the day is **today but the time has already passed**, or if the day is **earlier in the week**, move to that day **next week**.
            - Always ensure the final resolved date’s weekday **matches the name provided** (e.g. "Friday" must resolve to a date where weekday = 6).
          - Do not use \`\`\`json or \`\`\` tags. Return single raw JSON only.
    `;

  const userPrompt = `
        Parse this reminder request: "${command}"
        
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
    },
  };

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.send(response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    res.status(500).send({ error: `Failed to fetch response from OpenAI\n${error}` });
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
          - When parsing day names (e.g. Monday / Hétfő), resolve them to the next correct calendar date using the following rule:
            - Compare the target weekday to the current date's weekday.
            - If the day is **later in the week**, move forward to that day this week.
            - If the day is **today but the time has already passed**, or if the day is **earlier in the week**, move to that day **next week**.
            - Always ensure the final resolved date's weekday **matches the name provided** (e.g. "Friday" must resolve to a date where weekday = 6).
          - Do not use \`\`\`json or \`\`\` tags. Return single raw JSON only.
    `;

  const userPrompt = `
        Parse this task timeline request: "${command}"
        
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
    },
  };

  try {
    const response = await axios.post(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    res.send(response.data.candidates[0].content.parts[0].text);
  } catch (error) {
    console.error("Error calling Gemini API:", error);
    res.status(500).send({ error: `Failed to fetch response from Gemini\n${error}` });
  }
});

app.listen(3000, () => console.log("Server ready on port 3000."));

module.exports = app;