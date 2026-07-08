import { useState, useEffect } from 'react'
import { collection, getDocs, doc, getDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { COL } from '../constants/collections'

/**
 * useInventoryMaster — อ่าน Master Data ของ Inventory (read-only, cross-app)
 *   Inv_items: อีโมจิต่อชิ้น (img) + category + sortOrder (join กับ library ด้วยชื่อ)
 *   Inv_settings/categories.list: ลำดับหมวด (catOrder) live
 * โหลดครั้งเดียวตอน mount (master data นิ่ง) — คืน { byName: Map(name→item), catOrder: [] }
 */
export function useInventoryMaster() {
  const [master, setMaster] = useState({ byName: new Map(), catOrder: [] })

  useEffect(() => {
    let alive = true
    ;(async () => {
      try {
        const [itemsSnap, catSnap] = await Promise.all([
          getDocs(collection(db, COL.INV_ITEMS)),
          getDoc(doc(db, COL.INV_SETTINGS, 'categories')),
        ])
        if (!alive) return
        const byName = new Map()
        itemsSnap.forEach((d) => {
          const it = { id: d.id, ...d.data() }
          if (it.name) byName.set(String(it.name).trim(), it)
        })
        const catOrder = catSnap.exists() && Array.isArray(catSnap.data().list)
          ? catSnap.data().list.map((c) => c.name)
          : []
        setMaster({ byName, catOrder })
      } catch (e) {
        console.warn('[useInventoryMaster] load error', e)
      }
    })()
    return () => { alive = false }
  }, [])

  return master
}
