import { FC } from 'react'
import styled from 'styled-components'
import formatNumber from '../utils/formatNumber'

export interface CounterProps {
  count: number
  value: number
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

const Counter: FC<CounterProps> = ({ count, value }) => {
  if (count === 0) return null

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
        {formatNumber(value)}€
      </div>
      <div>
        Prix moyen:
        <br />
        {formatNumber(Math.round(value / count))}€
      </div>
    </Container>
  )
}

export default Counter
