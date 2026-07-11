import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

// SSO bootstrap — รับ custom token จาก Hub (#t=...) แล้ว signInWithCustomToken เพื่อให้มี
// request.auth จริงสำหรับ Firestore role-based rules · ไม่รื้อ logic อ่าน session เดิม
// (?mode/user/phone/branch) — ให้ทำงานคู่กันไปก่อนจนกว่าจะ cutover ทั้ง 6 แอพพร้อมกัน
const HUB_URL = '/'   // origin-relative: Hub อยู่ root ของ origin เดียวกัน (single-origin) — ใช้ได้ทั้ง preview/live
// เฉพาะ localhost (dev server) เท่านั้น — ข้าม redirect ไป Hub เพื่อทดสอบ UI ได้ตรง ๆ โดยไม่ต้อง
// login จริง (ไม่มีทางเข้าเงื่อนไขนี้บน production — github.io / web.app ไม่ใช่ hostname นี้)
const isLocalDev = /^(localhost|127\.0\.0\.1)$/.test(location.hostname)

export async function ssoBootstrap() {
  const m = location.hash.match(/[#&]t=([^&]+)/)
  const token = m ? decodeURIComponent(m[1]) : null

  if (token) {
    try {
      await signInWithCustomToken(auth, token)
    } catch (e) {
      console.error('[ssoBootstrap] signInWithCustomToken', e)
    }
    history.replaceState(null, '', location.pathname + location.search) // ล้าง token ทิ้งจาก URL
  }

  // รอ auth state — ไม่มี user = ไม่ได้เข้าทาง Hub → เด้งกลับ Hub (กันเข้าตรง)
  const user = await new Promise((res) => {
    const off = onAuthStateChanged(auth, (u) => { off(); res(u) })
  })
  if (!user) {
    if (isLocalDev) return null // dev: ไม่มี custom token ก็ปล่อยให้แอพขึ้น (Firestore rule ที่ต้อง auth จะยัง reject เอง)
    location.href = HUB_URL
    return null
  }

  const { claims } = await user.getIdTokenResult() // { role, branch_id, apps, phone }

  // sync sidebar (window._bizSession) ให้ตรงกับ claims จริงจาก Hub — เชื่อ role/apps/phone
  // จาก token ที่เซ็นมา (แก้ไม่ได้) มากกว่า query param/cache เดิมที่พิมพ์ URL ปลอมได้
  // (name ไม่มีใน claims → คง fallback เดิมจาก query param/cache ไว้)
  const prev = window._bizSession || {}
  const merged = {
    ...prev,
    phone: claims.phone || prev.phone || '',
    role: claims.role || prev.role || 'viewer',
    apps: claims.apps || prev.apps,
    branch_id: claims.branch_id ?? prev.branch_id,
    expiry: Date.now() + 86400000,
  }
  window._bizSession = merged
  try { localStorage.setItem('bizice_session', JSON.stringify(merged)) } catch (e) {}

  return claims
}
