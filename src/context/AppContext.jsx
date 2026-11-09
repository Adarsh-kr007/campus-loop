import { createContext, useCallback, useContext, useEffect, useMemo, useReducer } from 'react'
import { getSession } from '../services/authService.js'
import { getClaims } from '../services/claimService.js'
import { getItems } from '../services/itemService.js'
import { getMyActivity } from '../services/userService.js'
import { getPublicStats } from '../services/statsService.js'
import { useToast } from '../hooks/useToast.jsx'

const AppContext = createContext(null)
const initialState = { items: [], claims: [], users: [], activity: [], stats: null, user: null, ready: false, error: null }

function reducer(state, action) {
  switch (action.type) {
    case 'hydrate': return { ...state, ...action.payload, ready: true, error: null }
    case 'items': return { ...state, items: action.value }
    case 'claims': return { ...state, claims: action.value }
    case 'user': return { ...state, user: action.value, claims: action.value ? state.claims : [], activity: action.value ? state.activity : [] }
    case 'activity': return { ...state, activity: action.value }
    case 'error': return { ...state, ready: true, error: action.value }
    default: return state
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)
  const { showToast } = useToast()
  const refresh = useCallback(async () => {
    try {
      const user = await getSession()
      const [items, stats, claims, activity] = await Promise.all([
        getItems({ limit: 50 }), getPublicStats(),
        user ? getClaims(user.role === 'admin') : Promise.resolve([]),
        user ? getMyActivity({ limit: 50 }) : Promise.resolve([]),
      ])
      dispatch({ type: 'hydrate', payload: { items, stats, claims, activity, user, users: user ? [user] : [] } })
    } catch (error) {
      dispatch({ type: 'error', value: error.message })
      showToast(error.message || 'Could not load data from the API.', 'error')
    }
  }, [showToast])
  useEffect(() => { refresh() }, [refresh])
  const value = useMemo(() => ({ ...state, dispatch, refresh }), [state, refresh])
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const context = useContext(AppContext)
  if (!context) throw new Error('useApp must be used inside AppProvider')
  return context
}
