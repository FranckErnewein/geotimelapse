import { FC, useState, useRef } from 'react'
import { DraggableCore } from 'react-draggable'
import { format, differenceInDays, addDays } from 'date-fns'
import styled from 'styled-components'

import { frameRate } from '../constants'

const labelWidth = 90

const Container = styled.div`
  .delta {
    color: white;
    font-size: 13px;
    background: rgba(0, 0, 0, 0.7);
    padding: 3px;
    border-radius: 3px;
    text-align: center;
  }
`

const DateArea = styled.div`
  position: absolute;
  height: 100%;
  top: 0;
  cursor: move;
  cursor: grab;
  background-color: rgba(255, 255, 255, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  transition:
    left ${frameRate}ms,
    width ${frameRate}ms;
  &:active {
    cursor: grabbing;
  }
`

const DateAreaLimit = styled.div`
  position: absolute;
  height: 100%;
  top: 0;
  width: 4px;
  background-color: white;
  opacity: 0.6;
  cursor: ew-resize;
  transition: left ${frameRate}ms;
  &:hover {
    opacity: 0.8;
  }
`

const DateLabel = styled.div`
  position: absolute;
  bottom: 100%;
  color: white;
  width: ${labelWidth}px;
  font-size: 11px;
  &.center {
    margin-left: -${labelWidth / 2}px;
    text-align: center;
  }
  &.left {
    text-align: right;
    margin-left: -${labelWidth - 2}px;
  }
  &.right {
    text-align: left;
    margin-left: 0px;
  }
`

interface Props {
  firstDate: string
  lastDate: string
  from: string
  to: string
  dayWidth: number
  setToDate: (date: string) => void
  setFromDate: (date: string) => void
  setPlay: (isPlaying: boolean) => void
}

const ActivityFocusArea: FC<Props> = ({
  setFromDate,
  setToDate,
  setPlay,
  firstDate,
  from,
  to,
  dayWidth,
}) => {
  const [displayDelta, setDisplayDelta] = useState<boolean>(false)
  const dateAreaRef = useRef<HTMLDivElement>(null)
  const toLimitRef = useRef<HTMLDivElement>(null)
  const fromLimitRef = useRef<HTMLDivElement>(null)

  const toLeft = differenceInDays(to, firstDate) * dayWidth
  const fromLeft = differenceInDays(from, firstDate) * dayWidth
  const daysDelta = differenceInDays(to, from)
  const daysDeltaWidth = toLeft - fromLeft
  return (
    <Container>
      <DraggableCore
        nodeRef={dateAreaRef}
        onStart={() => setPlay(false)}
        onDrag={(_, { x }) => {
          const halfDaysDelta = Math.round(daysDelta / 2)
          const date = addDays(firstDate, Math.floor(x / dayWidth))
          setFromDate(format(addDays(date, -halfDaysDelta), 'yyyy-MM-dd'))
          setToDate(format(addDays(date, halfDaysDelta), 'yyyy-MM-dd'))
        }}
      >
        <DateArea ref={dateAreaRef} style={{ left: fromLeft, width: daysDeltaWidth }}>
          {displayDelta && <div className="delta">{daysDelta} days</div>}
        </DateArea>
      </DraggableCore>
      <DraggableCore
        nodeRef={toLimitRef}
        onStart={() => setDisplayDelta(true)}
        onStop={() => setDisplayDelta(false)}
        onDrag={(_, { x }) => {
          setToDate(
            format(addDays(firstDate, Math.floor(x / dayWidth)), 'yyyy-MM-dd')
          )
        }}
      >
        <DateAreaLimit ref={toLimitRef} style={{ left: toLeft }}>
          <DateLabel
            className={daysDeltaWidth > labelWidth ? 'center' : 'right'}
          >
            {format(to, 'd MMM yyyy')}
          </DateLabel>
        </DateAreaLimit>
      </DraggableCore>
      <DraggableCore
        nodeRef={fromLimitRef}
        onStart={() => setDisplayDelta(true)}
        onStop={() => setDisplayDelta(false)}
        onDrag={(_, { x }) => {
          setFromDate(
            format(addDays(firstDate, Math.floor(x / dayWidth)), 'yyyy-MM-dd')
          )
        }}
      >
        <DateAreaLimit ref={fromLimitRef} className="from" style={{ left: fromLeft }}>
          <DateLabel
            className={daysDeltaWidth > labelWidth ? 'center' : 'left'}
          >
            {format(from, 'd MMM yyyy')}
          </DateLabel>
        </DateAreaLimit>
      </DraggableCore>
    </Container>
  )
}

export default ActivityFocusArea
