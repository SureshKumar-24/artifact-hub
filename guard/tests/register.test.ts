import type { On } from 'claude-code'
import { describe, expect, mock, test } from 'claude-code/testing'

import { basename, findSaved, fold, plain, titleIn } from '../hooks/register'

const HOME = '/home/suresh'
const PAGES = `${HOME}/.claude/artifact-hub/pages.json`
const URL = 'https://claude.ai/artifact/AbCdEfGhIjKlMnOpQrStUv'
const UPDATE = 'Update the existing page'

const saved = (over: Record<string, unknown> = {}) => [
  { url: URL, title: 'Pricing Page', folder: 'shop', first: '2026-10-01T10:00:00.000Z', last: '2026-10-10T09:00:00.000Z', ...over },
]

/**
 * A machine beneath the mod: HOME set, pages.json and the page's own file answered
 * from `files` (a missing path rejects, as the engine's read does), the Artifact tool
 * answering with whatever call reached it (kept in `forwarded`), and the
 * AskUserQuestion dialog answering `answer` (or throwing when `answer` is an Error).
 */
function machine(on: On, files: Record<string, string>, answer: string | Error | null) {
  const forwarded: Array<Record<string, unknown>> = []
  const asked: string[] = []
  mock.env(on, { HOME })
  on('fs.read', ($, e) => {
    const text = files[e.path]
    if (text === undefined) throw new Error(`ENOENT: ${e.path}`)
    return { value: text }
  })
  on('tool.call', { tool: 'Artifact' }, ($, e) => {
    forwarded.push({ ...e })
    return { result: { text: 'published' } }
  })
  on('tool.call', { tool: 'AskUserQuestion' }, ($, e) => {
    const q = e.questions[0]
    asked.push(q ? q.question : '')
    if (answer instanceof Error) throw answer
    const key = q ? q.question : ''
    return { result: { questions: e.questions, answers: answer === null ? {} : { [key]: answer } } }
  })
  return { forwarded, asked }
}

