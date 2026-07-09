import { useState, useMemo, useEffect } from 'react'
import { useCost } from '../context/CostContext'
import { useToast } from '../components/Toast'
import { menuEmoji, MENU_CATS } from '../constants/categories'
import { getBestPct, gpColor, gpCls, calcCost, recalcAll } from '../utils/cost'
import { num, baht } from '../utils/format'
import MenuViewModal from '../components/MenuViewModal'
import MenuForm from '../components/MenuForm'
import CycleFilter from '../components/CycleFilter'

// หมวดเมนู: ตัด emoji เก่าที่อาจติดมาในข้อมูล (m.cat = "🍓 ชาผลไม้") แล้วใส่อีโมจิเดียว
function catLabel(cat) {
  if (!cat) return '—'
  const clean = String(cat).replace(/^[^฀-๿a-zA-Z]+/, '').trim()
  return `${menuEmoji(cat)} ${clean || cat}`
}

export default function MenuPage() {
  const { menus, library, compounds, settings, commit, session, masterByName, pendingMenuView, setPendingMenuView } = useCost()
  const toast = useToast()
  const [cat, setCat] = useState('all')
  const [view, setView] = useState(null)
  const [form, setForm] = useState(null) // {menu} | {menu:null} for new | null

  // มาจาก popup "🔗 ใช้ในเมนู" ในหน้าคลัง — เปิด view เมนูที่ระบุทันทีที่มาถึงหน้านี้
  useEffect(() => {
    if (!pendingMenuView) return
    const m = menus.find((x) => x.id === pendingMenuView)
    if (m) setView(m)
    setPendingMenuView(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMenuView])

  const saveMenu = (m) => {
    const exists = menus.some((x) => x.id === m.id)
    const nextMenus = exists ? menus.map((x) => (x.id === m.id ? m : x)) : [...menus, m]
    // refresh pricePerUnit จาก library/compounds ล่าสุด (live-link)
    const { menus: nm } = recalcAll(library, compounds, nextMenus)
    commit({ menus: nm })
    setForm(null)
    toast('บันทึกเมนูแล้ว', '✅')
  }

  const deleteMenu = (m) => {
    if (!confirm(`ลบเมนู "${m.name}"?`)) return
    commit({ menus: menus.filter((x) => x.id !== m.id) })
    setView(null)
    setForm(null)
    toast('ลบเมนูแล้ว', '🗑️')
  }

  const filtered = useMemo(() => {
    const list = cat === 'all' ? menus : menus.filter((m) => (m.cat || '').includes(cat))
    return [...list].sort((a, b) => {
      const pa = getBestPct(a), pb = getBestPct(b)
      if (pa === null) return 1
      if (pb === null) return -1
      return pa - pb
    })
  }, [menus, cat])

  // metrics
  const metrics = useMemo(() => {
    const withPct = menus.map(getBestPct).filter((p) => p !== null)
    const avg = withPct.length ? withPct.reduce((a, b) => a + b, 0) / withPct.length : 0
    const g = settings.green || 25, y = settings.yellow || 35
    return {
      total: menus.length,
      avg,
      good: withPct.filter((p) => p <= g).length,
      warn: withPct.filter((p) => p > g && p <= y).length,
      bad: withPct.filter((p) => p > y).length,
    }
  }, [menus, settings])

  return (
    <div className="main" style={{ paddingTop: '.6rem' }}>
      {/* metrics — เมนูทั้งหมด + เฉลี่ย cost (คลาส .metrics เดิม) */}
      <div className="metrics" style={{ gridTemplateColumns: 'repeat(2,1fr)' }}>
        <div className="metric hi">
          <div className="metric-lbl">เมนูทั้งหมด</div>
          <div className="metric-val">{metrics.total}</div>
        </div>
        <div className="metric">
          <div className="metric-lbl">เฉลี่ย cost</div>
          <div className="metric-val" style={{ color: gpColor(metrics.avg, settings) }}>{metrics.avg.toFixed(1)}%</div>
        </div>
      </div>

      {/* การกระจาย cost ratio — ดีมาก/สูงเกินเดิม ยุบรวมเป็นการ์ดเดียว 3 คอลัมน์ (ตาม 3 โซนเกณฑ์ในหน้าตั้งค่า) */}
      <div className="cmp-summary">
        <div className="cmp-stat" style={{ background: 'var(--green-bg)' }}>
          <div className="cmp-stat-lbl" style={{ color: '#15803D' }}>ดี</div>
          <div className="cmp-stat-val" style={{ color: '#15803D' }}>{metrics.good}</div>
          <div className="cmp-stat-sub">เมนู</div>
        </div>
        <div className="cmp-stat" style={{ background: '#FFFBEB' }}>
          <div className="cmp-stat-lbl" style={{ color: '#C2410C' }}>มาตรฐาน</div>
          <div className="cmp-stat-val" style={{ color: '#C2410C' }}>{metrics.warn}</div>
          <div className="cmp-stat-sub">เมนู</div>
        </div>
        <div className="cmp-stat" style={{ background: 'var(--red-p2)' }}>
          <div className="cmp-stat-lbl" style={{ color: '#E31E24' }}>สูง</div>
          <div className="cmp-stat-val" style={{ color: '#E31E24' }}>{metrics.bad}</div>
          <div className="cmp-stat-sub">เมนู</div>
        </div>
      </div>

      {/* control row: cycle-click filter + add (2 columns) */}
      <div style={{ display: 'flex', gap: 8, margin: '.9rem 0 .85rem' }}>
        <CycleFilter cats={MENU_CATS} value={cat} onChange={setCat} emojiOf={menuEmoji} count={filtered.length} />
        {session.isEditor() && (
          <button className="btn btn-red" style={{ flexShrink: 0 }} onClick={() => setForm({ menu: null })}>＋ เพิ่มเมนู</button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty">
          <span className="empty-icon">🍦</span>
          ยังไม่มีเมนูในหมวดนี้
        </div>
      ) : (
        <div className="menu-grid">
          {filtered.map((m) => {
            const pct = getBestPct(m)
            const color = pct === null ? 'var(--txt3)' : gpColor(pct, settings)
            const prices = [m.priceS, m.priceM, m.priceL].filter((p) => num(p) > 0)
            return (
              <div key={m.id} className="menu-card menu-card-click" onClick={() => setView(m)} style={{ padding: '.9rem 1rem' }}>
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)' }}>{catLabel(m.cat)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                  <span className={'badge ' + (pct === null ? '' : gpCls(pct, settings))} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 20, fontWeight: 700 }}>
                    {pct === null ? 'ยังไม่มีราคา' : `cost ${pct.toFixed(1)}%`}
                  </span>
                  <span style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 700, fontSize: 15, color }}>
                    {prices.length ? `฿${prices.map((p) => num(p).toLocaleString('th-TH')).join(' / ')}` : '—'}
                  </span>
                </div>
                {session.isEditor() && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 7 }}>
                    <button className="btn-icon" style={{ fontSize: 13 }} onClick={(e) => { e.stopPropagation(); setForm({ menu: m }) }}>✏️ แก้ไข</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {view && <MenuViewModal menu={view} onClose={() => setView(null)} />}
      {form && (
        <MenuForm
          menu={form.menu}
          library={library}
          compounds={compounds}
          settings={settings}
          masterByName={masterByName}
          updatedBy={session.updatedBy}
          onSave={saveMenu}
          onDelete={deleteMenu}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  )
}
