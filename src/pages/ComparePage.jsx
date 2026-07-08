import { useMemo } from 'react'
import { useCost } from '../context/CostContext'
import { menuEmoji } from '../constants/categories'
import { calcCost, getBestPct, gpColor } from '../utils/cost'
import { num } from '../utils/format'

export default function ComparePage() {
  const { menus, settings } = useCost()

  const ranked = useMemo(() => {
    return menus
      .map((m) => {
        // ขนาดที่ cost ratio ต่ำสุด
        const sizes = [{ p: m.priceS, k: 'S', lbl: 'U' }, { p: m.priceM, k: 'M', lbl: 'M' }, { p: m.priceL, k: 'L', lbl: 'L' }]
          .filter((x) => num(x.p) > 0)
        let best = null
        for (const s of sizes) {
          const cost = calcCost(m.ingredients, s.k)
          const pct = (cost / num(s.p)) * 100
          if (!best || pct < best.pct) best = { ...s, cost, pct }
        }
        return best ? { m, ...best } : null
      })
      .filter(Boolean)
      .sort((a, b) => a.pct - b.pct)
  }, [menus])

  const avg = ranked.length ? ranked.reduce((a, b) => a + b.pct, 0) / ranked.length : 0

  return (
    <div className="main">
      <div className="ph" style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontFamily: 'Prompt,sans-serif', fontSize: 22, fontWeight: 600 }}>📊 เปรียบเทียบ</h1>
        <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginTop: 2 }}>จัดอันดับ cost ratio ต่ำสุด → สูงสุด</div>
      </div>

      {ranked.length === 0 ? (
        <div className="empty"><span className="empty-icon">📊</span>ยังไม่มีเมนูที่มีราคา</div>
      ) : (
        <>
          <div className="cmp-summary">
            <div className="cmp-stat" style={{ background: 'var(--green-bg)' }}>
              <div className="cmp-stat-lbl" style={{ color: '#15803D' }}>ดีสุด</div>
              <div className="cmp-stat-val" style={{ color: '#15803D' }}>{ranked[0].pct.toFixed(1)}%</div>
              <div className="cmp-stat-sub">{ranked[0].m.name}</div>
            </div>
            <div className="cmp-stat" style={{ background: 'var(--surf2)' }}>
              <div className="cmp-stat-lbl">เฉลี่ย</div>
              <div className="cmp-stat-val" style={{ color: gpColor(avg, settings) }}>{avg.toFixed(1)}%</div>
              <div className="cmp-stat-sub">{ranked.length} เมนู</div>
            </div>
            <div className="cmp-stat" style={{ background: 'var(--red-p2)' }}>
              <div className="cmp-stat-lbl" style={{ color: '#E31E24' }}>แย่สุด</div>
              <div className="cmp-stat-val" style={{ color: '#E31E24' }}>{ranked[ranked.length - 1].pct.toFixed(1)}%</div>
              <div className="cmp-stat-sub">{ranked[ranked.length - 1].m.name}</div>
            </div>
          </div>

          <div className="cmp-list">
            {ranked.map((r, idx) => {
              const col = gpColor(r.pct, settings)
              const rankCls = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''
              return (
                <div key={r.m.id} className="cmp-card">
                  <div className={'cmp-rank ' + rankCls}>{idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}</div>
                  <div className="cmp-body">
                    <div className="cmp-top">
                      <span className="cmp-name">{menuEmoji(r.m.cat)} {r.m.name}</span>
                      <span className="cmp-size-badge">แก้ว {r.lbl}</span>
                    </div>
                    <div className="cmp-bar-bg"><div className="cmp-bar-fill" style={{ width: Math.min(100, r.pct) + '%', background: col }} /></div>
                    <div className="cmp-sub">ต้นทุน {r.cost.toFixed(2)} ฿ · ขาย {num(r.p)} ฿</div>
                  </div>
                  <div className="cmp-right">
                    <span className="cmp-pct" style={{ color: col }}>{r.pct.toFixed(1)}%</span>
                    <span className="cmp-price">GP {(100 - r.pct).toFixed(0)}%</span>
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
