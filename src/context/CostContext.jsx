import { createContext, useContext } from 'react'
import { useCostData } from '../hooks/useCostData'
import { useSession } from '../hooks/useSession'

const Ctx = createContext(null)

export function CostProvider({ children }) {
  const data = useCostData()
  const session = useSession()
  return <Ctx.Provider value={{ ...data, session }}>{children}</Ctx.Provider>
}

export function useCost() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useCost must be used within CostProvider')
  return v
}
