import { FC } from 'react'
import styled from 'styled-components'
import { Item } from '../types'
import formatNumber from '../utils/formatNumber'
import { format } from 'date-fns'

export interface DetailsProps {
  item: Item
}

const Container = styled.div`
  color: white;
  position: absolute;
  padding: 20px;
  background: rgba(0, 0, 0, 0.5);
`

const Details: FC<DetailsProps> = ({ item }) => {
  return (
    <Container>
      {format(item.date, 'dd/MM/yyyy')}
      <br />
      {formatNumber(item.value)} €
    </Container>
  )
}

export default Details
