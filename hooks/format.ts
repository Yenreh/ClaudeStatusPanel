// Nerd Font glyphs (Ghostty ships them; other terminals need a Nerd Font).
export const ICON = {
  model: '\uf4bc', // nf-oct-cpu
  folder: '\uf07c', // nf-fa-folder_open
  instance: '\uf007', // nf-fa-user
  context: '\u{f09d1}', // nf-md-brain
  clock: '\uf017', // nf-fa-clock_o
  calendar: '\uf073', // nf-fa-calendar
  cost: '\uf155', // nf-fa-dollar
} as const

const LABELS: Record<string, string> = {
  five_hour: ICON.clock,
  seven_day: ICON.calendar,
  seven_day_overage_included: `${ICON.calendar} fable`,
  seven_day_opus: `${ICON.calendar} opus`,
  seven_day_sonnet: `${ICON.calendar} sonnet`,
  spend_limit: `${ICON.cost} spend`,
}

const ORDER = Object.keys(LABELS)

export const labelFor = (kind: string): string => LABELS[kind] ?? kind

export const sortLimits = <T extends { kind: string }>(limits: T[]): T[] =>
  [...limits].sort((a, b) => rank(a.kind) - rank(b.kind))

const rank = (kind: string): number => {
  const i = ORDER.indexOf(kind)
  return i === -1 ? ORDER.length : i
}

export const bar = (percent: number, width: number): string => {
  const filled = Math.round((Math.min(100, Math.max(0, percent)) / 100) * width)
  return '█'.repeat(filled) + '░'.repeat(width - filled)
}

export const ACCENT = '#a78bfa'

export const colorFor = (percent: number): string =>
  percent >= 90 ? '#e879f9' : percent >= 70 ? '#c084fc' : '#8b5cf6'

export const tokens = (n: number): string =>
  n >= 1_000_000
    ? `${trim(n / 1_000_000)}M`
    : n >= 1_000
      ? `${trim(n / 1_000)}k`
      : String(n)

const trim = (n: number): string => (n >= 100 ? n.toFixed(0) : n.toFixed(1).replace(/\.0$/, ''))

// Compact countdown: "3d3h", "2h10m", "45m".
export const resetsIn = (iso: string | undefined, now: number): string => {
  if (!iso) return ''
  const ms = Date.parse(iso) - now
  if (Number.isNaN(ms)) return ''
  if (ms <= 0) return 'now'
  const mins = Math.ceil(ms / 60_000)
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `${d}d${h}h`
  if (h > 0) return `${h}h${m}m`
  return `${m}m`
}

// "claude-opus-5-5[1m]" -> "Opus 5.5"; the [1m] variant shows in the context window size.
export const modelName = (id: string): string => {
  const m = /^claude-([a-z]+)-(\d+)-(\d+)(?:-\d{8})?(?:\[.*\])?$/.exec(id)
  if (!m) return id
  const [, family = '', major, minor] = m
  return `${family.charAt(0).toUpperCase()}${family.slice(1)} ${major}.${minor}`
}

type EffortSettings = {
  effortLevel?: unknown
  modelSettings?: Record<string, { effortLevel?: unknown } | undefined>
}

// Configured effort for a model; the per-model setting beats the global one.
export const configuredEffort = (s: EffortSettings, model: string): string | undefined => {
  const level = s.modelSettings?.[model.replace(/\[.*\]$/, '')]?.effortLevel ?? s.effortLevel
  return level === undefined || level === null ? undefined : String(level)
}

// Fits a path in `width` cells by dropping whole leading folders:
// "…/Team/SomeRepository", never a folder cut in half. Only a last
// folder longer than the width is itself cut.
export const tail = (path: string, width: number): string => {
  if (path.length <= width) return path
  const parts = path.split('/')
  let kept = parts.pop() ?? ''
  if (kept.length + 2 > width) return `…${kept.slice(kept.length - Math.max(1, width - 1))}`
  while (parts.length > 0 && kept.length + parts[parts.length - 1]!.length + 3 <= width) {
    kept = `${parts.pop()}/${kept}`
  }
  return `…/${kept}`
}

// Escapes the characters that would end or break a markdown link's text.
export const mdEscape = (text: string): string => text.replace(/[\\[\]*_`]/g, c => `\\${c}`)

const LEVELS = ['low', 'medium', 'high', 'xhigh', 'max']

// The level /effort set, from what it printed ("Set effort level to max (this session
// only): ...") or its argument; null when it went back to the default (settings
// decide again); undefined when neither says (the bare menu).
export const effortFromCommand = (text: string | undefined, args: string): string | null | undefined => {
  const said = /effort level to (\w+)/i.exec(text ?? '')?.[1]?.toLowerCase()
  const level = said ?? args.trim().toLowerCase()
  if (LEVELS.includes(level)) return level
  if (level === 'auto' || level === 'default') return null
  return undefined
}

// The last level /effort printed into a transcript tail after `since` (ms); undefined
// when none did. Lines are JSONL records; a partial first line is skipped.
export const effortFromTranscript = (tail: string, since: number): string | null | undefined => {
  let found: string | null | undefined
  for (const line of tail.split('\n')) {
    if (!line.includes('local-command-stdout>') || !line.includes('effort level to')) continue
    const at = Date.parse(/"timestamp":"([^"]+)"/.exec(line)?.[1] ?? '')
    if (!(at >= since)) continue
    const said = effortFromCommand(/local-command-stdout>([^<]*)/.exec(line)?.[1], '')
    if (said !== undefined) found = said
  }
  return found
}

// The launcher's name from the config dir: unset is plain "claude",
// "~/.claude-work" is "claude-work".
export const instanceName = (configDir: string | undefined): string =>
  configDir ? (configDir.replace(/\/+$/, '').split('/').pop() ?? '').replace(/^\./, '') || 'claude' : 'claude'

export const shortPath = (path: string, home: string | undefined): string =>
  home && (path === home || path.startsWith(`${home}/`)) ? `~${path.slice(home.length)}` : path
