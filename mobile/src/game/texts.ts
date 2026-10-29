// Magyar felületi szövegek. Szabály (PRD 9.4): a játékos által adott névhez
// nem fűzünk ragot, a név mindig alanyesetben áll. Hangnem: tárgyszerű,
// barátságos; bűntudatkeltés, sürgetés és felkiáltójeles nyomás tilos.

import type {
  CareAction,
  DeathCause,
  FormId,
  MemorialCause,
  Mode,
  PetState,
  RejectReason,
  SimEvent,
  Stage,
  TraitId,
} from '../sim';

export const FORM_NAMES: Record<FormId, string> = {
  gomboc: 'Gömböc',
  csillagszemu: 'Csillagszemű',
  kope: 'Kópé',
  legenda: 'Legenda',
  ragyogo: 'Ragyogó',
  kiegyensulyozott: 'Kiegyensúlyozott',
  joszivu: 'Jószívű',
  durcas: 'Durcás',
  mokamester: 'Mókamester',
  nyugos: 'Nyűgös',
};

export const STAGE_NAMES: Record<Stage, string> = {
  egg: 'tojás',
  baby: 'bébi',
  child: 'gyerek',
  teen: 'kamasz',
  adult: 'felnőtt',
  senior: 'idős',
};

export const TRAIT_NAMES: Record<TraitId, string> = {
  falank: 'Falánk',
  jatekos: 'Játékos',
  almos: 'Álmos',
  rendes: 'Rendes',
  bujos: 'Bújós',
  kivancsi: 'Kíváncsi',
};

export const MODE_NAMES: Record<Mode, string> = { alap: 'Alap', klasszikus: 'Klasszikus' };

export const CAUSE_NAMES: Record<MemorialCause, string> = {
  oregkor: 'Öregkor',
  elhanyagolas: 'Elhanyagolás',
  betegseg: 'Betegség',
  nagyinal: 'Nagyinál él',
};

export const ACTION_LABELS: Record<CareAction['type'], string> = {
  feed: 'Étel',
  snack: 'Nasi',
  play: 'Játék',
  pet: 'Simogatás',
  clean: 'Takarítás',
  medicine: 'Gyógyszer',
  scold: 'Szidás',
  lights: 'Villany',
};

export const REJECT_TEXT: Record<RejectReason, string> = {
  notAlive: 'Most nem lehet.',
  asleep: 'Alszik. Majd ébredés után.',
  awake: 'Még ébren van, villanyoltás elalváskor.',
  full: 'Jóllakott, most nem kér.',
  tired: 'Fáradt, előbb pihennie kell.',
  sick: 'Betegen nem játszik.',
  notSick: 'Nem beteg.',
  tooSoon: 'A következő adag egy perc múlva adható.',
  petLimit: 'Óránként háromszor lehet simogatni.',
  nothingToClean: 'Nincs mit takarítani.',
  vacation: 'Szabadságon van.',
};

export function stageLabel(p: PetState): string {
  if (p.status === 'egg') return 'tojás';
  const form = p.form ? FORM_NAMES[p.form] : null;
  return form && p.stage !== 'baby' ? `${STAGE_NAMES[p.stage]} · ${form}` : STAGE_NAMES[p.stage];
}

export function hearts(value: number): number {
  return Math.max(0, Math.min(4, Math.ceil(value / 25)));
}

export function healthLabel(p: PetState): string {
  if (p.critical) return 'Kritikus';
  if (p.health >= 50) return 'Jó';
  return 'Gyengélkedik';
}

export function formatClock(ms: number): string {
  const d = new Date(ms);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export function formatDate(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}. ${String(d.getMonth() + 1).padStart(2, '0')}. ${String(d.getDate()).padStart(2, '0')}.`;
}

/** „ma 14:20”, „holnap 08:10” vagy dátum. */
export function formatWhen(ms: number, now: number): string {
  const day = (t: number) => {
    const d = new Date(t);
    return d.getFullYear() * 10000 + d.getMonth() * 100 + d.getDate();
  };
  const diffDays = Math.round((startOfDay(ms) - startOfDay(now)) / 86_400_000);
  if (day(ms) === day(now)) return `ma ${formatClock(ms)}`;
  if (diffDays === 1) return `holnap ${formatClock(ms)}`;
  return `${formatDate(ms)} ${formatClock(ms)}`;
}

function startOfDay(ms: number): number {
  const d = new Date(ms);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/** Rövid, semleges eseményszöveg a főképernyő sávjához. */
export function eventText(e: SimEvent, name: string): string | null {
  switch (e.type) {
    case 'hatched':
      return `${name} kikelt.`;
    case 'evolved':
      return `${name} ${STAGE_NAMES[e.stage ?? 'child']} lett${e.form ? `: ${FORM_NAMES[e.form]}` : ''}.`;
    case 'senior':
      return `${name} idős korba lépett.`;
    case 'farewell':
      return `${name} búcsúzik. Ez az utolsó napja.`;
    case 'poop':
      return 'Kaki került a képernyőre.';
    case 'sick':
      return `${name} megbetegedett.`;
    case 'cured':
      return `${name} meggyógyult.`;
    case 'call':
      if (e.call === 'hunger') return `${name} megéhezett.`;
      if (e.call === 'happiness') return `${name} unatkozik.`;
      return `${name} rosszalkodik.`;
    case 'weak':
      return `${name} gyengélkedik.`;
    case 'critical':
      return `${name} állapota kritikus.`;
    case 'rescued':
      return `${name} túl van a nehezén. Lábadozik.`;
    case 'nagyi':
      return `${name} átment Nagyihoz.`;
    case 'fellAsleep':
      return `${name} elaludt.`;
    case 'woke':
      return `${name} felébredt.`;
    case 'daycareStart':
      return `${name} napköziben van.`;
    case 'daycareEnd':
      return `${name} hazajött a napköziből.`;
    case 'vacationEnd':
      return 'A szabadság véget ért.';
    default:
      return null;
  }
}

/** Visszatérési összefoglaló, szemrehányó szöveg nélkül (PRD 8.4). */
export function absenceSummary(events: SimEvent[]): string | null {
  const count = (type: SimEvent['type']) => events.filter((e) => e.type === type).length;
  const parts: string[] = [];
  const poops = count('poop');
  const sick = count('sick');
  const mistakes = count('mistake');
  const evolved = events.filter((e) => e.type === 'evolved' || e.type === 'senior').length;
  if (poops) parts.push(`${poops} kaki`);
  if (sick) parts.push(sick === 1 ? 'egy betegség' : `${sick} betegség`);
  if (mistakes) parts.push(`${mistakes} gondozási hiba`);
  if (evolved) parts.push(evolved === 1 ? 'egy fejlődés' : `${evolved} fejlődés`);
  if (count('critical')) parts.push('kritikus állapot');
  if (count('nagyi')) parts.push('átköltözés Nagyihoz');
  if (parts.length === 0) return null;
  return `Távollétedben: ${parts.join(', ')}.`;
}

export function deathText(cause: DeathCause, name: string): string {
  if (cause === 'oregkor') return `${name} hosszú, teljes életet élt. Elaludt, és nem ébredt fel többé. Egy tojást hagyott hátra.`;
  if (cause === 'betegseg') return `${name} betegsége erősebb volt nála. Az emlékkertben megőrizzük.`;
  return `${name} nem élte túl a kritikus állapotot. Az emlékkertben megőrizzük.`;
}
