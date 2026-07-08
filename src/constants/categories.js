// ─── หมวดหมู่วัตถุดิบ (library) ───
export const CATS = ['แยม', 'ผลไม้', 'ไซรัป', 'ท็อปปิ้ง', 'วัตถุดิบ', 'ขนม', 'บรรจุภัณฑ์', 'อื่นๆ']

export const CAT_EMOJI = {
  แยม: '🍓', ผลไม้: '🍋', ไซรัป: '🍯', ท็อปปิ้ง: '💎',
  วัตถุดิบ: '🥛', ขนม: '🍪', บรรจุภัณฑ์: '🥤', สูตรผสม: '🧪', อื่นๆ: '🔖',
}

// สีหัวข้อหมวด — iOS palette
export const CAT_COLOR = {
  แยม: '#E0245E', ผลไม้: '#EA580C', ไซรัป: '#B45309', ท็อปปิ้ง: '#0891B2',
  วัตถุดิบ: '#2563EB', ขนม: '#C026D3', บรรจุภัณฑ์: '#0D9488', สูตรผสม: '#7C3AED', อื่นๆ: '#6B7280',
}

// ─── หมวดย่อยของสูตรผสม (compound) ───
export const CP_CATS = ['Main', 'Soft serve', 'Topping']
export const CP_CAT_EMOJI = { Main: '🥤', 'Soft serve': '🍦', Topping: '🍬' }
export const CP_CAT_COLOR = { Main: '#2563EB', 'Soft serve': '#DB2777', Topping: '#D97706' }

// ─── หมวดเมนู ───
export const MENU_CAT_EMOJI = {
  ชาผลไม้: '🍓', ไอศกรีม: '🍦', ชานม: '🧋', กาแฟ: '☕', ชาออริจินัล: '🍵', ขนม: '🍪',
}
export const MENU_CATS = ['ชาผลไม้', 'ไอศกรีม', 'ชานม', 'กาแฟ', 'ชาออริจินัล', 'ขนม']

export function menuEmoji(cat) {
  return Object.entries(MENU_CAT_EMOJI).find(([k]) => cat && cat.includes(k))?.[1] || '🍽'
}

// placeholder แนะนำต่อหมวด (ฟอร์มเพิ่มวัตถุดิบ)
export const LIB_SUGGESTIONS = {
  แยม: 'เช่น แยมสตรอว์เบอร์รี, แยมพีช, แยมมะม่วง',
  ผลไม้: 'เช่น ส้ม, มะนาว, สับปะรด',
  ไซรัป: 'เช่น บราวน์ชูก้า, ช้อกโกแลต, เฮเซลนัท',
  ท็อปปิ้ง: 'เช่น คริสตัล, วุ้นมะพร้าว, ไข่มุก, วาฟเฟิล',
  วัตถุดิบ: 'เช่น ไอติมนม, ผงพุดดิ้ง, ชาเขียว, กาแฟ',
  ขนม: 'เช่น โคน, เวเฟอร์, คุกกี้, ขนมปัง',
  บรรจุภัณฑ์: 'เช่น แก้ว 400, แก้ว 500, ฝาโดม, หลอดใหญ่',
  อื่นๆ: 'เช่น กระดาษใบเสร็จ, สติ๊กเกอร์',
}

// สี status bar ต่อแท็บ (iOS PWA)
export const TAB_STATUS_COLORS = {
  menu: '#E31E24', library: '#2563EB', compound: '#7C3AED', compare: '#0891B2', settings: '#1A1A1A',
}
