import { ALL_SPRITES } from '../sprites';

describe('sprite-ok', () => {
  it.each(Object.entries(ALL_SPRITES))('%s négyzetes és csak ismert jeleket használ', (_name, sprite) => {
    const size = sprite.length;
    expect([8, 16]).toContain(size);
    for (const row of sprite) {
      expect(row).toHaveLength(size);
      expect(row).toMatch(/^[.oblewca]+$/);
    }
  });
});
