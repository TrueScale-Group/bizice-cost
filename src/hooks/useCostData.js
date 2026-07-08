import { useState, useEffect, useRef, useCallback } from 'react'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '../firebase'
import { COL, MIXUE_DATA_DOC, SK } from '../constants/collections'

const DEFAULT_SETTINGS = { username: '', shopname: '', green: 25, yellow: 35 }

function readLS(key, fallback) {
  try {
    const v = localStorage.getItem(key)
    return v ? JSON.parse(v) : fallback
  } catch { return fallback }
}
function writeLS(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)) } catch {}
}

/**
 * useCostData — โหลด/บันทึก doc mixue_data/mixue-cost-manager
 *  - load ครั้งเดียวตอน mount (getDoc) + fallback localStorage (พอร์ตพฤติกรรม vanilla)
 *  - save: mirror localStorage ทันที + debounce 700ms → setDoc({menus,library,compounds},{merge:true})
 *  - flush ตอน visibilitychange(hidden) / pagehide
 *  - settings: localStorage only (mx_settings_v1) ไม่อยู่ Firestore
 */
export function useCostData() {
  const [menus, setMenus] = useState([])
  const [library, setLibrary] = useState([])
  const [compounds, setCompounds] = useState([])
  const [settings, setSettings] = useState(() => ({ ...DEFAULT_SETTINGS, ...readLS(SK.SETTINGS, {}) }))
  const [loading, setLoading] = useState(true)

  // เก็บ snapshot ล่าสุดไว้ flush ตอนออกจากหน้า
  const latest = useRef({ menus: [], library: [], compounds: [] })
  const timer = useRef(null)
  const pending = useRef(false)

  const flush = useCallback(() => {
    if (!pending.current) return
    pending.current = false
    if (timer.current) { clearTimeout(timer.current); timer.current = null }
    const { menus, library, compounds } = latest.current
    setDoc(
      doc(db, COL.MIXUE_DATA, MIXUE_DATA_DOC),
      { menus, library, compounds },
      { merge: true },
    ).catch((e) => console.warn('Firestore save error', e))
  }, [])

  // persist: mirror localStorage ทันที + debounce Firestore
  const persist = useCallback((next) => {
    latest.current = next
    writeLS(SK.MENUS, next.menus)
    writeLS(SK.LIBRARY, next.library)
    writeLS(SK.COMPOUNDS, next.compounds)
    pending.current = true
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(flush, 700)
  }, [flush])

  // reload — อ่าน doc ใหม่จาก Firestore (ใช้ตอน mount + pull-to-refresh + auto 5 นาที)
  const reload = useCallback(async () => {
    const apply = (m, l, c) => {
      setMenus(m); setLibrary(l); setCompounds(c)
      latest.current = { menus: m, library: l, compounds: c }
    }
    try {
      // push งานที่ค้างขึ้น server ก่อน แล้วค่อยอ่านใหม่ (กัน overwrite งานที่เพิ่งกด)
      flush()
      const snap = await getDoc(doc(db, COL.MIXUE_DATA, MIXUE_DATA_DOC))
      if (snap.exists()) {
        const d = snap.data()
        apply(d.menus || [], d.library || [], d.compounds || [])
      } else {
        apply(readLS(SK.MENUS, []), readLS(SK.LIBRARY, []), readLS(SK.COMPOUNDS, []))
      }
    } catch (e) {
      console.warn('Firestore reload error → fallback localStorage', e)
      apply(readLS(SK.MENUS, []), readLS(SK.LIBRARY, []), readLS(SK.COMPOUNDS, []))
    } finally {
      setLoading(false)
    }
  }, [flush])

  // โหลดครั้งเดียวตอน mount
  useEffect(() => { reload() }, [reload])

  // flush ตอนออกจากหน้า
  useEffect(() => {
    const onHide = () => { if (document.hidden) flush() }
    document.addEventListener('visibilitychange', onHide)
    window.addEventListener('pagehide', flush)
    return () => {
      document.removeEventListener('visibilitychange', onHide)
      window.removeEventListener('pagehide', flush)
    }
  }, [flush])

  /**
   * commit — อัปเดตข้อมูล 1 ก้อนแล้ว persist
   * @param next partial { menus?, library?, compounds? }
   */
  const commit = useCallback((next) => {
    const merged = {
      menus: next.menus ?? latest.current.menus,
      library: next.library ?? latest.current.library,
      compounds: next.compounds ?? latest.current.compounds,
    }
    if (next.menus) setMenus(next.menus)
    if (next.library) setLibrary(next.library)
    if (next.compounds) setCompounds(next.compounds)
    persist(merged)
  }, [persist])

  const saveSettings = useCallback((next) => {
    const merged = { ...DEFAULT_SETTINGS, ...next }
    setSettings(merged)
    writeLS(SK.SETTINGS, merged)
  }, [])

  return {
    menus, library, compounds, settings, loading,
    commit, saveSettings, flush, reload,
  }
}
