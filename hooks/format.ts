const LABELS: Record<string, string> = {
  five_hour: 'Session (5h)',
  seven_day: 'Weekly',
  seven_day_overage_included: 'Fable (weekly)',
  seven_day_opus: 'Opus (weekly)',
  seven_day_sonnet: 'Sonnet (weekly)',
  spend_limit: 'Spend limit',
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

export const resetsIn = (iso: string | undefined, now: number): string => {
  if (!iso) return ''
  const ms = Date.parse(iso) - now
  if (Number.isNaN(ms)) return ''
  if (ms <= 0) return 'resets now'
  const mins = Math.ceil(ms / 60_000)
  const d = Math.floor(mins / 1440)
  const h = Math.floor((mins % 1440) / 60)
  const m = mins % 60
  if (d > 0) return `resets in ${d}d ${h}h`
  if (h > 0) return `resets in ${h}h ${m}m`
  return `resets in ${m}m`
}

export const pad = (s: string, n: number): string => (s.length >= n ? s : s + ' '.repeat(n - s.length))

// "claude-opus-5-5[1m]" -> "Opus 5.5 [1m]"; unknown ids pass through.
export const modelName = (id: string): string => {
  const m = /^claude-([a-z]+)-(\d+)-(\d+)(?:-\d{8})?(\[.*\])?$/.exec(id)
  if (!m) return id
  const [, family = '', major, minor, suffix] = m
  const name = `${family.charAt(0).toUpperCase()}${family.slice(1)} ${major}.${minor}`
  return suffix ? `${name} ${suffix}` : name
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

export const shortPath = (path: string, home: string | undefined): string =>
  home && (path === home || path.startsWith(`${home}/`)) ? `~${path.slice(home.length)}` : path
