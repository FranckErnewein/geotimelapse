import { head, last, groupBy, mapValues, sum, keyBy } from 'lodash'
import {
  formatISO,
  differenceInHours,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  eachHourOfInterval,
  eachDayOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  startOfHour,
  startOfDay,
  startOfMonth,
  startOfYear,
} from 'date-fns'
import { Item, ActivityProps } from '../types'

const durations = [
  { delta: differenceInHours, interval: eachHourOfInterval, key: startOfHour },
  { delta: differenceInDays, interval: eachDayOfInterval, key: startOfDay },
  {
    delta: differenceInMonths,
    interval: eachMonthOfInterval,
    key: startOfMonth,
  },
  { delta: differenceInYears, interval: eachYearOfInterval, key: startOfYear },
] as const

export default function getActivity(items: Item[]): ActivityProps {
  const start = head(items)?.date
  const end = last(items)?.date
  if (!start || !end) throw 'not enough items'

  const duration = durations.find((duration) => {
    return duration.delta(end, start) < 1000
  })

  if (!duration) throw 'time range too long'

  const allTime = duration.interval({ start, end }).map((t) => formatISO(t))
  const activityByDate: { [date: string]: { value: number; count: number } } = {
    ...mapValues(keyBy(allTime), () => ({
      count: 0,
      value: 0,
    })),
    ...mapValues(
      groupBy(items, (item: Item) => formatISO(duration.key(item.date))),
      (items) => {
        return {
          count: items.length,
          value: sum(items.map((item) => item.value)),
        }
      }
    ),
  }

  return {
    startDate: start,
    endDate: end,
    activity: Object.keys(activityByDate)
      .sort()
      .map((date) => ({
        date,
        ...activityByDate[date],
      })),
  }
}
