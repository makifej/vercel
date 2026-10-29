import { memo } from 'react';
import { View } from 'react-native';
import type { Sprite } from './sprites';

export interface SpriteColors {
  o: string;
  b: string;
  l: string;
  e: string;
  w: string;
  c: string;
  a: string;
}

interface Props {
  sprite: Sprite;
  colors: SpriteColors;
  pixel: number;
  flip?: boolean;
}

/** Pixelart kirajzolása sorokba rendezett nézetekből, legközelebbi szomszéd skálázással. */
function PixelSpriteImpl({ sprite, colors, pixel, flip }: Props) {
  return (
    <View style={{ transform: [{ scaleX: flip ? -1 : 1 }] }}>
      {sprite.map((row, y) => (
        <View key={y} style={{ flexDirection: 'row' }}>
          {Array.from(row).map((ch, x) => (
            <View
              key={x}
              style={{
                width: pixel,
                height: pixel,
                backgroundColor: ch === '.' ? 'transparent' : colors[ch as keyof SpriteColors],
              }}
            />
          ))}
        </View>
      ))}
    </View>
  );
}

export const PixelSprite = memo(PixelSpriteImpl);
