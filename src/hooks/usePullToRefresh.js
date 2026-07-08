import { useEffect, useRef } from 'react'

/**
 * usePullToRefresh — ดึงลงเพื่อรีเฟรช (มือถือ) — พอร์ต 1:1 จาก vanilla
 *  จัดการ #ptr-indicator แบบ imperative เพื่อความลื่น (ไม่ re-render ทุก touchmove)
 *  scroll container = .scroll-area · ข้ามถ้ามี modal เปิดอยู่
 */
export function usePullToRefresh(onRefresh) {
  const cbRef = useRef(onRefresh)
  cbRef.current = onRefresh

  useEffect(() => {
    const THRESHOLD = 68, MAX_PULL = 88, CIRC = 126
    let startY = 0, pulling = false, refreshing = false

    const scrollEl = () => document.querySelector('.scroll-area')
    const ptr = () => document.getElementById('ptr-indicator')
    const arc = () => ptr()?.querySelector('.ptr-arc')
    const lbl = () => document.getElementById('ptr-label')
    const modalOpen = () => [...document.querySelectorAll('.modal-overlay,.view-overlay')]
      .some((el) => getComputedStyle(el).display !== 'none')

    const setArc = (p) => { const a = arc(); if (a) a.style.strokeDashoffset = CIRC * (1 - Math.min(p, 1)) }
    const setState = (state, h) => {
      const p = ptr(); if (!p) return
      p.style.height = h + 'px'
      p.classList.toggle('ptr-ready', state === 'ready')
      p.classList.toggle('ptr-loading', state === 'loading')
      const l = lbl()
      if (l) {
        if (state === 'idle') l.textContent = 'ดึงลงเพื่อรีเฟรช'
        if (state === 'ready') l.textContent = '🎉 ปล่อยเพื่อรีเฟรช'
        if (state === 'loading') l.textContent = 'กำลังโหลด…'
      }
    }

    const doRefresh = async () => {
      if (refreshing) return
      refreshing = true
      setState('loading', 72); setArc(1)
      try { await cbRef.current?.() } catch {}
      await new Promise((r) => setTimeout(r, 400))
      setState('idle', 0); setArc(0)
      refreshing = false
    }

    const onStart = (e) => {
      if (modalOpen()) return
      const s = scrollEl(); if (!s || s.scrollTop > 0) return
      startY = e.touches[0].clientY; pulling = true
    }
    const onMove = (e) => {
      if (!pulling || refreshing) return
      const s = scrollEl(); if (!s || s.scrollTop > 0) { pulling = false; return }
      const dy = e.touches[0].clientY - startY
      if (dy <= 0) { setState('idle', 0); setArc(0); return }
      const h = Math.min(dy * 0.42, MAX_PULL)
      setArc(h / THRESHOLD)
      setState(h >= THRESHOLD ? 'ready' : 'idle', h)
    }
    const onEnd = () => {
      if (!pulling) return
      pulling = false
      const h = parseFloat(ptr()?.style.height) || 0
      if (h >= THRESHOLD) doRefresh()
      else { setState('idle', 0); setArc(0) }
    }

    document.addEventListener('touchstart', onStart, { passive: true })
    document.addEventListener('touchmove', onMove, { passive: true })
    document.addEventListener('touchend', onEnd)
    return () => {
      document.removeEventListener('touchstart', onStart)
      document.removeEventListener('touchmove', onMove)
      document.removeEventListener('touchend', onEnd)
    }
  }, [])
}
