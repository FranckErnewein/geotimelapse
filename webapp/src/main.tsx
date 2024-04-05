import * as ReactDOM from 'react-dom/client'
import {
  createBrowserRouter,
  createRoutesFromElements,
  RouterProvider,
  Route,
} from 'react-router-dom'

import './index.css'
import 'mapbox-gl/dist/mapbox-gl.css'
import { QueryClient, QueryClientProvider } from 'react-query'

import App from './App'
import Home from './components/Home'
import Dataset from './components/Dataset'

const router = createBrowserRouter(
  createRoutesFromElements(
    <Route element={<App />}>
      <Route path="/" element={<Home />} />
      <Route path="/dataset/:id" element={<Dataset />} />
    </Route>
  )
)

const queryClient = new QueryClient()

ReactDOM.createRoot(document.getElementById('root')!).render(
  <QueryClientProvider client={queryClient}>
    <RouterProvider router={router} />
  </QueryClientProvider>
)
