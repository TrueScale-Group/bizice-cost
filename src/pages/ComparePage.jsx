import { useMemo, useState } from 'react'
import { useCost } from '../context/CostContext'
import { menuEmoji } from '../constants/categories'
import { calcCost, getBestPct, gpColor } from '../utils/cost'
import { num, esc } from '../utils/format'

function bestSize(m) {
  for (const [sz, p] of [['S', m.priceS], ['M', m.priceM], ['L', m.priceL]]) {
    if (num(p) > 0) return { sz, price: num(p) }
  }
  return { sz: 'S', price: 0 }
}
function ingrMap(m, sz) {
  const map = {}
  ;(m.ingredients || []).forEach((ing) => {
    const st = ing.sizeTarget || 'all'
    if (st !== 'all' && st !== sz) return
    const qty = num(ing.qty)
    if (qty <= 0) return
    const key = ing.sourceId || ing.name || '?'
    const cost = qty * num(ing.pricePerUnit)
    if (map[key]) { map[key].cost += cost; map[key].qty += qty }
    else map[key] = { name: ing.name || '?', qty, unit: ing.unit || '', cost }
  })
  return map
}

function Duel({ menus }) {
  const [aId, setAId] = useState('')
  const [bId, setBId] = useState('')
  const mA = menus.find((m) => m.id === aId)
  const mB = menus.find((m) => m.id === bId)
  const ready = mA && mB && aId !== bId

  const SEL = { flex: 1, minWidth: 0, background: '#fff', border: '1px solid var(--border2)', borderRadius: 10, padding: '9px 10px', fontSize: 13, fontFamily: "'Sarabun',sans-serif" }

  let result = null
  if (ready) {
    const ba = bestSize(mA), bb = bestSize(mB)
    const costA = calcCost(mA.ingredients, ba.sz), costB = calcCost(mB.ingredients, bb.sz)
    const pctA = ba.price > 0 ? costA / ba.price * 100 : 0
    const pctB = bb.price > 0 ? costB / bb.price * 100 : 0
    const gpA = ba.price - costA, gpB = bb.price - costB
    const aBestPct = pctA <= pctB, aBestGP = gpA >= gpB
    const mapA = ingrMap(mA, ba.sz), mapB = ingrMap(mB, bb.sz)
    const keys = [...new Set([...Object.keys(mapA), ...Object.keys(mapB)])]
    result = { ba, bb, costA, costB, pctA, pctB, gpA, gpB, aBestPct, aBestGP, mapA, mapB, keys }
  }

  const card = (m, b, cost, pct, gp, bestPct, bestGP) => (
    <div className={'duel-card' + (bestPct || bestGP ? ' winner' : '')}>
      {bestGP && <div className="duel-winner-badge" style={{ background: 'linear-gradient(90deg,#F5C518,#FBBF24)' }}>🏆 กำไร/แก้วสูงสุด</div>}
      {bestPct && !bestGP && <div className="duel-winner-badge" style={{ background: 'linear-gradient(90deg,#15803D,#16a34a)' }}>🟢 ต้นทุนต่ำสุด</div>}
      <div style={{ padding: '.85rem' }}>
        <div className="duel-name">{esc(m.name)}</div>
        <div className="duel-cat">{m.cat} · แก้ว {b.sz}</div>
        <div className="duel-stat-row"><span className="duel-stat-label">ราคาขาย</span><span className="duel-stat-val">{b.price.toFixed(2)} ฿</span></div>
        <div className="duel-stat-row"><span className="duel-stat-label">ต้นทุน</span><span className="duel-stat-val">{cost.toFixed(2)} ฿</span></div>
        <div className="duel-stat-row"><span className="duel-stat-label">Food Cost</span><span className={'duel-stat-val ' + (bestPct ? 'better' : 'worse')}>{pct.toFixed(1)}%</span></div>
        <div className="duel-stat-row"><span className="duel-stat-label">กำไร/แก้ว</span><span className={'duel-stat-val ' + (bestGP ? 'better' : 'worse')}>{gp.toFixed(2)} ฿</span></div>
      </div>
    </div>
  )

  return (
    <div className="card" style={{ marginBottom: '1.2rem' }}>
      <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 10 }}>⚔️ ประชันเมนู (Duel)</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <select style={SEL} value={aId} onChange={(e) => setAId(e.target.value)}>
          <option value="">— เลือกเมนู A —</option>
          {menus.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <span style={{ alignSelf: 'center', fontWeight: 800, color: 'var(--red)' }}>VS</span>
        <select style={SEL} value={bId} onChange={(e) => setBId(e.target.value)}>
          <option value="">— เลือกเมนู B —</option>
          {menus.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {!ready ? (
        <div style={{ fontSize: 12.5, color: 'var(--txt3)', textAlign: 'center', padding: '.5rem' }}>เลือกเมนู 2 อันเพื่อเปรียบเทียบ</div>
      ) : (
        <>
          <div className="duel-cards">
            {card(mA, result.ba, result.costA, result.pctA, result.gpA, result.aBestPct, result.aBestGP)}
            {card(mB, result.bb, result.costB, result.pctB, result.gpB, !result.aBestPct, !result.aBestGP)}
          </div>
          {result.keys.length > 0 && (
            <div className="duel-breakdown" style={{ marginTop: 12 }}>
              <div className="duel-breakdown-header">
                <span style={{ flex: 1 }}>วัตถุดิบ</span>
                <span style={{ width: 80, textAlign: 'right' }}>{esc(mA.name)}</span>
                <span style={{ width: 80, textAlign: 'right' }}>{esc(mB.name)}</span>
              </div>
              {result.keys.map((k) => {
                const a = result.mapA[k], b = result.mapB[k]
                const nameStr = (a || b).name
                const av = a ? a.cost : null, bv = b ? b.cost : null
                const aBetter = av !== null && bv !== null && av < bv
                const bBetter = av !== null && bv !== null && bv < av
                return (
                  <div key={k} className="duel-breakdown-row">
                    <span style={{ flex: 1, fontWeight: 500, fontSize: 12.5 }}>{nameStr}</span>
                    <span style={{ width: 80, textAlign: 'right', fontSize: 12, color: aBetter ? 'var(--green)' : av === null ? 'var(--txt3)' : 'var(--txt)', fontWeight: aBetter ? 700 : 400 }}>{av !== null ? av.toFixed(2) + ' ฿' : 'ไม่มี'}</span>
                    <span style={{ width: 80, textAlign: 'right', fontSize: 12, color: bBetter ? 'var(--green)' : bv === null ? 'var(--txt3)' : 'var(--txt)', fontWeight: bBetter ? 700 : 400 }}>{bv !== null ? bv.toFixed(2) + ' ฿' : 'ไม่มี'}</span>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </div>
  )
}

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
    <div className="main" style={{ paddingTop: '.6rem' }}>
      <div style={{ fontSize: 12.5, color: 'var(--txt3)', margin: '0 2px .7rem' }}>📊 ประชันเมนู + จัดอันดับ cost ratio</div>

      {menus.length >= 2 && <Duel menus={menus} />}

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
