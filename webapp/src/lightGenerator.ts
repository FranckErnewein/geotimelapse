const { random, PI, cos, sin } = Math

interface Options {
  lineOpacity?: number
  pointOpacity?: number
  lineColor?: [number, number, number]
  pointColor?: [number, number, number]
}

interface GeneratorOptions {
  MAX_SIZE?: number
  MIN_SIZE?: number
  DELTA?: number
  lineLimit?: number
}

const defaultOptions = {
  lineOpacity: 0.1,
  pointOpacity: 0.5,
  lineColor: [255, 255, 255],
  pointColor: [255, 255, 255],
}

interface Line {
  alpha: number
  size: number
  delta: number
  gamma: number
}

interface Light {
  x: number
  y: number
  lines: Line[]
}

export function drawLight(
  context: CanvasRenderingContext2D,
  light: Light,
  lineColorString: string,
  pointColorString: string
) {
  const { x, y } = light
  context.fillStyle = pointColorString
  context.fillRect(x, y, 1, 1)
  light.lines.forEach((line) => {
    const { alpha, size } = line
    context.strokeStyle = lineColorString
    context.beginPath()
    context.moveTo(x, y)
    context.lineTo(x + cos(alpha) * size, y + sin(alpha) * size)
    context.stroke()
  })
}

export function renderer(
  context: CanvasRenderingContext2D,
  options: Options = {}
) {
  if (!(context instanceof CanvasRenderingContext2D)) {
    throw new TypeError(
      'context is not a CanvasRenderingContext2D valid object'
    )
  }
  const { lineOpacity, pointOpacity, lineColor, pointColor } = Object.assign(
    {},
    defaultOptions,
    options
  )
  const pointRGB = pointColor.join()
  const lineRGB = lineColor.join()
  const pointColorString = `rgba(${pointRGB},${pointOpacity})`
  const lineColorString = `rgba(${lineRGB},${lineOpacity})`
  return function draw(light: Light, opacity?: number) {
    if (opacity) {
      const pc = `rgba(${pointRGB},${pointOpacity * opacity})`
      const lc = `rgba(${lineRGB},${lineOpacity * opacity})`
      drawLight(context, light, pc, lc)
    } else {
      drawLight(context, light, lineColorString, pointColorString)
    }
  }
}

export function lightGenerator(options: GeneratorOptions = {}) {
  const GAMMA = PI / 32
  const { MAX_SIZE = 17, DELTA = 1, MIN_SIZE = 5, lineLimit = 5 } = options

  function create(x: number, y: number) {
    const lines = []
    for (let i = 0; i < lineLimit; i++) {
      lines.push({
        alpha: random() * PI * 2,
        size: random() * (MAX_SIZE - MIN_SIZE) + MIN_SIZE,
        delta: random() > 0.5 ? DELTA : -DELTA,
        gamma: random() > 0.5 ? GAMMA * random() : -GAMMA * random(),
      })
    }
    return {
      x,
      y,
      lines,
    }
  }

  function update(light: Light) {
    return light
  }
  return {
    create,
    update,
  }
}
