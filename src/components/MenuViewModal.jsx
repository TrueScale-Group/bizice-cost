import { useCost } from '../context/CostContext'
import { CAT_EMOJI, CAT_COLOR, menuEmoji } from '../constants/categories'
import { calcCost, gpColor } from '../utils/cost'
import { num, esc, baht } from '../utils/format'

const VIEW_CAT_ORDER = ['แยม', 'ผลไม้', 'ไซรัป', 'ท็อปปิ้ง', 'วัตถุดิบ', 'ขนม', 'บรรจุภัณฑ์', 'อื่นๆ', 'สูตรผสม']
const SIZES = [{ k: 'S', label: 'U', priceKey: 'priceS' }, { k: 'M', label: 'M', priceKey: 'priceM' }, { k: 'L', label: 'L', priceKey: 'priceL' }]

// qty ของ ingredient สำหรับขนาดที่กำหนด (ตรรกะเดียวกับ calcCost)
function qtyForSize(i, size) {
  const st = i.sizeTarget || 'all'
  if (st === 'all') return (size === 'S' || size === 'U') ? num(i.qtyS) : size === 'M' ? num(i.qtyM) : num(i.qtyM) * 1.25
  if (st === 'U') return (size === 'U' || size === 'S') ? num(i.qty) : 0
  if (st === 'M') return size === 'M' ? num(i.qty) : 0
  if (st === 'L') return size === 'L' ? num(i.qty) : 0
  return 0
}

export default function MenuViewModal({ menu, onClose }) {
  const { settings, library, compounds } = useCost()

  const catOf = (i) => {
    if (compounds.find((c) => c.id === i.sourceId)) return 'สูตรผสม'
    const lib = library.find((l) => l.id === i.sourceId)
    return (lib && lib.cat) || i.cat || 'อื่นๆ'
  }

  const activeSizes = SIZES.filter((s) => num(menu[s.priceKey]) > 0)

  return (
    <div className="view-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="view-box">
        <div className="view-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 26 }}>{menuEmoji(menu.cat)}</span>
            <div>
              <div className="view-title" style={{ fontSize: 17, fontWeight: 700 }}>{menu.name}</div>
              <div style={{ fontSize: 12, color: 'var(--txt3)' }}>{menu.cat || '—'}</div>
            </div>
          </div>
          <button className="mh-close" onClick={onClose} aria-label="ปิด">✕</button>
        </div>

        <div className="view-body">
          <div className="view-sizes-grid">
            {activeSizes.length === 0 && <div className="empty" style={{ padding: '2rem 1rem' }}>ยังไม่มีราคาขาย</div>}
            {activeSizes.map((s) => {
              const price = num(menu[s.priceKey])
              const cost = calcCost(menu.ingredients, s.k)
              const pct = price > 0 ? (cost / price) * 100 : 0
              const gp = 100 - pct
              const col = gpColor(pct, settings)
              const barW = Math.min(100, pct)

              // group ingredients by category
              const rows = (menu.ingredients || [])
                .map((i) => ({ i, q: qtyForSize(i, s.k) }))
                .filter((x) => x.q > 0)
              const byCat = {}
              rows.forEach(({ i, q }) => {
                const c = catOf(i)
                ;(byCat[c] ||= []).push({ i, q, cost: q * num(i.pricePerUnit) })
              })
              const cats = VIEW_CAT_ORDER.filter((c) => byCat[c]).concat(Object.keys(byCat).filter((c) => !VIEW_CAT_ORDER.includes(c)))

              return (
                <div key={s.k} className="view-size-block">
                  <div className="view-size-header">
                    <span className="view-size-tag">{s.label === 'U' && menu.vesselU === 'โคน' ? '🍦 โคน' : `แก้ว ${s.label}`}</span>
                    <span className="view-size-price">ขาย {price.toLocaleString('th-TH')} ฿</span>
                  </div>

                  <div className="view-total-row" style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--txt2)' }}>ต้นทุนรวม</span>
                    <span style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 800, fontSize: 15.5, color: col }}>{baht(cost)} ฿</span>
                  </div>
                  <div className="view-gp-bar" style={{ height: 7, background: 'var(--surf3)', borderRadius: 4, overflow: 'hidden', margin: '6px 0' }}>
                    <div className="view-gp-fill" style={{ width: barW + '%', background: col, height: '100%' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                    <span style={{ color: col }}>Cost ratio {pct.toFixed(1)}%</span>
                    <span style={{ color: '#15803D' }}>GP {gp.toFixed(1)}%</span>
                  </div>

                  {cats.map((c) => (
                    <div key={c} className="view-cat-group">
                      <div className="view-cat-label" style={{ color: CAT_COLOR[c] || '#6B7280' }}>
                        {CAT_EMOJI[c] || '🔖'} {esc(c)}
                      </div>
                      {byCat[c].map(({ i, q }, idx) => (
                        <div key={idx} className="view-ingr-row">
                          <span className="view-ingr-name">{esc(i.name)}</span>
                          <span style={{ color: 'var(--txt3)', fontSize: 12.5, whiteSpace: 'nowrap' }}>{q.toLocaleString('th-TH', { maximumFractionDigits: 2 })} {esc(i.unit || '')}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
