import { addDays, format, isValid } from 'date-fns'

export default function dayRange(start: string, end: string): string[] {
  if (!isValid(new Date(start))) throw `start date: ${start} is not valid`
  if (!isValid(new Date(end))) throw `end date: ${end} is not valid`
  if (start > end) throw `${start} is great than ${end}`

  const dates = [start]
  let newDate = start
  while (newDate !== end) {
    newDate = format(addDays(newDate, 1), 'yyyy-MM-dd')
    dates.push(newDate)
  }
  return dates
}
