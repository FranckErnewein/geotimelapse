import { FC, useRef, useContext, useEffect } from 'react'
import styled from 'styled-components'
import { useWindowSize } from '@uidotdev/usehooks'
import MapboxContext from '../contexts/MapboxContext'
import DataContext from '../contexts/DataContext'

const Canvas = styled.canvas`
  position: absolute;
  top: 0;
  left: 0;
`

const Dots: FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const { boundingBox, map } = useContext(MapboxContext)
  const { data } = useContext(DataContext)
  const { height, width } = useWindowSize()

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx || !width || !height) return
    ctx.clearRect(0, 0, width, height)
    let index = 0
    const size = 40
    let raf: null | ReturnType<typeof requestAnimationFrame> = null
    const draw = () => {
      index += size
      const lines = data.slice(index, index + size)
      lines.forEach((line) => {
        const point = map?.project([line.longitude, line.latitude])
        if (point) {
          ctx.fillStyle = 'rgba(255, 255, 255, 0.15)'
          ctx.fillRect(point.x - 0.5, point.y - 0.5, 0.5, 0.5)
          console.log(point.x, point.y)
        }
      })
      raf = requestAnimationFrame(draw)
    }
    draw()
    return () => {
      if (raf) cancelAnimationFrame(raf)
    }
  }, [boundingBox, width, height, data, map])

  if (!width || !height) return null

  return <Canvas ref={canvasRef} width={width} height={height} />
}

export default Dots
