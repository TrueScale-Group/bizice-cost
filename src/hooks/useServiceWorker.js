import { useState, useEffect } from 'react'

/**
 * useServiceWorker — register public/sw.js + ตรวจอัปเดต (พอร์ตจาก vanilla)
 *  - register เฉพาะ production (เลี่ยง SW แคช dev modules รบกวน Vite HMR)
 *  - controllerchange → reload ครั้งเดียว (guard กัน loop)
 *  - มี SW ใหม่ติดตั้งขณะตัวเก่าคุมอยู่ → updateReady=true (โชว์ banner)
 */
export function useServiceWorker() {
  const [updateReady, setUpdateReady] = useState(false)

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return
    if (!import.meta.env.PROD) return

    let refreshing = false
    const onController = () => {
      if (refreshing) return
      refreshing = true
      window.location.reload()
    }
    navigator.serviceWorker.addEventListener('controllerchange', onController)

    const swUrl = (import.meta.env.BASE_URL || '/') + 'sw.js'
    navigator.serviceWorker.register(swUrl).then((reg) => {
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing
        if (!nw) return
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            setUpdateReady(true)
          }
        })
      })
    }).catch(() => {})

    return () => navigator.serviceWorker.removeEventListener('controllerchange', onController)
  }, [])

  return { updateReady, reload: () => window.location.reload() }
}
