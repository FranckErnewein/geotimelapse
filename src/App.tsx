import styled from 'styled-components'
import './index.css'
import { MapboxProvider } from './contexts/MapboxContext'
import { DataProvider } from './contexts/DataContext'
import Mapbox from './components/Mapbox'
import Activity from './components/Activity'
import Loader from './components/Loader'

const Layout = styled.div`
  position: relative;
  overflow: hidden;
`

const MapWrapper = styled.div`
  position: absolute;
  top: 0;
  left: 0;
`

const UI = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.5);
`

function App() {
  return (
    <Layout>
      <MapboxProvider>
        <DataProvider>
          <MapWrapper>
            <Mapbox />
          </MapWrapper>
          <UI>
            <Activity />
          </UI>
          <Loader />
        </DataProvider>
      </MapboxProvider>
    </Layout>
  )
}

export default App
