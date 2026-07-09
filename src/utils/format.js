// HTML escape (ใช้ตอน render string ที่ผู้ใช้กรอก)
export function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ))
}

export function num(v) {
  const n = parseFloat(v)
  return isNaN(n) ? 0 : n
}

// วันที่ DD.MM.YYYY (ค.ศ.) — พอร์ตจาก vanilla fmtDate
export function fmtDate(d) {
  if (!d) return '—'
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(String(d))) return d
  const dt = d instanceof Date ? d : new Date(d)
  if (!isNaN(dt.getTime())) {
    return (
      String(dt.getDate()).padStart(2, '0') + '.' +
      String(dt.getMonth() + 1).padStart(2, '0') + '.' +
      dt.getFullYear()
    )
  }
  const m = String(d).match(/(\d+)\/(\d+)\/(\d+)/)
  if (m) {
    const dd = String(m[1]).padStart(2, '0')
    const mo = String(m[2]).padStart(2, '0')
    const yr = parseInt(m[3]) > 2500 ? parseInt(m[3]) - 543 : parseInt(m[3])
    return dd + '.' + mo + '.' + yr
  }
  return d
}

export function fmtDateNow() {
  return fmtDate(new Date())
}

// id สั้นๆ (แทน Date.now()+random ของ vanilla)
export function genId() {
  return 'id' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
}

export function baht(n) {
  return (num(n)).toLocaleString('th-TH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// ── ช่องกรอกตัวเลขมี comma คั่นหลักพันระหว่างพิมพ์ (ราคา/ปริมาณ) ──
//   เก็บ state เป็นสตริงดิบไว้คำนวณ (ไม่ใช่ค่าที่ format แล้ว) ใช้คู่กับ <input type="text" inputMode="decimal">
export function fmtQtyInput(raw) {
  if (raw === '' || raw == null) return ''
  if (/\.$/.test(String(raw))) return raw // กำลังพิมพ์จุดทศนิยมค้างอยู่ ยังไม่แปลง กันค่าเพี้ยน
  const n = Number(raw)
  return isNaN(n) ? raw : n.toLocaleString('th-TH', { maximumFractionDigits: 6 })
}
export function parseQtyInput(str) {
  const raw = String(str).replace(/,/g, '')
  return /^\d*\.?\d*$/.test(raw) ? raw : null
}
