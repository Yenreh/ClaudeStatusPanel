// Nerd Font glyphs (Ghostty ships them; other terminals need a Nerd Font).
export const ICON = {
  model: '\uf4bc', // nf-oct-cpu
  folder: '\uf07c', // nf-fa-folder_open
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
// "…/Buddys/MagentoRepositories", never a folder cut in half. Only a last
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

export const shortPath = (path: string, home: string | undefined): string =>
  home && (path === home || path.startsWith(`${home}/`)) ? `~${path.slice(home.length)}` : path
