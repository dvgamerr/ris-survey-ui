import { useEffect, useState } from 'preact/hooks'
import { flash, request, toast } from '../lib/toast'

type Status = 'FAIL' | 'WARN' | 'INFO' | ''

export interface FormItem {
  item_id: number
  subject: string
  description: string
  selected: boolean
  problem: boolean
  status: Status
  reason: string
}

interface Props {
  /** "new" = fill a checklist, "edit" = amend a past survey */
  mode: 'new' | 'edit'
  taskId?: number
  surveyId?: string
  items: FormItem[]
}

const variant: Record<string, string> = { FAIL: 'danger', WARN: 'warning', INFO: 'info' }
const draftKey = (taskId?: number) => `survey.tasks.${taskId}`

export default function SurveyForm ({ mode, taskId, surveyId, items }: Props) {
  const editing = mode === 'edit'
  const [rows, setRows] = useState<FormItem[]>(items)
  const [busy, setBusy] = useState(false)
  const [showInvalid, setShowInvalid] = useState(false)

  // restore a draft saved in this browser (only when it still matches the checklist)
  useEffect(() => {
    if (editing) return
    try {
      const raw = localStorage.getItem(draftKey(taskId))
      if (!raw) return
      const saved: FormItem[] = JSON.parse(raw)
      const same = saved.length === items.length && saved.every((s, i) => s.item_id === items[i].item_id)
      if (same && saved.some(s => s.selected || s.problem)) setRows(saved)
    } catch { /* ignore a corrupt draft */ }
  }, [])

  const update = (next: FormItem[]) => {
    setRows(next)
    if (!editing) {
      try { localStorage.setItem(draftKey(taskId), JSON.stringify(next)) } catch { /* storage blocked */ }
    }
  }
  const patch = (id: number, p: Partial<FormItem>) => update(rows.map(r => (r.item_id === id ? { ...r, ...p } : r)))

  const pass = rows.filter(r => r.selected).length
  const problems = rows.filter(r => r.problem).length
  const unchecked = rows.length - pass - problems
  const allChecked = rows.length > 0 && pass === rows.length

  const onReset = () => {
    setShowInvalid(false)
    update(rows.map(r => ({ ...r, selected: false, problem: false, status: '', reason: '' })))
    try { localStorage.removeItem(draftKey(taskId)) } catch { /* ignore */ }
  }
  const onCheckAll = () => {
    if (allChecked) return onReset()
    update(rows.map(r => ({ ...r, selected: true, problem: false, status: '', reason: '' })))
  }
  const onProblem = (r: FormItem) => {
    const problem = !r.problem
    patch(r.item_id, { selected: false, problem, status: problem ? (r.status || 'FAIL') : '' })
  }

  const isInvalid = (r: FormItem) => (!r.selected && !r.problem) || (r.problem && !r.reason.trim())

  const onSubmit = async (e: Event) => {
    e.preventDefault()
    if (busy) return
    if (rows.some(isInvalid)) {
      setShowInvalid(true)
      toast(rows.some(r => r.problem && !r.reason.trim()) && unchecked === 0 ? 'Please describe the problem.' : 'Please check every item.', 'error')
      return
    }
    setBusy(true)
    try {
      const items = rows.map(r => ({ item_id: r.item_id, problem: r.problem, status: r.status, reason: r.reason }))
      const res = editing
        ? await request(`/api/surveys/${surveyId}`, 'PUT', { items })
        : await request('/api/surveys', 'POST', { task_id: taskId, items })
      if (res.data?.success) {
        if (!editing) { try { localStorage.removeItem(draftKey(taskId)) } catch { /* ignore */ } }
        flash(editing ? 'Task Updated.' : 'Thanks.')
        location.href = '/history'
        return
      }
      toast(res.data?.error || 'Error API', 'error')
    } catch (ex: any) {
      toast(ex?.message || 'Request failed.', 'error')
    }
    setBusy(false)
  }

  return (
    <form onSubmit={onSubmit} onReset={e => { e.preventDefault(); onReset() }} noValidate>
      {!editing && (
        <button type="button" class={`btn btn-ssm ${allChecked ? 'btn-outline-secondary' : 'btn-outline-info'}`} data-testid="check-all" onClick={onCheckAll}>
          {allChecked ? 'Unchecked All' : 'Checked All'}
        </button>
      )}
      <hr />
      <div class="mb-5 pb-5">
        {rows.map((r, i) => (
          <div key={r.item_id} class={`survey-item ${showInvalid && isInvalid(r) ? 'invalid' : ''}`} data-testid="survey-item">
            <div class="custom-control custom-switch">
              <input type="checkbox" class="custom-control-input" id={`chk-${r.item_id}`} checked={r.selected} disabled={r.problem}
                onChange={e => patch(r.item_id, { selected: (e.target as HTMLInputElement).checked })} />
              <label class="custom-control-label" for={`chk-${r.item_id}`}>
                <b class="checker-text" data-testid="subject">{i + 1}. {r.subject}</b>
              </label>
              <button type="button" class={`btn btn-sm problem ml-2 ${r.problem ? 'btn-outline-danger' : 'btn-outline-secondary'}`}
                aria-label={`${r.problem ? 'Cancel' : 'Problem'} ${r.subject}`} onClick={() => onProblem(r)}>
                {r.problem ? 'Cancel' : 'Problem'}
              </button>
              {r.description && <span class="checker-text d-none d-md-inline ml-2 text-muted">{r.description}</span>}
            </div>
            {r.problem && (
              <div class="ml-4 mt-2">
                <span class="badge badge-light">STATUS :</span>
                {(['FAIL', 'WARN', 'INFO'] as const).map(s => (
                  <button key={s} type="button" class={`btn btn-sm status ml-1 ${r.status === s ? `active btn-outline-${variant[s]}` : 'btn-outline-secondary'}`}
                    aria-pressed={r.status === s} aria-label={`${s} ${r.subject}`} onClick={() => patch(r.item_id, { status: s })}>{s}</button>
                ))}
                <textarea class="form-control form-control-sm mt-2 reason" rows={2} maxLength={500} required
                  aria-label={`Reason ${r.subject}`} placeholder="Enter your problem" value={r.reason}
                  onInput={e => patch(r.item_id, { reason: (e.target as HTMLTextAreaElement).value })} />
              </div>
            )}
          </div>
        ))}
        {rows.length === 0 && <div class="text-center">No Transaction</div>}
      </div>

      <div class="survey-submit">
        <div class="container d-flex justify-content-between align-items-center">
          <div data-testid="summary">
            {!editing && (
              <>
                <span class="mr-2"><b>Pass:</b> {pass}</span>
                <span class="mr-2"><b>Fail:</b> {problems}</span>
                {unchecked > 0 && <span class="text-danger">[ {unchecked} Uncheck(s) ]</span>}
              </>
            )}
          </div>
          <div>
            <button type="submit" class="btn btn-primary" disabled={busy}>{busy ? 'Approving...' : editing ? 'Save' : 'Submit'}</button>
            {editing
              ? <a href="/history" class="btn btn-secondary ml-1">Back</a>
              : <button type="reset" class="btn btn-danger ml-1" disabled={busy}>Reset</button>}
          </div>
        </div>
      </div>
    </form>
  )
}
