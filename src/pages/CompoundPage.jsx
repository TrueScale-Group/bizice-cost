import { useState, useMemo, useEffect } from 'react'
import { useCost } from '../context/CostContext'
import { useToast } from '../components/Toast'
import { CP_CATS, CP_CAT_EMOJI, CP_CAT_COLOR } from '../constants/categories'
import { baht } from '../utils/format'
import { recalcAll, compoundUsage } from '../utils/cost'
import CompoundForm from '../components/CompoundForm'
import CycleFilter from '../components/CycleFilter'

export default function CompoundPage() {
  const { compounds, library, menus, commit, session, masterByName, pendingCompoundEdit, setPendingCompoundEdit } = useCost()
  const toast = useToast()
  const [cat, setCat] = useState('all')
  const [form, setForm] = useState(null) // {compound} | {compound:null} | null

  // มาจาก popup "🔗 ใช้ในเมนู" ในหน้าคลัง — เปิดแก้ไขสูตรผสมที่ระบุทันทีที่มาถึงหน้านี้
  useEffect(() => {
    if (!pendingCompoundEdit) return
    const c = compounds.find((x) => x.id === pendingCompoundEdit)
    if (c) setForm({ compound: c })
    setPendingCompoundEdit(null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingCompoundEdit])

  const list = useMemo(() => {
    const l = cat === 'all' ? compounds : compounds.filter((c) => c.cat === cat)
    return [...l].sort((a, b) => (a.sortOrder ?? 9999) - (b.sortOrder ?? 9999))
  }, [compounds, cat])

  const saveCompound = (c) => {
    const exists = compounds.some((x) => x.id === c.id)
    const nextCp = exists ? compounds.map((x) => (x.id === c.id ? c : x)) : [...compounds, c]
    // cascade: compound cost เปลี่ยน → menu ที่ใช้สูตรนี้ต้องอัปเดต pricePerUnit
    const { compounds: nc, menus: nm } = recalcAll(library, nextCp, menus)
    commit({ compounds: nc, menus: nm })
    setForm(null)
    toast('บันทึกสูตรผสมแล้ว', '🧪')
  }

  const deleteCompound = (c) => {
    const u = compoundUsage(c.id, menus)
    let msg = `ลบสูตร "${c.name}"?`
    if (u.total > 0) msg = `⚠️ สูตรนี้ถูกใช้ใน ${u.m} เมนู\nลบแล้วต้นทุนของเมนูเหล่านั้นจะคำนวณผิด\n\nยืนยันลบ?`
    if (!confirm(msg)) return
    const nextCp = compounds.filter((x) => x.id !== c.id)
    const { compounds: nc, menus: nm } = recalcAll(library, nextCp, menus)
    commit({ compounds: nc, menus: nm })
    setForm(null)
    toast('ลบแล้ว', '🗑️')
  }

  const canEdit = session.isEditor()

  return (
    <div className="main" style={{ paddingTop: '.6rem' }}>
      <div style={{ fontSize: 12.5, color: 'var(--txt3)', margin: '0 2px .2rem' }}>{compounds.length} สูตรผสม</div>

      {/* control row: cycle-click filter + add (2 columns) */}
      <div style={{ display: 'flex', gap: 8, margin: '.7rem 0 .85rem' }}>
        <CycleFilter cats={CP_CATS} value={cat} onChange={setCat} emojiOf={(c) => CP_CAT_EMOJI[c] || '🧪'} count={list.length} />
        {canEdit && (
          <button className="btn btn-red" style={{ flexShrink: 0 }} onClick={() => setForm({ compound: null })}>＋ เพิ่มสูตร</button>
        )}
      </div>

      {list.length === 0 ? (
        <div className="empty"><span className="empty-icon">🧪</span>ยังไม่มีสูตรผสม</div>
      ) : (
        <div className="lib-grid">
          {list.map((c) => (
            <div key={c.id} className="lib-card" style={{ padding: '.85rem .95rem', cursor: canEdit ? 'pointer' : 'default' }} onClick={() => canEdit && setForm({ compound: c })}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 18 }}>{CP_CAT_EMOJI[c.cat] || '🧪'}</span>
                    <span style={{ fontWeight: 700, fontSize: 14 }}>{c.name}</span>
                  </div>
                  <div style={{ fontSize: 11.5, color: CP_CAT_COLOR[c.cat] || 'var(--txt3)', marginTop: 3, fontWeight: 600 }}>{c.cat}</div>
                  <div style={{ fontSize: 11, color: 'var(--txt3)', marginTop: 2 }}>
                    ผลผลิต {Number(c.outputQty || 0).toLocaleString('th-TH')} {c.outputUnit}{c.yield && c.yield !== 100 ? ` · yield ${c.yield}%` : ''}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 800, fontSize: 15, color: 'var(--purple)' }}>{baht(c.costPerOutputUnit)} ฿</div>
                  <div style={{ fontSize: 10, color: 'var(--txt3)' }}>ต่อ {c.outputUnit}</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 11, color: 'var(--txt3)', marginTop: 8, borderTop: '1px solid var(--border)', paddingTop: 6 }}>
                <span>{(c.ingredients || []).length} วัตถุดิบ</span>
                {canEdit && <span className="btn-icon" style={{ fontSize: 13 }}>✏️ แก้ไข</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {form && (
        <CompoundForm
          compound={form.compound}
          library={library}
          masterByName={masterByName}
          updatedBy={session.updatedBy}
          onSave={saveCompound}
          onDelete={deleteCompound}
          onClose={() => setForm(null)}
        />
      )}
    </div>
  )
}
