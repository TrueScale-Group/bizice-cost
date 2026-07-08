import { useState, useEffect, useRef } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc, writeBatch, arrayUnion } from 'firebase/firestore'
import { db } from '../firebase'
import { COL } from '../constants/collections'
import { useCost } from '../context/CostContext'

function timeAgo(ts) {
  const ms = ts?.toMillis?.() || (ts?.seconds ? ts.seconds * 1000 : 0)
  if (!ms) return ''
  const m = Math.floor((Date.now() - ms) / 60000)
  if (m < 1) return 'เมื่อกี้'
  if (m < 60) return m + ' นาทีก่อน'
  const h = Math.floor(m / 60)
  if (h < 24) return h + ' ชม.ก่อน'
  return Math.floor(h / 24) + ' วันก่อน'
}

export default function NotificationBell() {
  const { session } = useCost()
  const phone = session.phone || ''
  const [notifs, setNotifs] = useState([])
  const [open, setOpen] = useState(false)
  const wrapRef = useRef(null)

  useEffect(() => {
    const q = query(collection(db, COL.INCOME_NOTIFICATIONS), where('app', '==', 'food-cost'))
    const unsub = onSnapshot(q, (snap) => {
      const arr = []
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }))
      arr.sort((a, b) => (b.createdAt?.toMillis?.() || 0) - (a.createdAt?.toMillis?.() || 0))
      setNotifs(arr.slice(0, 50))
    }, () => {})
    return unsub
  }, [])

  // ปิด panel เมื่อคลิกนอก
  useEffect(() => {
    const onDown = (e) => { if (open && wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [open])

  const isUnread = (n) => !(n.read_by || []).includes(phone)
  const unread = notifs.filter(isUnread).length

  const markRead = (id) => {
    if (!phone) return
    updateDoc(doc(db, COL.INCOME_NOTIFICATIONS, id), { read_by: arrayUnion(phone) }).catch(() => {})
  }
  const markAllRead = () => {
    if (!phone) return
    const b = writeBatch(db)
    notifs.filter(isUnread).forEach((n) => b.update(doc(db, COL.INCOME_NOTIFICATIONS, n.id), { read_by: arrayUnion(phone) }))
    b.commit().catch(() => {})
  }

  return (
    <div ref={wrapRef} style={{ position: 'relative' }}>
      <button onClick={() => setOpen((o) => !o)} aria-label="แจ้งเตือน"
        style={{ position: 'relative', width: 34, height: 34, borderRadius: '50%', background: 'var(--surf2)', border: '1px solid var(--border)', cursor: 'pointer', fontSize: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        🔔
        {unread > 0 && (
          <span style={{ position: 'absolute', top: -2, right: -2, minWidth: 16, height: 16, padding: '0 4px', borderRadius: 8, background: '#e31e24', color: '#fff', fontSize: 10, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{ position: 'absolute', top: 42, right: 0, width: 300, maxHeight: 400, overflowY: 'auto', background: '#fff', borderRadius: 14, boxShadow: 'var(--sh-lg)', border: '1px solid var(--border)', zIndex: 500 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.7rem .9rem', borderBottom: '1px solid var(--border)' }}>
            <span style={{ fontWeight: 700, fontSize: 14 }}>การแจ้งเตือน</span>
            {unread > 0 && <button onClick={markAllRead} style={{ fontSize: 11.5, color: 'var(--red)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>อ่านทั้งหมด</button>}
          </div>
          {notifs.length === 0 ? (
            <div style={{ padding: '2rem 1rem', textAlign: 'center', color: 'var(--txt3)', fontSize: 13 }}>ไม่มีการแจ้งเตือน</div>
          ) : notifs.map((n) => {
            const u = isUnread(n)
            return (
              <div key={n.id} onClick={() => markRead(n.id)}
                style={{ display: 'flex', gap: 9, padding: '.65rem .9rem', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: u ? '#FFF7F7' : '#fff' }}>
                <span style={{ fontSize: 20, flexShrink: 0 }}>🧮</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: 13.5, color: '#1c1c1e' }}>{n.title || 'Cost Manager'}</div>
                  <div style={{ fontSize: 12.5, color: '#444', marginTop: 1, lineHeight: 1.4 }}>{n.body || n.message || ''}</div>
                  <div style={{ fontSize: 11, color: '#999', marginTop: 3 }}>{timeAgo(n.createdAt)}</div>
                </div>
                {u && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#e31e24', flexShrink: 0, marginTop: 5 }} />}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
