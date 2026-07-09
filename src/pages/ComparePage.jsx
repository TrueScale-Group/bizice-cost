import { useMemo, useState } from 'react'
import { useCost } from '../context/CostContext'
import { menuEmoji, MENU_CATS } from '../constants/categories'
import { calcCost, gpColor } from '../utils/cost'
import { num, baht } from '../utils/format'
import CycleFilter from '../components/CycleFilter'

// ตัด emoji เก่าที่อาจติดมาในข้อมูล (m.cat = "🍓 ชาผลไม้") ให้เหลือชื่อหมวดล้วน ตรงกับ MENU_CATS
function cleanCat(cat) {
  return String(cat || '').replace(/^[^฀-๿a-zA-Z]+/, '').trim()
}

export default function ComparePage() {
  const { menus, settings } = useCost()
  const [catFilter, setCatFilter] = useState('all')

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

  // กรองตามหมวด → จัดอันดับ 1-2-3 ใหม่แบบ real time เฉพาะในหมวดนั้น (all = รวมทุกเมนูเหมือนเดิม)
  const filteredRanked = useMemo(() => {
    if (catFilter === 'all') return ranked
    return ranked.filter((r) => cleanCat(r.m.cat) === catFilter)
  }, [ranked, catFilter])

  const avg = filteredRanked.length ? filteredRanked.reduce((a, b) => a + b.pct, 0) / filteredRanked.length : 0

  return (
    <div className="main" style={{ paddingTop: '.6rem' }}>
      <div style={{ fontSize: 12.5, color: 'var(--txt3)', margin: '0 2px .7rem' }}>📊 จัดอันดับ cost ratio</div>

      {ranked.length === 0 ? (
        <div className="empty"><span className="empty-icon">📊</span>ยังไม่มีเมนูที่มีราคา</div>
      ) : (
        <>
          <div style={{ margin: '0 0 .8rem' }}>
            <CycleFilter cats={MENU_CATS} value={catFilter} onChange={setCatFilter} emojiOf={menuEmoji} count={filteredRanked.length} />
          </div>

          {filteredRanked.length === 0 ? (
            <div className="empty"><span className="empty-icon">📊</span>ยังไม่มีเมนูหมวดนี้ที่มีราคา</div>
          ) : (
            <>
              <div className="cmp-summary">
                <div className="cmp-stat" style={{ background: 'var(--green-bg)' }}>
                  <div className="cmp-stat-lbl" style={{ color: '#15803D' }}>ดีสุด</div>
                  <div className="cmp-stat-val" style={{ color: '#15803D' }}>{filteredRanked[0].pct.toFixed(1)}%</div>
                  <div className="cmp-stat-sub">{filteredRanked[0].m.name}</div>
                </div>
                <div className="cmp-stat" style={{ background: 'var(--surf2)' }}>
                  <div className="cmp-stat-lbl">เฉลี่ย</div>
                  <div className="cmp-stat-val" style={{ color: gpColor(avg, settings) }}>{avg.toFixed(1)}%</div>
                  <div className="cmp-stat-sub">{filteredRanked.length} เมนู</div>
                </div>
                <div className="cmp-stat" style={{ background: 'var(--red-p2)' }}>
                  <div className="cmp-stat-lbl" style={{ color: '#E31E24' }}>แย่สุด</div>
                  <div className="cmp-stat-val" style={{ color: '#E31E24' }}>{filteredRanked[filteredRanked.length - 1].pct.toFixed(1)}%</div>
                  <div className="cmp-stat-sub">{filteredRanked[filteredRanked.length - 1].m.name}</div>
                </div>
              </div>

              <div className="cmp-list">
                {filteredRanked.map((r, idx) => {
                  const col = gpColor(r.pct, settings)
                  const rankCls = idx === 0 ? 'gold' : idx === 1 ? 'silver' : idx === 2 ? 'bronze' : ''
                  return (
                    <div key={r.m.id} className="cmp-card">
                      <div className={'cmp-rank ' + rankCls}>{idx < 3 ? ['🥇', '🥈', '🥉'][idx] : idx + 1}</div>
                      <div className="cmp-body">
                        <div className="cmp-top">
                          <span className="cmp-name">{menuEmoji(r.m.cat)} {r.m.name}</span>
                          <span className="cmp-size-badge">{r.lbl === 'U' && r.m.vesselU === 'โคน' ? '🍦 โคน' : `แก้ว ${r.lbl}`}</span>
                        </div>
                        <div className="cmp-bar-bg"><div className="cmp-bar-fill" style={{ width: Math.min(100, r.pct) + '%', background: col }} /></div>
                        <div className="cmp-sub">ต้นทุน {baht(r.cost)} ฿ · ขาย {baht(r.p)} ฿</div>
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
        </>
      )}
    </div>
  )
}
