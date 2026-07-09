import { useState } from 'react'
import { useCost } from '../context/CostContext'
import { useToast } from '../components/Toast'
import { exportMenusCSV } from '../utils/export'

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

  const verPill = (() => { const [ma, mi, pa] = APP_VERSION.split('.'); return `v${ma}.${mi}.${(pa || '0').padStart(2, '0')}` })()

  return (
    <div className="main" style={{ maxWidth: 560, margin: '0 auto', paddingTop: '.6rem' }}>
      <div style={{ fontSize: 12, color: 'var(--txt3)', margin: '0 .25rem .9rem' }}>
        ⚙️ ตั้งค่า · {session.name} · {session.isOwner() ? 'เจ้าของ' : session.isEditor() ? 'แก้ไขได้' : 'ดูอย่างเดียว'}
      </div>

      {/* เกณฑ์ cost ratio — 3 ช่วง: ก่อน X เขียว / X–Y เหลือง / เกิน Y แดง */}
      <div className="ios-group">
        <div className="ios-sec-label">🚦 เกณฑ์ Cost Ratio</div>
        <div className="ios-card pad">
          {/* แถบสเปกตรัม 3 โซน — แสดงสัดส่วนคร่าวๆ ตามค่าที่กรอก */}
          <div style={{ display: 'flex', height: 8, borderRadius: 5, overflow: 'hidden', marginBottom: 14 }}>
            <div style={{ flex: Math.max(1, Number(green) || 1), background: '#15803D' }} />
            <div style={{ flex: Math.max(1, (Number(yellow) || 0) - (Number(green) || 0)), background: '#F59E0B' }} />
            <div style={{ flex: Math.max(1, Number(green) || 1), background: '#E31E24' }} />
          </div>

          <div className="ios-fc-row" style={{ borderTop: 'none', paddingTop: 0 }}>
            <div className="ios-fc-label">🟢 เขียว — ดีมาก</div>
            <div className="ios-fc-field">
              <span style={{ fontSize: 12, color: 'var(--txt3)' }}>ไม่เกิน</span>
              <input type="number" value={green} disabled={!session.isEditor()}
                onChange={(e) => setGreen(e.target.value)} style={{ color: '#15803D' }} />
              <span className="pct">%</span>
            </div>
          </div>
          <div className="ios-fc-row">
            <div className="ios-fc-label">🟡 เหลือง — พอได้</div>
            <div className="ios-fc-field">
              <span style={{ fontSize: 12, color: 'var(--txt3)' }}>{green}–</span>
              <input type="number" value={yellow} disabled={!session.isEditor()}
                onChange={(e) => setYellow(e.target.value)} style={{ color: '#C2410C' }} />
              <span className="pct">%</span>
            </div>
          </div>
          <div className="ios-fc-row">
            <div className="ios-fc-label">🔴 แดง — สูงเกิน</div>
            <div className="ios-fc-field">
              <span style={{ fontSize: 13, fontWeight: 700, color: '#DC2626' }}>มากกว่า {yellow}%</span>
            </div>
          </div>
          {session.isEditor() && (
            <div className="ios-fc-row" style={{ justifyContent: 'flex-end' }}>
              <button className="btn btn-red" style={{ padding: '7px 18px', fontSize: 13 }} onClick={saveThresholds}>บันทึกเกณฑ์</button>
            </div>
          )}
        </div>
      </div>

      {/* สรุปข้อมูล */}
      <div className="ios-group">
        <div className="ios-sec-label">📊 ข้อมูลในระบบ</div>
        <div className="ios-card">
          {[['🍦', 'เมนู', menus.length], ['📦', 'วัตถุดิบ', library.length], ['🧪', 'สูตรผสม', compounds.length]].map(([emo, lbl, n]) => (
            <div key={lbl} className="ios-row" style={{ cursor: 'default' }}>
              <div className="ios-row-left">
                <span className="ios-row-icon">{emo}</span>
                <span className="ios-row-title">{lbl}</span>
              </div>
              <span style={{ fontFamily: 'Prompt,sans-serif', fontWeight: 700, fontSize: 15, color: 'var(--txt)' }}>{n}</span>
            </div>
          ))}
          <div className="ios-row"
            onClick={() => { exportMenusCSV(menus) ? toast('Export CSV สำเร็จ', '📄') : toast('ยังไม่มีเมนู', '⚠️') }}>
            <div className="ios-row-left">
              <span className="ios-row-icon">📄</span>
              <span className="ios-row-title">Export เมนู (CSV)</span>
            </div>
            <span className="ios-arrow">›</span>
          </div>
        </div>
      </div>

      {/* danger zone — owner เท่านั้น */}
      {session.isOwner() && (
        <div className="ios-group">
          <div className="ios-sec-label" style={{ color: '#DC2626' }}>โซนอันตราย</div>
          <div className="ios-card">
            <div className="ios-row" onClick={clearAll} style={{ color: '#DC2626' }}>
              <div className="ios-row-left">
                <span className="ios-row-icon">🗑️</span>
                <span className="ios-row-title" style={{ color: '#DC2626' }}>ล้างข้อมูลทั้งหมด</span>
                <span className="ios-info" tabIndex={0}
                  onClick={(e) => { e.stopPropagation(); e.currentTarget.classList.toggle('tip-open') }}>ⓘ
                  <span className="ios-tip">ลบเมนู / วัตถุดิบ / สูตรผสมทั้งหมด · กู้คืนไม่ได้ · ต้องกรอก PIN ยืนยัน</span>
                </span>
              </div>
              <span className="ios-arrow">›</span>
            </div>
          </div>
        </div>
      )}

      {/* version footer — Inventory style */}
      <div className="ios-ver-footer">
        <div className="ios-ver-name">Mixue Cost Manager · BizICE</div>
        <div className="ios-ver-meta">
          <span className="ios-ver-pill">{verPill}</span>
          <span>·</span>
          <span>อัพเดท {BUILD_DATE}</span>
        </div>
      </div>
    </div>
  )
}
