// ─── ต้นทุน/กำไร — พอร์ต 1:1 จาก vanilla v3.9.10 ───
import { num } from './format'

// ต้นทุนวัตถุดิบต่อ 1 แก้ว ตามขนาด (U/S, M, L)
// sizeTarget: 'all' ใช้ qtyS/qtyM (L = M×1.25) · 'U'/'M'/'L' = เฉพาะขนาดนั้น (ใช้ qty)
export function calcCost(ingr, size) {
  return (ingr || []).reduce((s, i) => {
    const st = i.sizeTarget || 'all'
    let q = 0
    if (st === 'all') {
      q = (size === 'S' || size === 'U') ? (i.qtyS || 0)
        : size === 'M' ? (i.qtyM || 0)
          : (i.qtyM || 0) * 1.25
    } else if (st === 'U') {
      q = (size === 'U' || size === 'S') ? (i.qty || 0) : 0
    } else if (st === 'M') {
      q = size === 'M' ? (i.qty || 0) : 0
    } else if (st === 'L') {
      q = size === 'L' ? (i.qty || 0) : 0
    }
    return s + q * (i.pricePerUnit || 0)
  }, 0)
}

// ต้นทุนสูตรผสมต่อหน่วยผลผลิต (หาร effectiveQty = outputQty × yield/100)
export function calcCompound(c) {
  const totalIngredientCost = (c.ingredients || []).reduce(
    (s, ing) => s + (num(ing.qty) * num(ing.unitPrice)), 0,
  )
  const effectiveQty = num(c.outputQty) * (num(c.yield || 100) / 100)
  const costPerOutputUnit = effectiveQty > 0 ? totalIngredientCost / effectiveQty : 0
  return { costPerOutputUnit, totalIngredientCost }
}

// ─── เกณฑ์ traffic-light (green/yellow % จาก settings) ───
export function gpCls(p, settings) {
  const g = settings?.green || 25, y = settings?.yellow || 35
  return p <= g ? 'badge-good' : p <= y ? 'badge-warn' : 'badge-bad'
}
export function gpLbl(p, settings) {
  const g = settings?.green || 25, y = settings?.yellow || 35
  return p <= g ? 'ดีมาก ✓' : p <= y ? 'พอได้ ⚠' : 'สูงเกิน ✗'
}
export function gpColor(p, settings) {
  const g = settings?.green || 25, y = settings?.yellow || 35
  return p <= g ? '#15803D' : p <= y ? '#C2410C' : '#E31E24'
}

// cost ratio % ที่ดีที่สุดของเมนู (ต่ำสุดจากทุกขนาดที่มีราคา)
export function getBestPct(m) {
  const sizes = [
    { p: m.priceS, k: 'S' }, { p: m.priceM, k: 'M' }, { p: m.priceL, k: 'L' },
  ].filter((x) => num(x.p) > 0)
  if (!sizes.length) return null
  let best = null
  for (const s of sizes) {
    const c = calcCost(m.ingredients, s.k)
    const pct = num(s.p) > 0 ? (c / num(s.p)) * 100 : 0
    if (best === null || pct < best) best = pct
  }
  return best
}

// ─── LIVE-LINK: ราคาวัตถุดิบเปลี่ยน → cascade compounds → menus ───
// คืน { menus, compounds } ชุดใหม่ (immutable-ish) — เรียกก่อน save เสมอ
export function recalcAll(library, compounds, menus) {
  const nextCompounds = compounds.map((c) => {
    const ingredients = (c.ingredients || []).map((ing) => {
      if (ing.sourceType === 'library' && ing.sourceId) {
        const lib = library.find((x) => x.id === ing.sourceId)
        if (lib) return { ...ing, unitPrice: lib.unitPrice || 0 }
      }
      return ing
    })
    const c2 = { ...c, ingredients }
    const { costPerOutputUnit } = calcCompound(c2)
    return { ...c2, costPerOutputUnit }
  })

  const nextMenus = menus.map((m) => {
    const ingredients = (m.ingredients || []).map((ing) => {
      if (ing.sourceType === 'library' && ing.sourceId) {
        const lib = library.find((x) => x.id === ing.sourceId)
        if (lib) return { ...ing, pricePerUnit: lib.unitPrice || 0 }
      } else if (ing.sourceType === 'compound' && ing.sourceId) {
        const cp = nextCompounds.find((x) => x.id === ing.sourceId)
        if (cp) return { ...ing, pricePerUnit: cp.costPerOutputUnit || 0 }
      }
      return ing
    })
    return { ...m, ingredients }
  })

  return { compounds: nextCompounds, menus: nextMenus }
}

// นับการใช้งาน (เตือนก่อนลบ)
export function libUsage(id, menus, compounds) {
  const usesLib = (ing) =>
    (ing.sourceType == null || ing.sourceType === 'library') &&
    (ing.sourceId === id || ing.libId === id)
  const m = menus.filter((x) => x.ingredients?.some(usesLib)).length
  const c = compounds.filter((x) => x.ingredients?.some(usesLib)).length
  return { m, c, total: m + c }
}
// ตัวจริง (ไม่ใช่แค่นับ) ของเมนู/สูตรผสมที่ใช้วัตถุดิบนี้ — สำหรับ popup "🔗 ใช้ในเมนู" ให้กดลิงก์ไปดูได้
export function libUsageDetail(id, menus, compounds) {
  const usesLib = (ing) =>
    (ing.sourceType == null || ing.sourceType === 'library') &&
    (ing.sourceId === id || ing.libId === id)
  return {
    menus: menus.filter((x) => x.ingredients?.some(usesLib)),
    compounds: compounds.filter((x) => x.ingredients?.some(usesLib)),
  }
}
export function compoundUsage(id, menus) {
  const m = menus.filter((x) =>
    x.ingredients?.some((ing) => ing.sourceType === 'compound' && ing.sourceId === id),
  ).length
  return { m, total: m }
}
