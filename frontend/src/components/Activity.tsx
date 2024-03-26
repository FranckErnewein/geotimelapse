import { FC, useState, useEffect, useRef } from 'react'
import styled, { keyframes } from 'styled-components'
import { Play, Pause, Rewind } from 'lucide-react'
import { max } from 'lodash'
import { format, differenceInDays, addDays } from 'date-fns'

import ActivityFocusArea from './ActivityFocusArea'
import { ActivityProps, ActivityDateItem } from '../types'
import { frameRate } from '../constants'
import yMarker from '../utils/yMarker'
import formatNumber from '../utils/formatNumber'

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
  background: rgba(255, 255, 255, 0.2);
  border-top: 1px solid rgba(255, 255, 255);
  border-left: 1px solid rgba(255, 255, 255, 0.6);
  position: absolute;
  bottom: 0;
  transition: height 250ms;
  opacity: 0.5;
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

const MarkDigit = styled.div`
  position: absolute;
  width: 50px;
  text-align: right;
  left: -52px;
  bottom: -6px;
  font-size: 11px;
  line-height: 12px;
`

const Controls = styled.div`
  position: absolute;
  width: 100%;
  text-align: right;
  bottom: 100%;
  height: 30px;
  left: 0;
`

const Button = styled.button`
  background: transparent;
  border-radius: 3px;
  border: 0 none;
  opacity: 0.7;
  cursor: pointer;
  padding-left: 10px;
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
      }, frameRate)
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

  const leftPosition = (width - graphWidth) / 2

  const iconProps = { size: 24, color: 'white' }

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
            <MarkDigit>{formatNumber(mark)}</MarkDigit>
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
              opacity: date >= from && date <= to ? 1 : 0.4,
            }}
          />
        )
      })}
      <ActivityFocusArea
        {...{
          firstDate,
          lastDate,
          dayWidth,
          from,
          to,
          setFromDate,
          setToDate,
        }}
      />
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
