import { useState, useMemo } from 'react'
import { useCost } from '../context/CostContext'
import { useToast } from '../components/Toast'
import { CP_CATS, CP_CAT_EMOJI, CP_CAT_COLOR } from '../constants/categories'
import { baht } from '../utils/format'

export default function CompoundPage() {
  const { compounds, session } = useCost()
  const toast = useToast()
  const [cat, setCat] = useState('all')

  const list = useMemo(() => {
    const l = cat === 'all' ? compounds : compounds.filter((c) => c.cat === cat)
    return [...l].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
  }, [compounds, cat])

  return (
    <div className="main">
      <div className="ph" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', gap: 10 }}>
        <div>
          <h1 style={{ fontFamily: 'Prompt,sans-serif', fontSize: 22, fontWeight: 600 }}>🧪 สูตรผสม</h1>
          <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginTop: 2 }}>{compounds.length} สูตร</div>
        </div>
        {session.isEditor() && (
          <button className="btn btn-red" onClick={() => toast('ฟอร์มเพิ่มสูตรผสมกำลังพอร์ตมา React 🔧', 'ℹ️')}>＋ เพิ่มสูตรผสม</button>
        )}
      </div>

      <div className="ios-chip-bar" style={{ display: 'flex', gap: 7, overflowX: 'auto', paddingBottom: 8, marginBottom: 8 }}>
        <button className={'ios-chip' + (cat === 'all' ? ' active' : '')} onClick={() => setCat('all')}>ทั้งหมด</button>
        {CP_CATS.map((c) => (
          <button key={c} className={'ios-chip' + (cat === c ? ' active' : '')} onClick={() => setCat(c)} style={{ whiteSpace: 'nowrap' }}>
            {CP_CAT_EMOJI[c]} {c}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="empty"><span className="empty-icon">🧪</span>ยังไม่มีสูตรผสม</div>
      ) : (
        <div className="lib-grid">
          {list.map((c) => (
            <div key={c.id} className="lib-card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18 }}>{CP_CAT_EMOJI[c.cat] || '🧪'}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: CP_CAT_COLOR[c.cat] || 'var(--txt3)', marginTop: 3, fontWeight: 600 }}>{c.cat}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
                    ผลผลิต {c.outputQty} {c.outputUnit}{c.yield ? ` · yield ${c.yield}%` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--purple)' }}>{baht(c.costPerOutputUnit)} ฿</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>ต่อ {c.outputUnit}</div>
                </div>
              </div>
              <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                {(c.ingredients || []).length} วัตถุดิบ
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
