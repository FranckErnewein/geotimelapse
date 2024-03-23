import { FC, useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { Play, Pause, Rewind } from 'lucide-react'
import { max } from 'lodash'
import { format, differenceInDays, addDays } from 'date-fns'
import { DraggableCore } from 'react-draggable'
import yMarker from '../utils/yMarker'
import formatNumber from '../utils/formatNumber'
import { ActivityProps, ActivityDateItem } from '../types'

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
  width: 4px;
  margin-left: -2px;
  background-color: rgba(255, 255, 255, 0.6);
  cursor: ew-resize;
`

const FromDateMark = styled.div`
  position: absolute;
  height: 100%;
  top: 0;
  width: 4px;
  margin-left: -2px;
  background-color: rgba(255, 255, 255, 0.6);
  cursor: ew-resize;
`

const FromToArea = styled.div`
  position: absolute;
  height: 100%;
  top: 0;
  cursor: move;
  cursor: grab;
  background-color: rgba(255, 255, 255, 0.1);
  &:active {
    cursor: grabbing;
  }
`

const Controls = styled.div`
  position: absolute;
  width: 100%;
  text-align: right;
  bottom: 100%;
  height: 30px;
  left: 0;
  line-height: 20px;
`

const Button = styled.button`
  background: transparent;
  border-radius: 3px;
  border: 0 none;
  opacity: 0.7;
  cursor: pointer;
  padding-left: 10px;
  line-height: 20px;
  &:disabled {
    opacity: 0.2;
  }
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
> = ({ activity, width, to, from, setToDate, setFromDate }) => {
  const [play, setPlay] = useState<boolean>(true)
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const dragOffsetX = useRef<number>(0)
  const lastDate = activity[activity.length - 1].date

  useEffect(() => {
    clearTimeout(timeout.current)
    if (play) {
      if (lastDate && to >= lastDate) {
        setPlay(false)
        return
      }
      timeout.current = setTimeout(() => {
        setFromDate(format(addDays(from, 1), 'yyyy-MM-dd'))
        setToDate(format(addDays(to, 1), 'yyyy-MM-dd'))
      }, 1000 / 18)
    }
    return () => clearTimeout(timeout.current)
  }, [play, setFromDate, setToDate, from, to, activity, lastDate])

  if (activity.length === 0) return null

  const height = 180
  const firstDate = activity[0].date

  const dayWidth = Math.floor(width / activity.length)
  const graphWidth = dayWidth * activity.length

  const maxValue = Math.max(max(activity.map((a) => a.count)) || 0, 2)
  const getHeight = calculHeight(maxValue, height)

  const rewind = () => {
    if (from === firstDate) return
    setFromDate(firstDate)
    setToDate(
      format(addDays(firstDate, -1 * differenceInDays(from, to)), 'yyyy-MM-dd')
    )
  }

  const iconProps = { size: 24, color: 'white' }
  const toLeft = differenceInDays(to, firstDate) * dayWidth
  const fromLeft = differenceInDays(from, firstDate) * dayWidth
  const daysDelta = differenceInDays(to, from)
  const leftPosition = (width - graphWidth) / 2

  return (
    <Container
      style={{
        height,
        width: graphWidth,
        left: leftPosition,
      }}
    >
      {yMarker(maxValue).map((mark, i) => {
        return (
          <Mark key={i} style={{ bottom: getHeight(mark) }}>
            {formatNumber(mark)}
          </Mark>
        )
      })}
      {activity.map(({ date, count }: ActivityDateItem, i: number) => {
        return (
          <Bar
            title={`${date}:${count}`}
            key={date}
            style={{
              left: dayWidth * i,
              width: dayWidth - 2,
              height: getHeight(count),
            }}
          />
        )
      })}
      <DraggableCore
        onDrag={(_, { x }) => {
          const halfDaysDelta = Math.round(daysDelta / 2)
          const date = addDays(firstDate, Math.floor(x / dayWidth))
          setFromDate(format(addDays(date, -halfDaysDelta), 'yyyy-MM-dd'))
          setToDate(format(addDays(date, halfDaysDelta), 'yyyy-MM-dd'))
        }}
      >
        <FromToArea style={{ left: fromLeft, width: toLeft - fromLeft }} />
      </DraggableCore>
      <DraggableCore
        onDrag={(_, { x }) => {
          setToDate(
            format(addDays(firstDate, Math.floor(x / dayWidth)), 'yyyy-MM-dd')
          )
        }}
      >
        <ToDateMark style={{ left: toLeft }} />
      </DraggableCore>
      <DraggableCore
        onDrag={(_, { x }) => {
          setFromDate(
            format(addDays(firstDate, Math.floor(x / dayWidth)), 'yyyy-MM-dd')
          )
        }}
      >
        <FromDateMark style={{ left: fromLeft }} />
      </DraggableCore>
      <Controls>
        <Button
          onClick={() => {
            if (to !== lastDate) setPlay(!play)
          }}
          disabled={to === lastDate}
        >
          {play ? <Pause {...iconProps} /> : <Play {...iconProps} />}
        </Button>
        <Button onClick={rewind} disabled={from === firstDate}>
          <Rewind {...iconProps} />
        </Button>
      </Controls>
    </Container>
  )
}

export default Activity
