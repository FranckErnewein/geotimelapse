export default function formatNumber(x: number): string {
  const chars = x.toString().split('').reverse()
  return chars.reduce((memo, n, i) => {
    return i % 3 === 0 ? `${n} ${memo}` : n + memo
  }, '')
}
