export type ToastType = 'success' | 'error'

export function toast (message: string, type: ToastType = 'success', ms = 3500) {
  let host = document.getElementById('toasts')
  if (!host) {
    host = document.createElement('div')
    host.id = 'toasts'
    document.body.appendChild(host)
  }
  const el = document.createElement('div')
  el.className = `app-toast ${type}`
  el.setAttribute('role', type === 'error' ? 'alert' : 'status')
  el.textContent = message
  host.appendChild(el)
  setTimeout(() => el.remove(), ms)
}

const KEY = 'app.flash'

/** Show a toast on the next page (survives a navigation). */
export function flash (message: string, type: ToastType = 'success') {
  try { sessionStorage.setItem(KEY, JSON.stringify({ message, type })) } catch { /* storage blocked */ }
}

export function showFlash () {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (!raw) return
    sessionStorage.removeItem(KEY)
    const { message, type } = JSON.parse(raw)
    toast(message, type)
  } catch { /* ignore */ }
}

export async function request<T = any> (url: string, method: string, body?: unknown): Promise<{ ok: boolean, status: number, data: T }> {
  const res = await fetch(url, { method, headers: body === undefined ? undefined : { 'content-type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  const data = await res.json().catch(() => ({}))
  return { ok: res.ok, status: res.status, data }
}
