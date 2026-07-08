/**
 * Firestore collection/doc names — Cost Manager
 *
 * ⚠️ mixue_data/mixue-cost-manager เป็น doc เดียวที่ Inventory + Insight อ่านตรงๆ
 *    field { menus, library, compounds } ห้ามเปลี่ยนโครงสร้าง (ดู memory cost-manager-data-contract)
 */
export const COL = {
  MIXUE_DATA: 'mixue_data',          // Cost Manager owns
  INCOME_NOTIFICATIONS: 'income_notifications',  // กระดิ่งแจ้งเตือน (อ่านอย่างเดียว)
}

export const MIXUE_DATA_DOC = 'mixue-cost-manager'

// localStorage mirror keys (คงจาก vanilla เดิม เพื่อ fallback offline + ไม่ต้อง migrate ข้อมูล)
export const SK = {
  MENUS: 'mx_menus_v4',
  LIBRARY: 'mx_library_v1',
  COMPOUNDS: 'mx_compound_v1',
  SETTINGS: 'mx_settings_v1',
}
