import { describe, expect, test } from 'bun:test'
import { normalizeText, parseSurveyItems, parseTaskInput, worstStatus } from './logic'

describe('normalizeText', () => {
  test('trims and collapses whitespace', () => {
    expect(normalizeText('  a   b \n c ')).toBe('a b c')
    expect(normalizeText(undefined)).toBe('')
  })
})

describe('parseTaskInput', () => {
  const ok = { title: ' Daily   close ', items: [{ subject: 'Check  disk', description: ' d ' }, { item_id: 7, subject: 'Check cpu' }] }
  test('normalises a valid payload', () => {
    const r: any = parseTaskInput(ok)
    expect(r.value.title).toBe('Daily close')
    expect(r.value.items.map((i: any) => i.subject)).toEqual(['Check disk', 'Check cpu'])
    expect(r.value.items[0].item_id).toBeNull()
    expect(r.value.items[1].item_id).toBe(7)
  })
  test('rejects blank title / blank subject / empty list', () => {
    expect(parseTaskInput({ ...ok, title: '   ' })).toHaveProperty('error')
    expect(parseTaskInput({ title: 'x', items: [{ subject: ' ' }] })).toHaveProperty('error')
    expect(parseTaskInput({ title: 'x', items: [] })).toHaveProperty('error')
  })
  test('rejects duplicate subjects case-insensitively', () => {
    expect(parseTaskInput({ title: 'x', items: [{ subject: 'A' }, { subject: ' a ' }] })).toEqual({ error: 'list is same.' })
  })
  test('rejects over-long fields', () => {
    expect(parseTaskInput({ title: 'x'.repeat(51), items: [{ subject: 'a' }] })).toHaveProperty('error')
    expect(parseTaskInput({ title: 'x', items: [{ subject: 'a'.repeat(51) }] })).toHaveProperty('error')
    expect(parseTaskInput({ title: 'x', items: [{ subject: 'a', description: 'd'.repeat(501) }] })).toHaveProperty('error')
  })
})

describe('parseSurveyItems', () => {
  test('non-problem items become PASS with no remark', () => {
    const r: any = parseSurveyItems({ items: [{ item_id: 1, problem: false, status: 'FAIL', reason: 'ignored' }] })
    expect(r.value).toEqual([{ item_id: 1, status: 'PASS', remark: '' }])
  })
  test('problem items keep status (default FAIL) and need a reason', () => {
    const r: any = parseSurveyItems({ items: [{ item_id: 1, problem: true, status: 'WARN', reason: ' x ' }, { item_id: 2, problem: true, reason: 'y' }] })
    expect(r.value).toEqual([{ item_id: 1, status: 'WARN', remark: 'x' }, { item_id: 2, status: 'FAIL', remark: 'y' }])
    expect(parseSurveyItems({ items: [{ item_id: 1, problem: true, reason: '  ' }] })).toHaveProperty('error')
  })
  test('rejects empty / duplicate / invalid ids', () => {
    expect(parseSurveyItems({ items: [] })).toHaveProperty('error')
    expect(parseSurveyItems({ items: [{ item_id: 1 }, { item_id: 1 }] })).toHaveProperty('error')
    expect(parseSurveyItems({ items: [{ item_id: 'x' }] })).toHaveProperty('error')
  })
})

describe('worstStatus', () => {
  test('FAIL > WARN > INFO > PASS', () => {
    expect(worstStatus({ fail: 1, warn: 1, info: 1, pass: 1 })).toBe('FAIL')
    expect(worstStatus({ fail: 0, warn: 2, info: 1, pass: 1 })).toBe('WARN')
    expect(worstStatus({ fail: 0, warn: 0, info: 1, pass: 1 })).toBe('INFO')
    expect(worstStatus({ fail: 0, warn: 0, info: 0, pass: 3 })).toBe('PASS')
    expect(worstStatus({ fail: 0, warn: 0, info: 0, pass: 0 })).toBeNull()
  })
})
