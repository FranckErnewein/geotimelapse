import { FC, useContext } from 'react'
import styled from 'styled-components'

import DataContext from '../contexts/DataContext'

const Content = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0.5;
  color: white;
`
const Loader: FC = () => {
  const { loading } = useContext(DataContext)
  if (!loading) return null

  return <Content>Loading</Content>
}

export default Loader
