import styled from 'styled-components'
import './index.css'
import { MapboxProvider } from './contexts/MapboxContext'
import { DataProvider } from './contexts/DataContext'
import Mapbox from './components/Mapbox'
import Activity from './components/Activity'
import Dots from './components/Dots'
import Loader from './components/Loader'

const Layout = styled.div``

const MapWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`

const UI = styled.div`
  position: absolute;
  bottom: 0;
  left: 0;
`

function App() {
  return (
    <MapboxProvider>
      <DataProvider>
        <Layout>
          <MapWrapper>
            <Mapbox />
            <Dots />
          </MapWrapper>
          <UI>
            <Activity />
          </UI>
          <Loader />
        </Layout>
      </DataProvider>
    </MapboxProvider>
  )
}

export default App
