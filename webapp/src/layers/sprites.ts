import type { IconMapping } from '@deck.gl/layers/dist/icon-layer/icon-manager'
import { lightGenerator, renderer } from '../lightGenerator'
import { range, map, keyBy, compose, mapValues, omit } from 'lodash/fp'

export function generateSprites(iconCount: number, iconSize: number): string {
  const canvas = document.createElement('canvas')
  const width = iconSize * iconCount
  canvas.width = width
  canvas.height = iconSize

  const ctx = canvas.getContext('2d')
  if (!ctx) throw 'can not access to canvas context'
  const { create } = lightGenerator()
  const draw = renderer(ctx, {
    pointColor: [255, 255, 255],
    pointOpacity: 0.9,
    lineOpacity: 0.1,
    lineColor: [170, 220, 255],
  })
  range(0, iconCount).forEach((i: number) => {
    const light = create(
      iconSize * i + Math.floor(iconSize / 2),
      Math.floor(iconSize / 2)
    )
    draw(light)
  })

  return canvas.toDataURL()
}

export function generateSpritesMapping(
  iconCount: number,
  iconSize: number
): IconMapping {
  return compose(
    mapValues(omit('name')),
    keyBy('name'),
    map((i: number) => ({
      name: `icon${i}`,
      x: i * iconSize,
      y: 0,
      width: iconSize,
      height: iconSize,
      mask: false,
    }))
  )(range(0, iconCount))
}
