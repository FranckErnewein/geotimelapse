import { FC } from 'react'
import styled from 'styled-components'
import { mapValues, groupBy, max, min, values } from 'lodash'
import dayRange from '../utils/dayRange'
import { Item } from '../types'

interface ActivityProps {
  data: Item[]
  width: number
}

const Bar = styled.div`
  background: rgba(255, 255, 255, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  position: absolute;
  bottom: 0;
`

const Activity: FC<ActivityProps> = ({ data, width }) => {
  if (data.length === 0) return null

  const activity: { [date: string]: number } = mapValues(
    groupBy(data, 'date_mutation'),
    (x) => x.length
  )
  const keys = Object.keys(activity)
  const start = min(keys)
  const end = max(keys)
  if (!start || !end) return null
  const range = dayRange(start, end)
  range.forEach((day) => {
    if (!activity[day]) activity[day] = 0
  })
  const height = 200
  const maxValue = max(values(activity)) || 0
  const barCount = keys.length
  const barWidth = Math.floor(width / barCount)

  return (
    <div style={{ height, width }}>
      {Object.keys(activity)
        .sort()
        .map((date: string, i: number) => {
          const value = activity[date]
          return value === 0 ? null : (
            <Bar
              title={`${date}:${value}`}
              key={date}
              style={{
                left: (barWidth + 1) * i,
                width: barWidth,
                height: (value / maxValue) * height - 1,
              }}
            />
          )
        })}
    </div>
  )
}

export default Activity
