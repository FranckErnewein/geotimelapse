import { FC } from 'react'
import styled from 'styled-components'
import { max, values as _values } from 'lodash'
import { ActivityProps } from '../types'

const Container = styled.div`
  background: rgba(0, 0, 0, 0.5);
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  position: absolute;
  bottom: 30px;
  left: 0;
`

const Mask = styled.div`
  background: black;
  position: absolute;
  width: 100%;
  bottom: -30px;
  height: 30px;
  left: 0;
`

const Bar = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  position: absolute;
  bottom: 0;
  transition: height 250ms;
`

const Mark = styled.div`
  color: white;
  border-bottom: 1px dotted white;
  position: absolute;
  opacity: 0.3;
  left: 0;
  width: 100%;
  transition: bottom 250ms;
`

const Activity: FC<ActivityProps & { width: number }> = ({ values, width }) => {
  const keys = Object.keys(values)
  if (keys.length === 0) return null

  const height = 200
  const maxValue = Math.max(max(_values(values)) || 0, 10)
  const barWidth = width / keys.length

  const power10 = [1, 10, 100, 1000, 10000, 100000].find(
    (p) => maxValue / p < 10 && maxValue / p > 1
  )
  const mark =
    maxValue > 10 ? (power10 ? maxValue - (maxValue % power10) : 0) : 5

  return (
    <Container style={{ height, width }}>
      <Mask />
      {Object.keys(values)
        .sort()
        .map((date: string, i: number) => {
          const value = values[date]
          return (
            <Bar
              title={`${date}:${value}`}
              key={date}
              style={{
                left: barWidth * i,
                width: barWidth - 2,
                height: Math.max((value / maxValue) * height - 1, 0),
              }}
            />
          )
        })}
      <Mark style={{ bottom: Math.max((mark / maxValue) * height - 1, 0) }}>
        {mark}
      </Mark>
    </Container>
  )
}

export default Activity
