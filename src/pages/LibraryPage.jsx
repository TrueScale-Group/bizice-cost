import { useState, useMemo } from 'react'
import { useCost } from '../context/CostContext'
import { useToast } from '../components/Toast'
import { CATS, CAT_EMOJI, CAT_COLOR, menuEmoji } from '../constants/categories'
import { num, baht, fmtDate } from '../utils/format'
import { recalcAll, libUsage, libUsageDetail } from '../utils/cost'
import { itemEmoji, sortLibraryByMaster, catGroupOrder } from '../utils/sortItems'
import IngredientForm from '../components/IngredientForm'
import PriceAdjModal from '../components/PriceAdjModal'
import CycleFilter from '../components/CycleFilter'
import Modal from '../components/Modal'

export default function LibraryPage({ go }) {
  const { library, menus, compounds, commit, session, masterByName, catOrder, setPendingMenuView, setPendingCompoundEdit } = useCost()
  const toast = useToast()
  const [cat, setCat] = useState('all')
  const [form, setForm] = useState(null) // {item} | {item:null} for new | null closed
  const [priceAdj, setPriceAdj] = useState(null) // item | null
  const [usageFor, setUsageFor] = useState(null) // item | null — popup "🔗 ใช้ในเมนู"

  // เรียง + จัดกลุ่มตาม Master Data ของ Inventory (emoji ต่อชิ้น + ลำดับตรงกับ Inventory)
  const groups = useMemo(() => {
    const list = cat === 'all' ? library : library.filter((i) => (i.cat || 'อื่นๆ') === cat)
    const sorted = sortLibraryByMaster(list, masterByName, catOrder)
    const by = {}
    sorted.forEach((i) => { (by[i.cat || 'อื่นๆ'] ||= []).push(i) })
    const order = catGroupOrder(catOrder)
    const known = order.filter((c) => by[c]).map((c) => ({ cat: c, items: by[c] }))
    const extra = Object.keys(by).filter((c) => !order.includes(c)).map((c) => ({ cat: c, items: by[c] }))
    return [...known, ...extra]
  }, [library, cat, masterByName, catOrder])

  // เพิ่ม/แก้ไข → รวมเข้า library แล้ว cascade cost เข้า compounds+menus
  const saveIngredient = (item) => {
    const exists = library.some((x) => x.id === item.id)
    const nextLib = exists ? library.map((x) => (x.id === item.id ? item : x)) : [...library, item]
    const { compounds: nc, menus: nm } = recalcAll(nextLib, compounds, menus)
    commit({ library: nextLib, compounds: nc, menus: nm })
    setForm(null)
    toast('บันทึกวัตถุดิบแล้ว', '✅')
  }

  // ปรับราคา (จาก PriceAdjModal — item ที่อัปเดต priceHistory+ราคาแล้ว)
  const savePriceAdj = (item) => {
    const nextLib = library.map((x) => (x.id === item.id ? item : x))
    const { compounds: nc, menus: nm } = recalcAll(nextLib, compounds, menus)
    commit({ library: nextLib, compounds: nc, menus: nm })
    setPriceAdj(null)
    toast(`อัปเดตราคา ${item.name} แล้ว`, '🔄')
  }

  const deleteIngredient = (item) => {
    const u = libUsage(item.id, menus, compounds)
    let msg = `ลบ "${item.name}"?`
    if (u.total > 0) {
      const parts = []
      if (u.m) parts.push(`${u.m} เมนู`)
      if (u.c) parts.push(`${u.c} สูตรผสม`)
      msg = `⚠️ วัตถุดิบนี้ถูกใช้ใน ${parts.join(' และ ')}\nลบแล้วต้นทุนของรายการเหล่านั้นจะคำนวณผิด\n\nยืนยันลบ?`
    }
    if (!confirm(msg)) return
    const nextLib = library.filter((x) => x.id !== item.id)
    const { compounds: nc, menus: nm } = recalcAll(nextLib, compounds, menus)
    commit({ library: nextLib, compounds: nc, menus: nm })
    setForm(null)
    toast('ลบแล้ว', '🗑️')
  }

  const canEdit = session.isEditor()

  const showUsage = (item) => setUsageFor(item)
  // กดเมนู/สูตรผสมใน popup → ข้ามไปหน้านั้นแล้วเปิดดู/แก้ไขให้เลย
  const openMenuFromUsage = (menuId) => { setPendingMenuView(menuId); go?.('menu'); setUsageFor(null) }
  const openCompoundFromUsage = (compoundId) => { setPendingCompoundEdit(compoundId); go?.('compound'); setUsageFor(null) }

  return (
    <div className="main" style={{ paddingTop: '.6rem' }}>
      <div style={{ fontSize: 12.5, color: 'var(--txt3)', margin: '0 2px .2rem' }}>{library.length} รายการ</div>

      {/* control row: cycle-click filter + เพิ่ม (2 คอลัมน์) */}
      <div style={{ display: 'flex', gap: 8, margin: '.7rem 0 .9rem' }}>
        <CycleFilter cats={CATS} value={cat} onChange={setCat} emojiOf={(c) => CAT_EMOJI[c] || '🔖'} count={groups.reduce((s, g) => s + g.items.length, 0)} />
        {canEdit && (
          <button className="btn btn-red" style={{ flexShrink: 0 }} onClick={() => setForm({ item: null })}>＋ เพิ่ม</button>
        )}
      </div>

      {groups.length === 0 ? (
        <div className="empty"><span className="empty-icon">📦</span>ยังไม่มีวัตถุดิบ</div>
      ) : groups.map((g) => (
        <div key={g.cat} style={{ marginBottom: '1.2rem' }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: CAT_COLOR[g.cat] || '#6B7280', margin: '0 2px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
            {CAT_EMOJI[g.cat] || '🔖'} {g.cat} <span style={{ color: 'var(--txt3)', fontWeight: 500 }}>({g.items.length})</span>
          </div>
          <div className="lib-grid">
            {g.items.map((i) => {
              const baseUnit = i.levels?.[0]?.name || 'ลัง'
              return (
                <div key={i.id} className="lib-card" style={{ padding: '.9rem 1rem' }}>
                  {/* header: emoji + name + edit (แทน chip หมวดที่ซ้ำกับหัวกลุ่ม) */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 19, flexShrink: 0 }}>{itemEmoji(i.name, masterByName)}</span>
                    <div style={{ fontWeight: 700, fontSize: 14, flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{i.name}</div>
                    {canEdit && (
                      <button className="btn-icon" style={{ fontSize: 15, flexShrink: 0 }} onClick={() => setForm({ item: i })} title="แก้ไข">✏️</button>
                    )}
                  </div>

                  {/* 3 ช่องเท่าๆกัน: ราคาต่อหน่วย | ราคาซื้อ | ตัก (ถ้ามี) */}
                  <div style={{ display: 'flex', gap: 8 }}>
                    <div style={{ flex: 1, background: 'var(--red-p)', borderRadius: 12, padding: '.7rem .35rem', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 600 }}>ราคาต่อหน่วย</div>
                      <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--red)', lineHeight: 1.15 }}>{baht(i.unitPrice)}</div>
                      <div style={{ fontSize: 10.5, color: 'var(--txt2)', fontWeight: 600 }}>฿ / {i.unit || 'หน่วย'}</div>
                    </div>
                    <div style={{ flex: 1, background: 'var(--surf2)', borderRadius: 12, padding: '.7rem .35rem', textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 600 }}>📦 ราคาซื้อ</div>
                      <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 700, fontSize: 16, color: 'var(--txt)', lineHeight: 1.25 }}>{baht(i.basePrice || i.price || i.total)} ฿</div>
                      <div style={{ fontSize: 10, color: 'var(--txt3)', marginTop: 1 }}>ต่อ 1 {baseUnit}</div>
                      {num(i.qty) > 0 && <div style={{ fontSize: 10, color: 'var(--txt3)' }}>= {baht(i.qty).replace('.00', '')} {i.unit}</div>}
                    </div>
                    {i.servingUnit && num(i.servingUnit.qty) > 0 && (
                      <div style={{ flex: 1, background: 'var(--purple-bg)', border: '1px solid var(--purple-b)', borderRadius: 12, padding: '.7rem .35rem', textAlign: 'center' }}>
                        <div style={{ fontSize: 10, color: 'var(--txt3)', fontWeight: 600 }}>🥄 ต่อ 1 {i.servingUnit.name}</div>
                        <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 800, fontSize: 20, color: 'var(--purple)', lineHeight: 1.15 }}>{baht(i.servingUnit.costPerServe ?? num(i.unitPrice) * num(i.servingUnit.qty))}</div>
                        <div style={{ fontSize: 10.5, color: 'var(--txt2)', fontWeight: 600 }}>฿ / {i.servingUnit.name}</div>
                      </div>
                    )}
                  </div>

                  {/* buttons */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 10 }}>
                    <button className="btn" style={{ background: 'var(--blue-bg)', color: 'var(--blue)', padding: '5px 11px', fontSize: 12, fontWeight: 600 }} onClick={() => showUsage(i)}>🔗 ใช้ในเมนู</button>
                    {canEdit && (
                      <button className="btn" style={{ background: '#FEF9C3', color: '#854D0E', padding: '5px 11px', fontSize: 12, fontWeight: 600 }} onClick={() => setPriceAdj(i)}>↕️ ปรับราคา</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ))}

      {form && (
        <IngredientForm
          item={form.item}
          library={library}
          updatedBy={session.updatedBy}
          onSave={saveIngredient}
          onDelete={deleteIngredient}
          onClose={() => setForm(null)}
        />
      )}
      {priceAdj && (
        <PriceAdjModal
          item={priceAdj}
          updatedBy={session.updatedBy}
          onSave={savePriceAdj}
          onClose={() => setPriceAdj(null)}
        />
      )}
      {usageFor && (() => {
        const { menus: usedMenus, compounds: usedCompounds } = libUsageDetail(usageFor.id, menus, compounds)
        const empty = usedMenus.length === 0 && usedCompounds.length === 0
        return (
          <Modal title="🔗 ใช้ในเมนู" subtitle={usageFor.name} onClose={() => setUsageFor(null)} guard={false} maxWidth={420}>
            {empty ? (
              <div style={{ textAlign: 'center', padding: '1.6rem 1rem', color: 'var(--txt3)', fontSize: 13 }}>ยังไม่ถูกใช้ในเมนูหรือสูตรผสมใดๆ</div>
            ) : (
              <>
                {usedMenus.length > 0 && (
                  <div className="ios-group">
                    <div className="ios-sec-label">🍦 เมนู ({usedMenus.length})</div>
                    <div className="ios-card">
                      {usedMenus.map((m) => (
                        <div key={m.id} className="ios-row" onClick={() => openMenuFromUsage(m.id)}>
                          <div className="ios-row-left">
                            <span className="ios-row-icon">{menuEmoji(m.cat)}</span>
                            <span className="ios-row-title">{m.name}</span>
                          </div>
                          <span className="ios-arrow">›</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {usedCompounds.length > 0 && (
                  <div className="ios-group">
                    <div className="ios-sec-label">🧪 สูตรผสม ({usedCompounds.length})</div>
                    <div className="ios-card">
                      {usedCompounds.map((c) => (
                        <div key={c.id} className="ios-row" onClick={() => openCompoundFromUsage(c.id)}>
                          <div className="ios-row-left">
                            <span className="ios-row-icon">🧪</span>
                            <span className="ios-row-title">{c.name}</span>
                          </div>
                          <span className="ios-arrow">›</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </Modal>
        )
      })()}
    </div>
  )
}
