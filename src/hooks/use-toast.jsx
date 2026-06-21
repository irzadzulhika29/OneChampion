import * as React from 'react'
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from '@/components/ui/toast'

const TOAST_LIMIT = 5
const TOAST_REMOVE_DELAY = 5000

const ToastContext = React.createContext({})

export function Toaster() {
  const { toasts } = useToast()
  return (
    <ToastProvider>
      {toasts.map(({ id, title, description, action, ...props }) => (
        <Toast key={id} {...props}>
          <div className="grid gap-1">
            {title && <ToastTitle>{title}</ToastTitle>}
            {description && <ToastDescription>{description}</ToastDescription>}
          </div>
          {action}
          <ToastClose />
        </Toast>
      ))}
      <ToastViewport />
    </ToastProvider>
  )
}

let count = 0
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastStore = (() => {
  const listeners = new Set()
  let memoryState = { toasts: [] }

  function dispatch(action) {
    memoryState = reducer(memoryState, action)
    listeners.forEach((listener) => listener(memoryState))
  }

  function reducer(state, action) {
    switch (action.type) {
      case 'ADD_TOAST':
        return { ...state, toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) }
      case 'UPDATE_TOAST':
        return { ...state, toasts: state.toasts.map((t) => (t.id === action.toast.id ? { ...t, ...action.toast } : t)) }
      case 'DISMISS_TOAST':
        return { ...state, toasts: state.toasts.filter((t) => t.id !== action.toastId) }
      default:
        return state
    }
  }

  return { dispatch, listeners, getState: () => memoryState }
})()

function useToast() {
  const [state, setState] = React.useState(toastStore.getState())
  React.useEffect(() => {
    toastStore.listeners.add(setState)
    return () => toastStore.listeners.delete(setState)
  }, [])

  return {
    ...state,
    toast: (props) => {
      const id = genId()
      const toast = { id, open: true, onOpenChange: (open) => !open && toastStore.dispatch({ type: 'DISMISS_TOAST', toastId: id }), ...props }
      toastStore.dispatch({ type: 'ADD_TOAST', toast })
      return id
    },
    dismiss: (toastId) => toastStore.dispatch({ type: 'DISMISS_TOAST', toastId }),
  }
}

export { useToast }
