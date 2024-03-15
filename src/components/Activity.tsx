import { FC } from 'react'
import styled, { keyframes } from 'styled-components'
import { max, values as _values } from 'lodash'
import { format, differenceInDays, addDays } from 'date-fns'
import { DraggableCore } from 'react-draggable'
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

const Bar = styled.div`
  background: rgba(255, 255, 255, 0.1);
  border-top: 1px solid rgba(255, 255, 255, 0.5);
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
  text-indent: 5px;
`

const ToDateMark = styled.div`
  position: absolute;
  height: 100%;
  top: 0;
  width: 1px;
  border-left: 1px solid rgba(225, 255, 255, 0.7);
  border-right: 1px solid rgba(225, 255, 255, 0.7);
`

const FromDateMark = styled.div`
  position: absolute;
  height: 100%;
  top: 0;
  width: 1px;
  border-left: 1px dotted rgba(225, 255, 255, 0.7);
  border-right: 1px dotted rgba(225, 255, 255, 0.7);
`

const calculHeight =
  (maxValue: number, height: number) =>
  (value: number): number =>
    Math.max((value / maxValue) * height - 1, 0)

const Activity: FC<
  ActivityProps & {
    width: number
    from: string
    to: string
    setToDate: (date: string) => void
    setFromDate: (date: string) => void
  }
> = ({ values, width, to, from, setToDate, setFromDate }) => {
  const dates = Object.keys(values).sort()
  if (dates.length === 0) return null

  const dayWidth = Math.floor(width / dates.length)
  const graphWidth = dayWidth * dates.length
  const height = 200
  const maxValue = Math.max(max(_values(values)) || 0, 2)
  const getHeight = calculHeight(maxValue, height)

  return (
    <Container
      style={{
        height,
        width: graphWidth,
        left: (width - graphWidth) / 2,
      }}
    >
      <Mask />
      {yMarker(maxValue).map((mark, i) => {
        return (
          <Mark key={i} style={{ bottom: getHeight(mark) }}>
            {formatNumber(mark)}
          </Mark>
        )
      })}
      {dates.map((date: string, i: number) => {
        const value = values[date]
        return (
          <Bar
            title={`${date}:${value}`}
            key={date}
            style={{
              left: dayWidth * i,
              width: dayWidth - 2,
              height: getHeight(value),
            }}
          />
        )
      })}
      <DraggableCore
        onDrag={(_, { x }) => {
          setToDate(
            format(addDays(dates[0], Math.floor(x / dayWidth)), 'yyyy-MM-dd')
          )
        }}
      >
        <ToDateMark
          style={{ left: differenceInDays(to, dates[0]) * dayWidth }}
        />
      </DraggableCore>
      <DraggableCore
        onDrag={(_, { x }) => {
          setFromDate(
            format(addDays(dates[0], Math.floor(x / dayWidth)), 'yyyy-MM-dd')
          )
        }}
      >
        <FromDateMark
          style={{ left: differenceInDays(from, dates[0]) * dayWidth }}
        />
      </DraggableCore>
    </Container>
  )
}

export default Activity
