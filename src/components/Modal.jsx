import { useState } from 'react'

/**
 * Modal — กล่อง popup กลางจอ ใช้ร่วมทุกฟอร์ม
 *  - จัดกลาง + responsive (width 100% / max-width ปรับ PC·Tablet·มือถือ)
 *  - body scroll เองเมื่อเนื้อหายาว (box สูงสุด 92dvh: header/footer ติด, body เลื่อน)
 *  - guard: กด background ไม่ปิด → ปุ่ม ✕ สั่นสีแดงเตือน (กดออกที่ ✕ เท่านั้น)
 */
export default function Modal({ title, subtitle, titleExtra, onClose, footer, maxWidth = 500, minWidth = 320, guard = true, children }) {
  const [shake, setShake] = useState(false)
  const onBackdrop = (e) => {
    if (e.target !== e.currentTarget) return
    if (guard) {
      setShake(false)
      setTimeout(() => setShake(true), 10)
      setTimeout(() => setShake(false), 600)
    } else {
      onClose()
    }
  }

  return (
    <div className="modal-overlay" onClick={onBackdrop}
      style={{ position: 'fixed', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem', background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)', zIndex: 1800 }}>
      <div className="modal-box" style={{ background: 'var(--surf)', borderRadius: 20, width: '100%', maxWidth, minWidth: `min(${minWidth}px, 100%)`, maxHeight: '92dvh', display: 'flex', flexDirection: 'column', overflow: 'hidden', boxShadow: '0 16px 48px rgba(0,0,0,0.22)', animation: 'modalIn .25s ease both' }}>
        {/* header (ติด) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, padding: '.9rem 1.1rem .9rem 1.25rem', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <div style={{ minWidth: 0 }}>
            <div className="modal-title" style={{ fontSize: 16, display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>{title}{titleExtra}</div>
            {subtitle && <div className="modal-sub">{subtitle}</div>}
          </div>
          <button className={'mh-close' + (shake ? ' mh-shake' : '')} onClick={onClose} aria-label="ปิด" style={{ flexShrink: 0 }}>✕</button>
        </div>

        {/* body (เลื่อนได้) */}
        <div className="mf-body" style={{ flex: 1, minHeight: 0, maxHeight: 'none' }}>
          {children}
        </div>

        {/* footer (ติด) */}
        {footer && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '.85rem 1.1rem', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  )
}
