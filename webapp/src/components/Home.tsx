import { useQuery } from 'react-query'
import { Link } from 'react-router-dom'
import { getConfigs } from '../services'

export default function Home() {
  const { data = [] } = useQuery('configs', getConfigs)

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
