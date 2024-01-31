import { FC, useContext } from 'react'
import styled from 'styled-components'
import { mapValues, groupBy, max, min, values } from 'lodash'
import { useWindowSize } from '@uidotdev/usehooks'
import DataContext from '../contexts/DataContext'
import dayRange from '../utils/dayRange'

interface ActivityProps {}

const Bar = styled.div`
  background: rgba(0, 0, 0, 0.5);
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  position: absolute;
  bottom: 0;
`

const Activity: FC<ActivityProps> = () => {
  const { data } = useContext(DataContext)
  const { width } = useWindowSize()

  if (!width) return null

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
  const height = 400
  const maxValue = max(values(activity)) || 0
  const barCount = keys.length
  const barWidth = Math.floor(width / barCount)

  return (
    <div style={{ height, width: width || '100%' }}>
      {Object.keys(activity)
        .sort()
        .map((date: string, i: number) => {
          const value = activity[date]
          return (
            <Bar
              title={`${date}:${value}`}
              key={date}
              style={{
                left: (barWidth + 1) * i,
                width: barWidth,
                height: (value / maxValue) * height,
              }}
            />
          )
        })}
    </div>
  )
}

export default Activity
