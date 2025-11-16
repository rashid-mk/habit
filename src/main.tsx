import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './style.css'
import { initWebVitalsMonitoring, logPerformanceMetrics } from './utils/performanceMonitoring'

// Initialize performance monitoring
initWebVitalsMonitoring()

// Log performance metrics in development
if (import.meta.env.DEV) {
  window.addEventListener('load', () => {
    setTimeout(logPerformanceMetrics, 0)
  })
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
