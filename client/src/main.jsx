import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './store'
import './index.css'
import App from './App.jsx'
import { whenLoggedOut } from './api'
import { loadMe, logoutUser } from './redux/auth'

whenLoggedOut(() => {
  if (store.getState().auth.user) {
    store.dispatch(logoutUser())
  }
})
if (store.getState().auth.user) {
  store.dispatch(loadMe())
}

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js'))
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)
