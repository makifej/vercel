// Játékidő. Alapesetben azonos a valós idővel; a prototípusban bekapcsolható
// időgyorsítás (PRD 7.16: csak teszteléshez) a valós időből lineárisan képez.

export interface TimeScale {
  scale: number;
  anchorReal: number;
  anchorVirtual: number;
}

export const REAL_TIME: TimeScale = { scale: 1, anchorReal: 0, anchorVirtual: 0 };

export function virtualNow(ts: TimeScale, real: number = Date.now()): number {
  return ts.anchorVirtual + (real - ts.anchorReal) * ts.scale;
}

export function toReal(ts: TimeScale, virtualMs: number): number {
  return ts.anchorReal + (virtualMs - ts.anchorVirtual) / ts.scale;
}

/** Új szorzó; a játékidő folytonos marad (nem ugrik vissza). */
export function rescale(ts: TimeScale, scale: number, real: number = Date.now()): TimeScale {
  return { scale, anchorReal: real, anchorVirtual: virtualNow(ts, real) };
}
