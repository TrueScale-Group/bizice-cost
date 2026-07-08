import { useState, useEffect } from 'react'
import { CostProvider, useCost } from './context/CostContext'
import { ToastProvider } from './components/Toast'
import { TAB_STATUS_COLORS } from './constants/categories'
import { useServiceWorker } from './hooks/useServiceWorker'
import { usePullToRefresh } from './hooks/usePullToRefresh'
import NotificationBell from './components/NotificationBell'
import HardRefreshButton from './components/HardRefreshButton'
import MenuPage from './pages/MenuPage'
import LibraryPage from './pages/LibraryPage'
import CompoundPage from './pages/CompoundPage'
import ComparePage from './pages/ComparePage'
import SettingsPage from './pages/SettingsPage'

const APP_VERSION = __APP_VERSION__
const BUILD_DATE = __BUILD_DATE__
const HUB = 'https://truescale-group.github.io/mixue-ice-sakon/'

const NAV = [
  { id: 'menu', emoji: '🍦', label: 'เมนู', short: 'เมนู' },
  { id: 'library', emoji: '📦', label: 'คลังวัตถุดิบ', short: 'คลัง' },
  { id: 'compound', emoji: '🧪', label: 'สูตรผสม', short: 'สูตรผสม', fab: true },
  { id: 'compare', emoji: '📊', label: 'เปรียบเทียบ', short: 'เปรียบ' },
  { id: 'settings', emoji: '⚙️', label: 'ตั้งค่า', short: 'ตั้งค่า' },
]

function Splash() {
  return (
    <div id="splash">
      <div className="sp-ice">
        <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
          <polygon points="50,98 18,48 82,48" fill="rgba(255,255,255,0.22)" stroke="rgba(255,255,255,0.45)" strokeWidth="1.5" strokeLinejoin="round" />
          <ellipse cx="50" cy="34" rx="20" ry="16" fill="rgba(255,255,255,0.9)" />
          <ellipse cx="38" cy="31" rx="14" ry="12" fill="#fff" />
          <ellipse cx="62" cy="31" rx="14" ry="12" fill="rgba(255,210,210,1)" />
          <ellipse cx="50" cy="26" rx="13" ry="11" fill="#fff" />
          <ellipse cx="38" cy="21" rx="9" ry="8" fill="#fff" />
          <ellipse cx="62" cy="21" rx="9" ry="8" fill="rgba(255,195,195,1)" />
          <ellipse cx="50" cy="16" rx="8" ry="7" fill="#fff" />
          <circle cx="38" cy="13" r="5" fill="#fff" />
          <circle cx="62" cy="13" r="5" fill="rgba(255,200,200,1)" />
          <circle cx="50" cy="8" r="4" fill="#fff" />
        </svg>
      </div>
      <div className="sp-name">BizICE</div>
      <div className="sp-sub">Cost Manager</div>
      <div className="sp-dots"><div className="sp-dot" /><div className="sp-dot" /><div className="sp-dot" /></div>
    </div>
  )
}

