import { createContext, useContext, useState, useCallback, useRef } from 'react'

const ToastCtx = createContext(() => {})
export const useToast = () => useContext(ToastCtx)

export function ToastProvider({ children }) {
  const [t, setT] = useState(null)
  const timer = useRef(null)

  const toast = useCallback((msg, icon = '✅') => {
    setT({ msg, icon })
    if (timer.current) clearTimeout(timer.current)
    timer.current = setTimeout(() => setT(null), 2400)
  }, [])

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      {t && (
        <div className="toast show">
          <span style={{ fontSize: 16 }}>{t.icon}</span>
          <span>{t.msg}</span>
        </div>
      )}
    </ToastCtx.Provider>
  )
}
