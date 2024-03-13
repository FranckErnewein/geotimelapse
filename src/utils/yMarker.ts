import { range } from 'lodash'

export default function yMarker(maxValue: number): number[] {
  if (maxValue === 1 || maxValue === 0) return [1, 2]

  const power10 =
    [1, 10, 100, 1000, 10000, 100000].find(
      (p) => maxValue / p <= 10 && maxValue / p > 1
    ) ?? 1

  if (maxValue === power10) return [maxValue]
  const maxMark = maxValue - (maxValue % power10)

  if (maxMark === power10) return [maxMark]
  return range(power10, maxMark + power10, power10)
}
