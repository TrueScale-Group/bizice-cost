import { calcCost } from './cost'
import { num } from './format'

// Export เมนูเป็น CSV (พอร์ต 1:1 จาก vanilla exportCSV)
export function exportMenusCSV(menus) {
  if (!menus.length) return false
  let csv = 'ชื่อเมนู,หมวดหมู่,Size,ราคาขาย,ต้นทุนวัตถุดิบ,กำไร,Food Cost%,GP%\n'
  menus.forEach((m) => {
    ;[['U', m.priceS], ['M', m.priceM], ['L', m.priceL]]
      .filter(([, p]) => num(p) > 0)
      .forEach(([sz, price]) => {
        const p = num(price)
        const cost = calcCost(m.ingredients, sz)
        const pct = p > 0 ? (cost / p) * 100 : 0
        csv += `"${m.name}","${m.cat}",${sz},${p.toFixed(2)},${cost.toFixed(2)},${(p - cost).toFixed(2)},${pct.toFixed(2)}%,${(100 - pct).toFixed(2)}%\n`
      })
  })
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'mixue_cost.csv'
  a.click()
  URL.revokeObjectURL(url)
  return true
}
