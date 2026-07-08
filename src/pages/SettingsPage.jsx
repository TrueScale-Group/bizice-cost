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

  return (
    <div className="main">
      <div className="ph" style={{ marginBottom: '1rem' }}>
        <h1 style={{ fontFamily: 'Prompt,sans-serif', fontSize: 22, fontWeight: 600 }}>⚙️ ตั้งค่า</h1>
        <div style={{ fontSize: 12.5, color: 'var(--txt3)', marginTop: 2 }}>
          {session.name} · {session.isOwner() ? 'เจ้าของ' : session.isEditor() ? 'แก้ไขได้' : 'ดูอย่างเดียว'}
        </div>
      </div>

      {/* เกณฑ์ cost ratio */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>🚦 เกณฑ์ Cost Ratio</div>
        <div style={{ fontSize: 12, color: 'var(--txt3)', marginBottom: 12 }}>ต่ำกว่าเขียว = ดีมาก · ระหว่างเขียว–เหลือง = พอได้ · เกินเหลือง = สูงเกิน</div>
        <div style={{ display: 'flex', gap: 12 }}>
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#15803D', marginBottom: 4 }}>เขียว (≤%)</div>
            <input type="number" className="inp" value={green} disabled={!session.isEditor()} onChange={(e) => setGreen(e.target.value)} style={{ width: '100%' }} />
          </label>
          <label style={{ flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#C2410C', marginBottom: 4 }}>เหลือง (≤%)</div>
            <input type="number" className="inp" value={yellow} disabled={!session.isEditor()} onChange={(e) => setYellow(e.target.value)} style={{ width: '100%' }} />
          </label>
        </div>
        {session.isEditor() && (
          <button className="btn btn-red" style={{ marginTop: 12 }} onClick={saveThresholds}>บันทึกเกณฑ์</button>
        )}
      </div>

      {/* สรุปข้อมูล */}
      <div className="card" style={{ marginBottom: '1rem' }}>
        <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>📊 ข้อมูลในระบบ</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, textAlign: 'center' }}>
          {[['เมนู', menus.length], ['วัตถุดิบ', library.length], ['สูตรผสม', compounds.length]].map(([lbl, n]) => (
            <div key={lbl} style={{ background: 'var(--surf2)', borderRadius: 12, padding: '12px 8px' }}>
              <div style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 800, fontSize: 22 }}>{n}</div>
              <div style={{ fontSize: 11.5, color: 'var(--txt3)' }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      {/* danger zone — owner เท่านั้น */}
      {session.isOwner() && (
        <div className="card" style={{ marginBottom: '1rem', border: '1.5px solid #FECACA', background: '#FFF5F5' }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#E31E24', marginBottom: 4 }}>⚠️ โซนอันตราย</div>
          <div style={{ fontSize: 12, color: 'var(--txt2)', marginBottom: 12 }}>ล้างข้อมูลทั้งหมด — กู้คืนไม่ได้ (ต้องกรอก PIN)</div>
          <button className="btn" style={{ background: '#E31E24', color: '#fff' }} onClick={clearAll}>🗑️ ล้างข้อมูลทั้งหมด</button>
        </div>
      )}

      <div style={{ textAlign: 'center', fontSize: 11.5, color: 'var(--txt3)', padding: '1rem 0 2rem' }}>
        Cost Manager {APP_VERSION} · อัพเดท {BUILD_DATE}
        <div style={{ marginTop: 2, fontSize: 10.5 }}>React + Vite · BizICE</div>
      </div>
    </div>
  )
}
