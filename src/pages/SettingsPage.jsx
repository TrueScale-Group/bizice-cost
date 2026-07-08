import { useState } from 'react'
import { useCost } from '../context/CostContext'
import { useToast } from '../components/Toast'

const APP_VERSION = __APP_VERSION__
const BUILD_DATE = __BUILD_DATE__

export default function SettingsPage() {
  const { menus, library, compounds, settings, saveSettings, commit, session } = useCost()
  const toast = useToast()
  const [green, setGreen] = useState(settings.green || 25)
  const [yellow, setYellow] = useState(settings.yellow || 35)

  const saveThresholds = () => {
    saveSettings({ ...settings, green: Number(green) || 25, yellow: Number(yellow) || 35 })
    toast('บันทึกเกณฑ์แล้ว', '✅')
  }

  const clearAll = () => {
    const pin = window.prompt('⚠️ ล้างข้อมูลทั้งหมด (เมนู/คลัง/สูตรผสม)\nกรอก PIN เพื่อยืนยัน:')
    if (pin == null) return
    if (pin !== '1994') { toast('PIN ไม่ถูกต้อง', '⚠️'); return }
    commit({ menus: [], library: [], compounds: [] })
    toast('ล้างข้อมูลทั้งหมดแล้ว', '🗑️')
  }

  const secLbl = { fontSize: 11, fontWeight: 700, color: 'var(--txt3)', textTransform: 'uppercase', letterSpacing: '.06em', padding: '0 4px 6px', marginTop: 4 }
  const groupCard = { background: 'var(--surf)', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,.05)', overflow: 'hidden' }
  const row = { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '.7rem .9rem', gap: 12 }
  const rowBorder = { borderTop: '1px solid var(--border)' }

  return (
    <div className="main" style={{ maxWidth: 560, margin: '0 auto' }}>
      <div style={{ padding: '.2rem 4px 1rem' }}>
        <h1 style={{ fontFamily: 'Prompt,sans-serif', fontSize: 21, fontWeight: 600 }}>⚙️ ตั้งค่า</h1>
        <div style={{ fontSize: 12, color: 'var(--txt3)', marginTop: 2 }}>
          {session.name} · {session.isOwner() ? 'เจ้าของ' : session.isEditor() ? 'แก้ไขได้' : 'ดูอย่างเดียว'}
        </div>
      </div>

      {/* เกณฑ์ cost ratio */}
      <div style={secLbl}>🚦 เกณฑ์ Cost Ratio</div>
      <div style={{ ...groupCard, marginBottom: '1.1rem' }}>
        <div style={row}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>เขียว — ดีมาก</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>ต้นทุนไม่เกิน %</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="number" value={green} disabled={!session.isEditor()} onChange={(e) => setGreen(e.target.value)}
              style={{ width: 56, textAlign: 'right', border: '1px solid var(--border2)', borderRadius: 8, padding: '5px 8px', fontSize: 15, fontWeight: 700, fontFamily: 'Prompt,sans-serif', color: '#15803D' }} />
            <span style={{ color: 'var(--txt3)', fontSize: 13 }}>%</span>
          </div>
        </div>
        <div style={{ ...row, ...rowBorder }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>เหลือง — พอได้</div>
            <div style={{ fontSize: 11, color: 'var(--txt3)' }}>เกินค่านี้ = สูงเกิน</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <input type="number" value={yellow} disabled={!session.isEditor()} onChange={(e) => setYellow(e.target.value)}
              style={{ width: 56, textAlign: 'right', border: '1px solid var(--border2)', borderRadius: 8, padding: '5px 8px', fontSize: 15, fontWeight: 700, fontFamily: 'Prompt,sans-serif', color: '#C2410C' }} />
            <span style={{ color: 'var(--txt3)', fontSize: 13 }}>%</span>
          </div>
        </div>
        {session.isEditor() && (
          <div style={{ ...row, ...rowBorder, justifyContent: 'flex-end' }}>
            <button className="btn btn-red" style={{ padding: '7px 18px', fontSize: 13 }} onClick={saveThresholds}>บันทึกเกณฑ์</button>
          </div>
        )}
      </div>

      {/* สรุปข้อมูล */}
      <div style={secLbl}>📊 ข้อมูลในระบบ</div>
      <div style={{ ...groupCard, marginBottom: '1.1rem' }}>
        {[['🍦 เมนู', menus.length], ['📦 วัตถุดิบ', library.length], ['🧪 สูตรผสม', compounds.length]].map(([lbl, n], i) => (
          <div key={lbl} style={{ ...row, ...(i ? rowBorder : {}) }}>
            <span style={{ fontSize: 14, fontWeight: 500 }}>{lbl}</span>
            <span style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 700, fontSize: 16 }}>{n}</span>
          </div>
        ))}
      </div>

      {/* danger zone — owner เท่านั้น */}
      {session.isOwner() && (
        <>
          <div style={{ ...secLbl, color: '#E31E24' }}>⚠️ โซนอันตราย</div>
          <div style={{ ...groupCard, marginBottom: '1.1rem', border: '1px solid #FECACA' }}>
            <div style={row}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#E31E24' }}>ล้างข้อมูลทั้งหมด</div>
                <div style={{ fontSize: 11, color: 'var(--txt3)' }}>กู้คืนไม่ได้ · ต้องกรอก PIN</div>
              </div>
              <button className="btn" style={{ background: '#E31E24', color: '#fff', padding: '7px 14px', fontSize: 13, flexShrink: 0 }} onClick={clearAll}>🗑️ ล้าง</button>
            </div>
          </div>
        </>
      )}

      <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--txt3)', padding: '.5rem 0 1rem' }}>
        Cost Manager {APP_VERSION} · React + Vite · อัพเดท {BUILD_DATE}
      </div>
    </div>
  )
}
