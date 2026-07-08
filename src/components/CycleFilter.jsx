/**
 * CycleFilter — ปุ่มกรองหมวดปุ่มเดียว คลิกวนหมวด (แทนแถบ chip ที่ต้องเลื่อน)
 *   states = ['all', ...cats] · แสดงหมวดปัจจุบัน + ไอคอนวน · คลิก = หมวดถัดไป
 *   props: cats[], value, onChange, emojiOf(cat), allLabel
 */
export default function CycleFilter({ cats, value, onChange, emojiOf, allLabel = 'ทุกหมวด', count }) {
  const states = ['all', ...cats]
  const idx = Math.max(0, states.indexOf(value))
  const cycle = () => onChange(states[(idx + 1) % states.length])
  const label = value === 'all' ? `🧊 ${allLabel}` : `${emojiOf ? emojiOf(value) : ''} ${value}`

  return (
    <button
      onClick={cycle}
      style={{
        flex: 1, minWidth: 0, display: 'flex', alignItems: 'center', gap: 8,
        padding: '9px 12px', borderRadius: 12, cursor: 'pointer',
        border: '1.5px solid var(--border2)', background: 'var(--surf)',
        fontFamily: "'Sarabun',sans-serif", fontSize: 14, fontWeight: 700, color: 'var(--txt)',
      }}
      title="แตะเพื่อเปลี่ยนหมวด"
    >
      <span style={{ flex: 1, textAlign: 'left', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{label}</span>
      {count != null && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--txt3)' }}>{count}</span>}
      <span style={{ fontSize: 15, color: 'var(--red)', flexShrink: 0 }}>⇄</span>
    </button>
  )
}