describe('register', () => {
  test('a new publish with a saved title asks, and "Update" carries the saved url', async ($, on) => {
    const list = saved({ title: 'Pricing & Plans' })
    const m = machine(on, { [PAGES]: JSON.stringify(list), '/w/pricing.html': '<html><head><title>Pricing &amp;  Plans</title></head>' }, UPDATE)

    await $.tool.call({ tool: 'Artifact', file_path: '/w/pricing.html' })

    expect(m.asked).toEqual(['A page titled "Pricing & Plans" already exists in shop, last published 2026-10-10. Update it instead of publishing a new one?'])
    expect(m.forwarded).toHaveLength(1)
    expect(m.forwarded[0]?.url).toBe(URL)
    expect(m.forwarded[0]?.file_path).toBe('/w/pricing.html')
  })

  test('"Publish a new page anyway" forwards the call unchanged', async ($, on) => {
    const m = machine(on, { [PAGES]: JSON.stringify(saved()) }, 'Publish a new page anyway')

    await $.tool.call({ tool: 'Artifact', title: 'pricing page', file_path: '/w/x.html' })

    expect(m.asked).toHaveLength(1)
    expect(m.forwarded[0]?.url).toBeUndefined()
  })

  test('without pages.json nothing is asked and the call passes', async ($, on) => {
    const m = machine(on, {}, UPDATE)

    await $.tool.call({ tool: 'Artifact', title: 'Pricing Page', file_path: '/w/x.html' })

    expect(m.asked).toEqual([])
    expect(m.forwarded[0]?.url).toBeUndefined()
  })

  test('deleted and replaced entries do not count; the most recent of several wins', async ($, on) => {
    const list = [
      ...saved({ deleted: '2026-10-11T00:00:00.000Z' }),
      ...saved({ url: 'https://claude.ai/artifact/OLDOLDOLDOLDOLDOLDOLDO', replacedBy: URL }),
    ]
    const m = machine(on, { [PAGES]: JSON.stringify(list) }, UPDATE)
    await $.tool.call({ tool: 'Artifact', title: 'Pricing Page', file_path: '/w/x.html' })
    expect(m.asked).toEqual([])
    expect(m.forwarded[0]?.url).toBeUndefined()

    const two = [
      ...saved({ url: 'https://claude.ai/artifact/FIRSTFIRSTFIRSTFIRSTFI', last: '2026-10-02T00:00:00.000Z' }),
      ...saved({ last: '2026-10-12T00:00:00.000Z' }),
    ]
    expect(findSaved(two, 'pricing page')?.url).toBe(URL)
  })

  test('a publish with a url, a read, a list and an asset upload are never touched', async ($, on) => {
    const m = machine(on, { [PAGES]: JSON.stringify(saved()) }, UPDATE)

    await $.tool.call({ tool: 'Artifact', title: 'Pricing Page', file_path: '/w/x.html', url: URL })
    await $.tool.call({ tool: 'Artifact', action: 'read', url: URL })
    await $.tool.call({ tool: 'Artifact', action: 'list', limit: 5 })
    await $.tool.call({ tool: 'Artifact', asset: true, file_path: '/w/pricing-page.png', url: URL })

    expect(m.asked).toEqual([])
    expect(m.forwarded).toHaveLength(4)
  })

  test('when nobody can be asked the call passes as it was', async ($, on) => {
    const m = machine(on, { [PAGES]: JSON.stringify(saved()) }, new Error('no one to ask'))

    await $.tool.call({ tool: 'Artifact', title: 'Pricing Page', file_path: '/w/x.html' })

    expect(m.forwarded).toHaveLength(1)
    expect(m.forwarded[0]?.url).toBeUndefined()
  })

  test('a page made from an artifact type, and an in-session redeploy by path or by edits, are never asked about', async ($, on) => {
    const m = machine(on, { [PAGES]: JSON.stringify(saved()) }, UPDATE)

    await $.tool.call({ tool: 'Artifact', title: 'Pricing Page', type_url: 'https://claude.ai/artifact/TYPETYPETYPETYPETYPETY' })
    await $.tool.call({ tool: 'Artifact', file_path: '/w/x.html', title: 'Pricing Page', edits: [{ old_str: 'a', new_str: 'b' }] })
    expect(m.asked).toEqual([])
    expect(m.forwarded).toHaveLength(2)
    expect(m.forwarded[0]?.url).toBeUndefined()

    // the first publish of a file asks once; publishing that file again is a redeploy
    await $.tool.call({ tool: 'Artifact', file_path: '/w/y.html', title: 'Pricing Page' })
    await $.tool.call({ tool: 'Artifact', file_path: '/w/y.html', title: 'Pricing Page' })
    expect(m.asked).toHaveLength(1)
    expect(m.forwarded).toHaveLength(4)
    expect(m.forwarded[2]?.url).toBe(URL)
    expect(m.forwarded[3]?.url).toBeUndefined()
  })

  test("the file's own <title> names the page before the call's title, and the file name comes last", async ($, on) => {
    const list = [...saved(), ...saved({ url: 'https://claude.ai/artifact/NOTESNOTESNOTESNOTESNO', title: 'Release Notes' })]
    const m = machine(on, { [PAGES]: JSON.stringify(list), '/w/a.html': '<title>Release Notes</title>', '/w/pricing page.html': '<p>no title</p>' }, UPDATE)

    await $.tool.call({ tool: 'Artifact', file_path: '/w/a.html', title: 'Pricing Page' })
    await $.tool.call({ tool: 'Artifact', file_path: '/w/pricing page.html' })

    expect(m.asked[0]).toMatch(/"Release Notes" already exists/)
    expect(m.asked[1]).toMatch(/"pricing page" already exists/)
    expect(m.forwarded[0]?.url).toBe('https://claude.ai/artifact/NOTESNOTESNOTESNOTESNO')
    expect(m.forwarded[1]?.url).toBe(URL)
    expect(basename('C:\\Users\\me\\Q4 plan.html')).toBe('Q4 plan')
  })

  test('titles are compared as plain text, and read from the file when the call has none', async () => {
    expect(plain('Pricing &amp;  Plans')).toBe('Pricing & Plans')
    expect(fold('  PRICING page ')).toBe('pricing page')
    expect(titleIn('<html><head><title>  Q4 &#8212; Plan </title></head>')).toBe('Q4 — Plan')
    expect(titleIn('<p>no title</p>')).toBe('')
    expect(findSaved(saved(), 'PRICING PAGE')?.url).toBe(URL)
    expect(findSaved('not a list', 'x')).toBeUndefined()
  })
})
