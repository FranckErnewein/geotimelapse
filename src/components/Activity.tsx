import { FC } from 'react'
import styled from 'styled-components'
import { max, values as _values } from 'lodash'
import { ActivityProps } from '../types'

const Bar = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  position: absolute;
  bottom: 0;
  transition: height 250ms;
`

const Activity: FC<ActivityProps & { width: number }> = ({ values, width }) => {
  const keys = Object.keys(values)
  if (keys.length === 0) return null

  const height = 200
  const maxValue = max(_values(values)) || 0
  const barWidth = Math.floor(width / keys.length)

  return (
    <div style={{ height, width }}>
      {Object.keys(values)
        .sort()
        .map((date: string, i: number) => {
          const value = values[date]
          return (
            <Bar
              title={`${date}:${value}`}
              key={date}
              style={{
                left: (barWidth + 1) * i,
                width: barWidth,
                height: Math.max((value / maxValue) * height - 1, 0),
              }}
            />
          )
        })}
    </div>
  )
}

export default Activity
