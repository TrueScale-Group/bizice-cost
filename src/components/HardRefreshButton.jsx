import { useState } from 'react'

// Hard Refresh — ล้าง Service Worker + caches แล้ว reload (พอร์ต 1:1 จาก vanilla hardRefresh)
async function doHardRefresh() {
  try {
    if ('serviceWorker' in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations()
      await Promise.all(regs.map((r) => r.unregister()))
    }
    if ('caches' in window) {
      const keys = await caches.keys()
      await Promise.all(keys.map((k) => caches.delete(k)))
    }
  } catch {}
  window.location.reload()
}

export default function HardRefreshButton({ variant = 'circle' }) {
  const [spinning, setSpinning] = useState(false)
  const run = async () => {
    if (spinning) return
    setSpinning(true)
    await doHardRefresh()
  }

  const base = {
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    cursor: 'pointer', border: '1px solid var(--border)', background: 'var(--surf2)',
    color: 'var(--txt2)', flexShrink: 0,
    animation: spinning ? 'topbar-spin .7s linear infinite' : 'none',
  }
  const style = variant === 'circle'
    ? { ...base, width: 34, height: 34, borderRadius: '50%', fontSize: 15 }
    : { ...base, width: 32, height: 32, borderRadius: '50%', fontSize: 14 }

  return (
    <button onClick={run} disabled={spinning} style={style} title="Hard Refresh — ล้างแคชและโหลดใหม่" aria-label="Hard Refresh">
      🔄
    </button>
  )
}
