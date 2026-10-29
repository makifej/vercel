// Retro LCD-hangulatú színek. Az állapot sosem csak színnel kódolt (NFR-10):
// minden jelző mellett szöveg vagy ikon is van.

export const colors = {
  bg: '#1d2420',
  card: '#27302a',
  cardAlt: '#2f3a33',
  border: '#3d4a41',
  text: '#eef3ea',
  textDim: '#a9b8aa',
  accent: '#f2c94c',
  accentText: '#1d2420',
  danger: '#ff8a7a',
  ok: '#8fd19e',
  lcd: '#c9d8b6',
  lcdDark: '#1f2a1f',
  lcdDim: '#9fb08f',
  overlay: 'rgba(15, 20, 15, 0.72)',
};

export const PALETTES: { name: string; body: string; light: string }[] = [
  { name: 'Citrom', body: '#f2c94c', light: '#fbe7a1' },
  { name: 'Barack', body: '#f2994a', light: '#f8c79a' },
  { name: 'Menta', body: '#6fcf97', light: '#b5e8c9' },
  { name: 'Ég', body: '#56ccf2', light: '#a9e5f8' },
  { name: 'Levendula', body: '#bb6bd9', light: '#ddb4ec' },
  { name: 'Rózsa', body: '#eb7fa3', light: '#f5bdd0' },
  { name: 'Homok', body: '#d4b483', light: '#e9d8bd' },
  { name: 'Kavics', body: '#9aa5b1', light: '#ccd2d8' },
];

export const SENIOR_TINT = { body: '#c7c2b8', light: '#e4e0d8' };

export const spacing = (n: number) => n * 4;

export const font = {
  mono: 'monospace',
};
