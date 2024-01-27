import * as Color from 'color'
import * as mapStyle from './mapStyle.json'

//.replace('#8f7c79', '#798f8b')
//.replace('#75605D', '#5d7574');

export default function generateMapStype(color?: string) {
  const styleAsAString = JSON.stringify(mapStyle)
  const c = new Color(color || '#3ca9fb').darken(0.5)
  const modifiedStyle = styleAsAString.replace(/#75605D/g, c.hex())
  return JSON.parse(modifiedStyle)
}
