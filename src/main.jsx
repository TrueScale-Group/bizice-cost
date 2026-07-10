import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { ssoBootstrap } from './ssoBootstrap'

// ต้องรอ SSO bootstrap (signInWithCustomToken) ก่อน render — ให้มี request.auth ก่อนแอพเริ่มอ่าน/เขียน Firestore
ssoBootstrap().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
