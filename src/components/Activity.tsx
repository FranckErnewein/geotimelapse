import { FC, useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
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

const PlayButton = styled.button``

const RewindButton = styled.button``

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
  const [play, setPlay] = useState<boolean>(false)
  const timeout = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  useEffect(() => {
    clearInterval(timeout.current)
    if (play) {
      const lastDate = activity[activity.length - 1].date
      if (lastDate && to >= lastDate) {
        setPlay(false)
        return
      }
      timeout.current = setTimeout(() => {
        setFromDate(format(addDays(from, 1), 'yyyy-MM-dd'))
        setToDate(format(addDays(to, 1), 'yyyy-MM-dd'))
      }, 1000 / 18)
    }
    return () => clearInterval(timeout.current)
  }, [play, setFromDate, setToDate, from, to, activity])

  if (activity.length === 0) return null

  const height = 200
  const firstDate = activity[0].date

  const dayWidth = Math.floor(width / activity.length)
  const graphWidth = dayWidth * activity.length

  const maxValue = Math.max(max(activity.map((a) => a.count)) || 0, 2)
  const getHeight = calculHeight(maxValue, height)

  const rewind = () => {
    setFromDate(firstDate)
    setToDate(
      format(addDays(firstDate, -1 * differenceInDays(from, to)), 'yyyy-MM-dd')
    )
  }

  return (
    <Container
      style={{
        height,
        width: graphWidth,
        left: (width - graphWidth) / 2,
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
          setToDate(
            format(addDays(firstDate, Math.floor(x / dayWidth)), 'yyyy-MM-dd')
          )
        }}
      >
        <ToDateMark
          style={{ left: differenceInDays(to, firstDate) * dayWidth }}
        />
      </DraggableCore>
      <DraggableCore
        onDrag={(_, { x }) => {
          setFromDate(
            format(addDays(firstDate, Math.floor(x / dayWidth)), 'yyyy-MM-dd')
          )
        }}
      >
        <FromDateMark
          style={{ left: differenceInDays(from, firstDate) * dayWidth }}
        />
      </DraggableCore>
      <Mask>
        <PlayButton onClick={() => setPlay(!play)}>
          {play ? 'Pause' : 'Play'}
        </PlayButton>
        {!play && from !== firstDate && (
          <RewindButton onClick={rewind}>Rewind</RewindButton>
        )}
      </Mask>
    </Container>
  )
}

export default Activity
