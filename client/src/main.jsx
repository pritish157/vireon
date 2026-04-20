import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { AuthProvider } from './context/AuthProvider'
import { LocationProvider } from './context/LocationProvider'

ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
        <AuthProvider>
            <LocationProvider>
                <App />
            </LocationProvider>
        </AuthProvider>
    </React.StrictMode>,
)
