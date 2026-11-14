import { useUI } from '@/context/UIContext.jsx'
import s from './Toast.module.css'

export function Toast() {
  const { toast } = useUI()
  return (
    <div className={s.region} role="status" aria-live="polite">
      {toast && (
        <div key={toast.id} className={s.toast}>
          <span className={s.code}>200</span>
          {toast.message}
        </div>
      )}
    </div>
  )
}
