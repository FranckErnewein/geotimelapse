import { FC } from 'react'
import styled from 'styled-components'
import { sum } from 'lodash'
import { Item } from '../hooks/useCSV'

interface CounterProps {
  data: Item[]
}

const Container = styled.div`
  position: absolute;
  background: rgba(0, 0, 0, 0.35);
  top: 0;
  right: 0;
  color: white;
  padding: 20px;
  text-align: right;

  div {
    padding-top: 5px;
  }
`

function formatNumber(x: number): string {
  const chars = x.toString().split('').reverse()
  return chars.reduce((memo, n, i) => {
    return i % 3 === 0 ? `${n} ${memo}` : n + memo
  }, '')
}

const Counter: FC<CounterProps> = ({ data }) => {
  const count = data.length
  if (count === 0) return null

  const amount = Math.round(sum(data.map((item) => item.valeur_fonciere || 0)))
  return (
    <Container>
      <div>
        Nombre de ventes:
        <br />
        {formatNumber(count)}
      </div>
      <div>
        Montant total:
        <br />
        {formatNumber(amount)}€
      </div>
      <div>
        Prix moyen:
        <br />
        {formatNumber(Math.round(amount / count))}€
      </div>
    </Container>
  )
}

export default Counter