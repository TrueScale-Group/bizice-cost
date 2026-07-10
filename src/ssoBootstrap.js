import { signInWithCustomToken, onAuthStateChanged } from 'firebase/auth'
import { auth } from './firebase'

// SSO bootstrap — รับ custom token จาก Hub (#t=...) แล้ว signInWithCustomToken เพื่อให้มี
// request.auth จริงสำหรับ Firestore role-based rules · ไม่รื้อ logic อ่าน session เดิม
// (?mode/user/phone/branch) — ให้ทำงานคู่กันไปก่อนจนกว่าจะ cutover ทั้ง 6 แอพพร้อมกัน
const HUB_URL = 'https://bizice.web.app'

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
    location.href = HUB_URL
    return null
  }

  const { claims } = await user.getIdTokenResult() // { role, branch_id, apps, phone }
  return claims
}
