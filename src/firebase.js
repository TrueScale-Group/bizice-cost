import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'
import { getAuth } from 'firebase/auth'

// โปรเจกต์เดียวกับ vanilla เดิม + Inventory/Insight (อ่าน mixue_data ร่วมกัน)
const firebaseConfig = {
  apiKey: 'AIzaSyDRs60WURPcNArQXl5RRuwqJcLjtN3CMe4',
  authDomain: 'mixue-cost-manager.firebaseapp.com',
  projectId: 'mixue-cost-manager',
  storageBucket: 'mixue-cost-manager.firebasestorage.app',
  messagingSenderId: '414432707376',
  appId: '1:414432707376:web:1cf394f174257a86cdbef5',
}

const app = initializeApp(firebaseConfig)

// Offline persistence — แคช Firestore ลง IndexedDB, รองรับหลายแท็บ
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({
    tabManager: persistentMultipleTabManager(),
  }),
})

// SSO bootstrap (รับ custom token จาก Hub) — ใช้ project เดิม ไม่ต้องสร้าง app ใหม่
export const auth = getAuth(app)
