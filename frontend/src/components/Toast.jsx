import { useEffect, useRef } from 'react'

export default function Toast({ message, type = 'success', onHide }) {
  const ref = useRef()

  useEffect(() => {
    if (!message) return
    const el = ref.current
    el.classList.add('show')
    const t = setTimeout(() => {
      el.classList.remove('show')
      setTimeout(onHide, 300)
    }, 3000)
    return () => clearTimeout(t)
  }, [message])

  if (!message) return null

  return (
    <div ref={ref} className={`toast toast-${type}`}>
      {message}
    </div>
  )
}
