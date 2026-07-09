import { createContext, useContext, useState } from 'react'
import { useCostData } from '../hooks/useCostData'
import { useSession } from '../hooks/useSession'
import { useInventoryMaster } from '../hooks/useInventoryMaster'

const Ctx = createContext(null)

export function CostProvider({ children }) {
  const data = useCostData()
  const session = useSession()
  // โหลดครั้งเดียวทั้งแอพ (ไม่ใช่ทุกครั้งที่เปิดฟอร์ม) — ใช้ join อีโมจิต่อชิ้นให้ตรงกับคลังกลาง (Inventory)
  const { byName: masterByName, catOrder } = useInventoryMaster()
  // ── ข้ามหน้าไปเปิดดูเมนู/สูตรผสม (จาก popup "🔗 ใช้ในเมนู") ──
  //   หน้าที่เรียก setPendingXxx เอง call go(tab) ต่อด้วย → หน้าปลายทางเปิด view ตอน mount แล้วเคลียร์ค่า
  const [pendingMenuView, setPendingMenuView] = useState(null)
  const [pendingCompoundEdit, setPendingCompoundEdit] = useState(null)
  return <Ctx.Provider value={{ ...data, session, masterByName, catOrder, pendingMenuView, setPendingMenuView, pendingCompoundEdit, setPendingCompoundEdit }}>{children}</Ctx.Provider>
}

export function useCost() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCost must be used within CostProvider')
  return v
}
