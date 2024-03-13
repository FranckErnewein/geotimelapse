import { FC } from 'react'
import styled, { keyframes } from 'styled-components'
import { max, values as _values } from 'lodash'
import yMarker from '../utils/yMarker'
import formatNumber from '../utils/formatNumber'
import { ActivityProps } from '../types'

const fadeIn = keyframes`
  0% { opacity: 0 }
  100% { opacity: 1 }
`

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

const calculHeight =
  (maxValue: number, height: number) =>
  (value: number): number =>
    Math.max((value / maxValue) * height - 1, 0)

const Bar = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.3);
  border-left: 1px solid rgba(255, 255, 255, 0.3);
  position: absolute;
  bottom: 0;
  transition: height 250ms;
`

const Mark = styled.div`
  color: rgba(255, 255, 255, 0.4);
  border-bottom: 1px dashed rgba(225, 255, 255, 0.2);
  position: absolute;
  left: 0;
  width: 100%;
  transition: bottom 250ms;
  animation: 250ms linear 1 normal forwards ${fadeIn};
`

const Activity: FC<ActivityProps & { width: number }> = ({ values, width }) => {
  const keys = Object.keys(values)
  if (keys.length === 0) return null

  const height = 200
  const maxValue = Math.max(max(_values(values)) || 0, 2)
  const barWidth = width / keys.length
  const getHeight = calculHeight(maxValue, height)

  return (
    <Container style={{ height, width }}>
      <Mask />
      {yMarker(maxValue).map((mark, i) => {
        return (
          <Mark key={i} style={{ bottom: getHeight(mark) }}>
            {formatNumber(mark)}
          </Mark>
        )
      })}
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
                height: getHeight(value),
              }}
            />
          )
        })}
    </Container>
  )
}

export default Activity
