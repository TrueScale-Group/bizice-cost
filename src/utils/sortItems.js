// ลำดับหมวดหมู่มาตรฐาน — ตรงกับ Inventory (fallback เมื่อยังไม่โหลด catOrder)
export const CAT_ORDER = ['แยม', 'ผลไม้', 'ไซรัป', 'ท็อปปิ้ง', 'วัตถุดิบ', 'ขนม', 'บรรจุภัณฑ์', 'อื่นๆ', 'สูตรผสม']

// อีโมจิต่อชิ้นจาก Inventory master (item.img) — join ด้วยชื่อ · fallback 📦 (เหมือน Inventory)
export function itemEmoji(name, masterByName) {
  const m = masterByName?.get?.(String(name || '').trim())
  return (m && m.img) || '📦'
}

/**
 * เรียง library ตาม Master Data (ตรรกะเดียวกับ Inventory sortByMaster):
 *   1) ตำแหน่งหมวดตาม catOrder (live) → fallback CAT_ORDER
 *   2) sortOrder ในหมวด (จาก master ?? 999)
 *   3) name localeCompare 'th'
 * ใช้หมวดจาก master ถ้ามี ไม่งั้นใช้ item.cat
 */
export function sortLibraryByMaster(library, masterByName, catOrder) {
  const ORDER = (catOrder && catOrder.length) ? catOrder : CAT_ORDER
  const info = (el) => {
    const m = masterByName?.get?.(String(el.name || '').trim())
    return {
      cat: (m && m.category) || el.cat || 'อื่นๆ',
      sortOrder: (m && m.sortOrder != null) ? m.sortOrder : 999,
      name: el.name || '',
    }
  }
  return [...(library || [])].sort((a, b) => {
    const ia = info(a), ib = info(b)
    const cia = ORDER.indexOf(ia.cat), cib = ORDER.indexOf(ib.cat)
    const ca = cia < 0 ? 999 : cia, cb = cib < 0 ? 999 : cib
    if (ca !== cb) return ca - cb
    if (ia.sortOrder !== ib.sortOrder) return ia.sortOrder - ib.sortOrder
    return ia.name.localeCompare(ib.name, 'th')
  })
}

// ลำดับหมวดสำหรับ group headers (catOrder live → fallback CAT_ORDER)
export function catGroupOrder(catOrder) {
  return (catOrder && catOrder.length) ? catOrder : CAT_ORDER
}
