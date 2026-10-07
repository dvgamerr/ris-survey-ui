import { useEffect, useRef, useState } from 'preact/hooks'
import Sortable from 'sortablejs'
import { flash, request, toast } from '../lib/toast'

interface Row { key: number, item_id: number | null, subject: string, description: string, valid: boolean | null }
interface Props {
  taskId?: number
  title?: string
  meta?: string
  items?: { item_id: number, subject: string, description: string }[]
}

let seq = 0
const blank = (): Row => ({ key: ++seq, item_id: null, subject: '', description: '', valid: null })

export default function TaskEditor (props: Props) {
  const editing = props.taskId !== undefined
  const [title, setTitle] = useState(props.title ?? '')
  const [rows, setRows] = useState<Row[]>(() =>
    props.items?.length
      ? props.items.map(i => ({ key: ++seq, item_id: i.item_id, subject: i.subject, description: i.description, valid: null }))
      : [blank(), blank(), blank()])
  const [busy, setBusy] = useState(false)
  const listRef = useRef<HTMLUListElement>(null)

  useEffect(() => {
    if (!listRef.current) return
    const sortable = Sortable.create(listRef.current, {
      handle: '.handle',
      animation: 120,
      forceFallback: true,
      ghostClass: 'sortable-ghost',
      onEnd: ({ oldIndex, newIndex, item, from }) => {
        if (oldIndex == null || newIndex == null || oldIndex === newIndex) return
        // put the DOM back and let the (keyed) state drive the reorder
        from.removeChild(item)
        from.insertBefore(item, from.children[oldIndex] ?? null)
        setRows(r => {
          const c = [...r]
          const [moved] = c.splice(oldIndex, 1)
          c.splice(newIndex, 0, moved)
          return c
        })
      }
    })
    return () => sortable.destroy()
  }, [])

  const patch = (key: number, p: Partial<Row>) => setRows(r => r.map(x => (x.key === key ? { ...x, ...p, valid: null } : x)))

  const onSubmit = async (e: Event) => {
    e.preventDefault()
    if (busy) return
    const seen = new Map<string, number>()
    const dup = new Set<number>()
    const empty = new Set<number>()
    for (const r of rows) {
      const s = r.subject.replace(/\s+/g, ' ').trim().toLowerCase()
      if (!s) { empty.add(r.key); continue }
      if (seen.has(s)) { dup.add(r.key); dup.add(seen.get(s)!) } else seen.set(s, r.key)
    }
    if (empty.size || dup.size) {
      setRows(rs => rs.map(r => ({ ...r, valid: empty.has(r.key) || dup.has(r.key) ? false : null })))
      toast(dup.size ? 'list is same.' : 'Every list needs a name.', 'error')
      return
    }

    setBusy(true)
    try {
      const body = { title, items: rows.map(r => ({ item_id: r.item_id, subject: r.subject, description: r.description })) }
      const res = editing ? await request(`/api/tasks/${props.taskId}`, 'PUT', body) : await request('/api/tasks', 'POST', body)
      if (res.data?.success) {
        flash(editing ? 'This CheckList is Updated!' : 'This CheckList is Created.')
        location.href = '/'
        return
      }
      toast(res.data?.error || 'Error API', 'error')
    } catch (ex: any) {
      toast(ex?.message || 'Request failed.', 'error')
    }
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} class="pb-5 mb-5">
      <div class="form-group row align-items-center">
        <label for="title" class="col-sm-auto col-form-label"><h3 class="title-text">Title :</h3></label>
        <div class="col-sm">
          <input id="title" class="form-control" value={title} maxLength={50} required placeholder="Title Name" autofocus
            onInput={e => setTitle((e.target as HTMLInputElement).value)} />
        </div>
      </div>
      {props.meta && <small class="time d-block mb-2" data-testid="task-meta">{props.meta}</small>}

      <ul class="list-group" ref={listRef} data-testid="items">
        {rows.map((r, i) => (
          <li key={r.key} class="list-group-item" data-testid="item-row">
            <div class="d-flex align-items-start">
              <span class="handle" title="Drag to reorder" data-testid="handle" aria-hidden="true">⋮⋮</span>
              <span class="pt-1 pr-2" data-testid="item-no">{i + 1}.</span>
              <div class="flex-grow-1">
                <input class={`form-control form-control-sm mb-1 ${r.valid === false ? 'is-invalid' : ''}`} placeholder="List Name" maxLength={50}
                  aria-label={`List name ${i + 1}`} value={r.subject} onInput={e => patch(r.key, { subject: (e.target as HTMLInputElement).value })} />
                <textarea class="form-control form-control-sm" rows={2} placeholder="List Description" maxLength={500}
                  aria-label={`List description ${i + 1}`} value={r.description} onInput={e => patch(r.key, { description: (e.target as HTMLTextAreaElement).value })} />
              </div>
              {rows.length > 1 && (
                <button type="button" class="closebox" aria-label={`Remove list ${i + 1}`} onClick={() => setRows(rs => rs.filter(x => x.key !== r.key))}>×</button>
              )}
            </div>
          </li>
        ))}
      </ul>

      <div class="survey-submit">
        <div class="container d-flex justify-content-between align-items-center">
          <div>
            <button type="button" class="btn btn-sm btn-outline-info" onClick={() => setRows(r => [...r, blank()])}>Add new list +</button>
            <span class="ml-2" data-testid="count">Now, {rows.length} list(s).</span>
          </div>
          <div>
            <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? 'Approving...' : editing ? 'Save' : 'Submit'}</button>
            <a href="/" class="btn btn-secondary ml-1">Back</a>
          </div>
        </div>
      </div>
    </form>
  )
}
