import { FC, useContext } from 'react'
import { sortBy, keys } from 'lodash'
import { useWindowSize } from '@uidotdev/usehooks'
import DataContext from '../contexts/DataContext'

interface ActivityProps {}

interface DailyActivity {
  count: number
  amount: number
}

const Activity: FC<ActivityProps> = () => {
  const { data } = useContext(DataContext)
  const { width } = useWindowSize()

  const activity: { [date: string]: DailyActivity } = data.slice(1).reduce(
    (memo, item) => {
      const date = item.date as string
      if (!memo[date]) memo[date] = { count: 0, amount: 0 }
      const value = parseFloat(item.date as string)
      if (typeof value === 'number' && !isNaN(value)) {
        memo[date].amount += value
      }
      memo[date].count++
      return memo
    },
    {} as { [date: string]: DailyActivity }
  )
  const days = keys(activity).map((day) => ({
    date: day,
    ...activity[day],
  }))
  const byAmount = sortBy(days, 'amount')
  const byOperations = sortBy(days, 'count')

  console.log('by amount', byAmount)
  console.log('by count', byOperations)

  return <div style={{ width: width || '100%' }}>Activity</div>
}

export default Activity