function Shell() {
  const { loading, session, reload } = useCost()
  const { updateReady, reload: swReload } = useServiceWorker()
  const [tab, setTab] = useState('menu')
  const [splashDone, setSplashDone] = useState(false)

  // pull-to-refresh (มือถือ) + auto refresh ทุก 5 นาทีตอน focus
  usePullToRefresh(reload)
  useEffect(() => {
    const iv = setInterval(() => { if (!document.hidden) reload() }, 5 * 60 * 1000)
    return () => clearInterval(iv)
  }, [reload])

  // splash: โชว์อย่างน้อย ~700ms แล้วรอโหลดเสร็จ
  useEffect(() => {
    const t = setTimeout(() => setSplashDone(true), 700)
    return () => clearTimeout(t)
  }, [])

  // status bar color ตามแท็บ
  useEffect(() => {
    window.setStatusBarColor?.(TAB_STATUS_COLORS[tab] || '#E31E24')
  }, [tab])

  const showSplash = loading || !splashDone

  const go = (id) => { setTab(id); window.scrollTo?.(0, 0) }
  const goHome = () => { window.top.location.href = HUB }

  const Page = { menu: MenuPage, library: LibraryPage, compound: CompoundPage, compare: ComparePage, settings: SettingsPage }[tab]
  const active = NAV.find((n) => n.id === tab)

  return (
    <>
      {showSplash && <Splash />}

      {/* ── SW UPDATE BANNER ── */}
      {updateReady && (
        <div className="show" style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9000, background: 'linear-gradient(90deg,#0F766E,#0D9488)', color: '#fff', padding: '.6rem 1rem', display: 'flex', alignItems: 'center', gap: '.75rem', fontSize: 13, fontWeight: 600 }}>
          <span style={{ fontSize: 18 }}>🔄</span>
          <span style={{ flex: 1 }}>มีอัปเดตใหม่พร้อมแล้วค่ะ</span>
          <button onClick={swReload} style={{ background: 'rgba(255,255,255,.2)', border: '1.5px solid rgba(255,255,255,.4)', color: '#fff', borderRadius: 8, padding: '4px 12px', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>โหลดใหม่</button>
        </div>
      )}

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="sidebar">
        <div className="sb-brand">
          <img src="./icon-cost-192.png" alt="" style={{ width: 34, height: 34, borderRadius: 9 }} />
          <div>
            <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 600, fontSize: 16, lineHeight: 1.1 }}>Cost Manager</div>
            <div style={{ fontSize: 10.5, color: 'var(--txt3)', marginTop: 1 }}>ต้นทุน & เมนู Mixue</div>
          </div>
        </div>
        <div className="sb-scroll">
          <button className="dsb-home-btn" onClick={goHome}>🏠 กลับ BizICE Hub</button>
          <div className="dsb-sec-lbl">เมนูหลัก</div>
          <nav className="sb-nav">
            {NAV.map((n) => (
              <button key={n.id} className={'snav-btn' + (tab === n.id ? ' active' : '')} onClick={() => go(n.id)}>
                <span className="snav-icon">{n.emoji}</span>{n.label}
              </button>
            ))}
          </nav>
        </div>
        <div className="sb-footer">
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '0 .25rem .4rem' }}>
            <HardRefreshButton variant="circle" />
            <NotificationBell />
          </div>
          <div className="sb-user">
            <div className="sb-avatar">
              {session.photo ? <img src={session.photo} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : session.initials}
            </div>
            <div style={{ minWidth: 0, flex: 1 }}>
              <div className="sb-uname">{session.name || 'ผู้ใช้'}</div>
              <div className="sb-urole">{session.isOwner() ? 'เจ้าของ' : session.isEditor() ? 'แก้ไขได้' : 'ดูอย่างเดียว'}</div>
            </div>
          </div>
          <span className="ios-ver-pill">{APP_VERSION}</span>
          <span style={{ fontSize: 10, color: 'var(--txt3)', marginLeft: 8 }}>อัพเดท {BUILD_DATE}</span>
        </div>
      </aside>

      {/* ── MAIN SCROLL AREA ── */}
      <div className="scroll-area">
        {/* pull-to-refresh indicator (มือถือ) */}
        <div id="ptr-indicator">
          <div id="ptr-ring">
            <svg width="44" height="44" viewBox="0 0 44 44">
              <defs>
                <linearGradient id="ptr-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E31E24" />
                  <stop offset="100%" stopColor="#B01519" />
                </linearGradient>
              </defs>
              <circle className="ptr-track" cx="22" cy="22" r="20" />
              <circle className="ptr-arc" cx="22" cy="22" r="20" />
            </svg>
            <div id="ptr-icon">🧊</div>
          </div>
          <div id="ptr-label">ดึงลงเพื่อรีเฟรช</div>
        </div>

        {/* mobile top bar */}
        <div className="mobile-top-bar" id="mobile-top-bar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <img src="./icon-cost-192.png" alt="" style={{ width: 30, height: 30, borderRadius: 8 }} />
            <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 600, fontSize: 15 }}>{active?.label}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <NotificationBell />
            <HardRefreshButton variant="circle" />
            <span className="ios-ver-pill">{APP_VERSION}</span>
            <button className="back-btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={goHome}>🏠</button>
          </div>
        </div>

        {session.isViewer() && (
          <div className="st-perm-banner" style={{ margin: '.6rem .9rem 0' }}>
            👁 โหมดดูอย่างเดียว — แก้ไขข้อมูลไม่ได้
          </div>
        )}

        <main className="page active" style={{ paddingBottom: 'calc(84px + env(safe-area-inset-bottom))' }}>
          {!showSplash && Page && <Page go={go} />}
        </main>
      </div>

      {/* ── MOBILE BOTTOM NAV ── */}
      <div className="bottom-nav" id="bottom-nav">
        {NAV.map((n) => (
          <button key={n.id} className={'nav-item' + (n.fab ? ' is-fab' : '') + (tab === n.id ? ' active' : '')} onClick={() => go(n.id)}>
            {n.fab
              ? <span className="nav-fab"><span className="fab-icon">{n.emoji}</span></span>
              : <span className="nav-pill"><span className="nav-icon">{n.emoji}</span></span>}
            <span className="nav-label">{n.short}</span>
          </button>
        ))}
      </div>
    </>
  )
}

export default function App() {
  return (
    <ToastProvider>
      <CostProvider>
        <Shell />
      </CostProvider>
    </ToastProvider>
  )
}
