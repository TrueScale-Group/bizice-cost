/**
 * useSession — พอร์ต 1:1 จาก session guard ของ vanilla v3.9.10
 *
 * window._bizSession = { name, phone, role, expiry }  (set ใน index.html shell)
 * window._bizMode    = ?mode= จาก URL → role → 'viewer'
 *
 * กติกาสิทธิ์ (ตรงกับ vanilla):
 *  - editor = role owner/editor  หรือ  mode editor/owner  (mode viewer บังคับ false)
 *  - owner  = role owner  (โซนอันตราย/ล้างข้อมูล เห็นเฉพาะ owner)
 *  - viewer = ที่เหลือ (ซ่อนปุ่มแก้ไข/ลบ/เพิ่ม)
 */
export function useSession() {
  const s = window._bizSession || {}
  const mode = window._bizMode || ''

  const isEditor = () => {
    if (s.role === 'owner' || s.role === 'editor') return true
    if (mode === 'viewer') return false
    if (mode === 'editor' || mode === 'owner') return true
    return s.apps?.['cost'] === 'editor'
  }
  const isOwner = () => s.role === 'owner'
  const isViewer = () => !isEditor()

  return {
    session: s,
    name: s.name || '',
    phone: s.phone || '',
    role: s.role || 'viewer',
    isEditor,
    isOwner,
    isViewer,
    // ชื่อผู้แก้ไข (บันทึกลง updatedBy)
    updatedBy: s.name || 'ไม่ระบุ',
    // รูปโปรไฟล์จาก Hub: s.photo → bizice_avatar_<phone> (same-origin) → ''
    photo: s.photo || (s.phone ? (() => {
      try { return localStorage.getItem('bizice_avatar_' + s.phone) } catch { return null }
    })() : null) || '',
    initials: (s.name || '?').replace(/^(พี่|น้อง|คุณ)/, '').trim().charAt(0) || '?',
  }
}
