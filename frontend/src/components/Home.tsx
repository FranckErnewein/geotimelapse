import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { Config } from '../types'

const configsUrl = `/api/configs`

export default function Home() {
  const { data = [] } = useQuery<Config[]>([], () =>
    fetch(configsUrl).then((r) => r.json())
  )

  return (
    <ul>
      {data.map((config) => {
        return (
          <li key={config.id}>
            <Link to={`dataset/${config.id}`}>{config.id}</Link>
            <pre>{config.csv}</pre>
          </li>
        )
      })}
    </ul>
  )
}