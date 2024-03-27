import * as ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from 'react-router-dom'

import './index.css'
import 'mapbox-gl/dist/mapbox-gl.css'

import App from './App'
import Dataset from './components/Dataset'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route path="/" element={<App />}>
      <Route path="dataset/:id" element={<Dataset />} />
    </Route>
  )
)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <RouterProvider router={router} />
)
