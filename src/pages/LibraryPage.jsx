import { useState, useMemo } from 'react'
import { useCost } from '../context/CostContext'
import { useToast } from '../components/Toast'
import { CATS, CAT_EMOJI, CAT_COLOR } from '../constants/categories'
import { num, baht, fmtDate } from '../utils/format'

export default function LibraryPage() {
  const { library, session } = useCost()
  const toast = useToast()
  const [cat, setCat] = useState('all')

  const groups = useMemo(() => {
    const list = cat === 'all' ? library : library.filter((i) => (i.cat || 'อื่นๆ') === cat)
    const by = {}
    list.forEach((i) => { (by[i.cat || 'อื่นๆ'] ||= []).push(i) })
    // เรียงตามลำดับ CATS
    return CATS.filter((c) => by[c]).map((c) => ({ cat: c, items: by[c] }))
  }, [library, cat])

  return (
    <div className="main">
      <div className="ph" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Prompt,sans-serif', fontSize: 22, fontWeight: 600 }}>📦 คลังวัตถุดิบ</h1>
          <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginTop: 2 }}>{library.length} รายการ</div>
        </div>
        {session.isEditor() && (
          <button className="btn btn-red" onClick={() => toast('ฟอร์มเพิ่มวัตถุดิบกำลังพอร์ตมา React 🔧', 'ℹ️')}>＋ เพิ่มวัตถุดิบ</button>
        )}
      </div>

      <div className="ios-chip-bar" style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
        <button className={'ios-chip' + (cat === 'all' ? ' active' : '')} onClick={() => setCat('all')}>ทั้งหมด</button>
        {CATS.map((c) => (
          <button key={c} className={'ios-chip' + (cat === c ? ' active' : '')} onClick={() => setCat(c)} style={{ whiteSpace: 'nowrap' }}>
            {CAT_EMOJI[c]} {c}
          </button>
        ))}
      </div>

      {groups.length === 0 ? (
        <div className="empty"><span className="empty-icon">📦</span>ยังไม่มีวัตถุดิบ</div>
      ) : groups.map((g) => (
        <div key={g.cat} style={{ marginBottom: '1.2rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: CAT_COLOR[g.cat] || '#6B7280', margin: '0 2px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {CAT_EMOJI[g.cat] || '🔖'} {g.cat} <span style={{ color: 'var(--txt3)', fontWeight: 500 }}>({g.items.length})</span>
          </div>
          <div className="lib-grid">
            {g.items.map((i) => (
              <div key={i.id} className="lib-card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 14 }}>{i.pinned ? '📌 ' : ''}{i.name}</div>
                    <div style={{ fontSize: 11.5, color: 'var(--txt3)', marginTop: 2 }}>
                      {baht(i.unitPrice)} ฿ / {i.unit || 'หน่วย'}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 700, fontSize: 15 }}>{baht(i.basePrice || i.price || i.total)} ฿</div>
                    <div style={{ fontSize: 10, color: 'var(--txt3)' }}>ต่อลัง/แพ็ค</div>
                  </div>
                </div>
                {i.updatedAt && (
                  <div style={{ fontSize: 10.5, color: 'var(--txt3)', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                    อัปเดต {fmtDate(i.updatedAt)}{i.updatedBy ? ` · ${i.updatedBy}` : ''}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
