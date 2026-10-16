// artifact-hub-guard: a mod that stops duplicate pages before they exist.
//
// The main plugin files a page after it is published. This mod acts one step earlier: when
// Claude calls the Artifact tool to publish without a `url` (a new page) and the saved list
// in ~/.claude/artifact-hub/pages.json already has a page with the same title, it asks the
// user whether to update that page instead. "Update" rewrites the call with the saved url, so
// the page is republished in place; "Publish a new page anyway" lets the call through as it
// was. Everything else passes untouched, and any failure of the guard itself passes the call
// through too: it can only ever ask, never block.
import type { Register } from 'claude-code'

/** One entry of pages.json, as the main plugin's hook writes it. */
type Saved = {
  url?: string
  title?: string | null
  folder?: string | null
  first?: string
  last?: string
  deleted?: string
  replacedBy?: string
  type?: string
}

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }

/** Plain text from a title's HTML: entities decoded, whitespace collapsed (as the main hook does). */
export function plain(s: unknown): string {
  return String(s ?? '')
    .replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e: string) => {
      if (e[0] === '#') {
        const n = e[1]?.toLowerCase() === 'x' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)
        return Number.isFinite(n) && n > 0 && n < 0x110000 ? String.fromCodePoint(n) : m
      }
      return ENTITIES[e.toLowerCase()] ?? m
    })
    .replace(/\s+/g, ' ')
    .trim()
}

/** The key two titles are compared by: plain text, lower case. */
export const fold = (s: unknown): string => plain(s).toLowerCase()

/** The <title> of a page's first 8 KB, or '' when it has none. */
export function titleIn(html: string): string {
  const m = html.slice(0, 8192).match(/<title[^>]*>([^<]{1,200})<\/title>/i)
  return m ? plain(m[1]) : ''
}

/** The saved page with this title that is still current: not deleted, not replaced; the most recent when several. */
export function findSaved(list: unknown, title: string): Saved | undefined {
  if (!Array.isArray(list) || !title) return undefined
  const want = fold(title)
  let hit: Saved | undefined
  for (const x of list as Saved[]) {
    if (!x || typeof x !== 'object' || !x.url || x.deleted || x.replacedBy) continue
    if (fold(x.title) !== want) continue
    if (!hit || String(x.last ?? '') > String(hit.last ?? '')) hit = x
  }
  return hit
}

/** The day of an ISO stamp, for the question; the stamp itself when it is not one. */
const day = (s: string | undefined): string => (s && /^\d{4}-\d{2}-\d{2}/.test(s) ? s.slice(0, 10) : s || 'before')

export const register: Register = (on) => {
  on('tool.call', { tool: 'Artifact' }, async ($, e, next) => {
    // Only a publish of a new page: no url, not an asset upload, with something to name it by.
    const isPublish = e.action === undefined || e.action === 'publish'
    if (!isPublish || e.url || e.asset || (!e.file_path && !e.title)) return next(e)

    const home = (await $.env.get('HOME')) || (await $.env.get('USERPROFILE'))
    if (!home) return next(e)

    let list: unknown
    try {
      list = JSON.parse(await $.fs.read(`${home}/.claude/artifact-hub/pages.json`))
    } catch {
      return next(e) // no saved list yet, or unreadable: nothing to compare with
    }

    let title = typeof e.title === 'string' ? plain(e.title) : ''
    if (!title && e.file_path) {
      try {
        title = titleIn(await $.fs.read(e.file_path))
      } catch {
        title = ''
      }
      if (!title) title = plain(e.file_path.replace(/\\/g, '/').split('/').pop()?.replace(/\.[^.]+$/, ''))
    }

    const saved = findSaved(list, title)
    if (!saved || !saved.url) return next(e)

    const where = saved.folder ? ` in ${saved.folder}` : ''
    const question = `A page titled "${title}" already exists${where}, last published ${day(saved.last)}. Update it instead of publishing a new one?`
    const UPDATE = 'Update the existing page'
    let answer = ''
    try {
      answer = await $.ui.ask(question, { header: 'Artifact Hub', options: [UPDATE, 'Publish a new page anyway'] })
    } catch {
      return next(e) // nobody to ask (a -p run), or the dialog was dismissed: publish as asked
    }
    return answer === UPDATE ? next({ ...e, url: saved.url }) : next(e)
  }).catch(($, e, next) => (next.called ? next(e) : next(e))) // the guard failed: the call goes through as it was
}
