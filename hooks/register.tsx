import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register } from 'claude-code'

import type { Effort } from '../types'
import { ACCENT, ICON, bar, mdEscape, tail, colorFor, configuredEffort, effortFromCommand, effortFromTranscript, labelFor, modelName, shortPath, resetsIn, sortLimits, tokens } from './format'

const PANE = 'usage'
const TITLE = 'Usage'
// Requested size: docked, a little over the dock's minimum (about 25 body
// columns); inline, a few rows above the prompt.
const DOCK_COLUMNS = 28
const INLINE_ROWS = 2
const OPEN = { id: PANE, title: TITLE, columns: DOCK_COLUMNS, rows: INLINE_ROWS }
const tick = atom({ plugin: 'usage-pane', key: 'tick' } as const, 0)
// The level the person last picked with /effort in this session; null, settings decide.
const effort = atom({ plugin: 'usage-pane', key: 'effort' } as const, null as Effort)

// Module memory, not state: HOME never changes; limits decide whether the minute tick is needed.
let home: string | undefined
let hasLimits = false
// Bumped by each /effort, so an older menu watch stops.
let effortRun = 0

// Reads the transcript's last 32 KB every 2 s for up to a minute after the menu
// opened, until a pick made after that moment shows up.
async function watchMenu($: EngineInterface, run: number) {
  const since = await $.clock.now()
  const [id, dir] = await Promise.all([$.session.id(), $.env.get('CLAUDE_CONFIG_DIR')])
  home ??= await $.env.get('HOME')
  const config = dir ?? `${home}/.claude`
  for (let i = 0; i < 30 && run === effortRun; i++) {
    await $.clock.sleep(2000)
    const { stdout } = await $.process
      .run(['sh', '-c', 'tail -c 32768 "$1"/projects/*/"$2".jsonl 2>/dev/null', 'sh', config, id])
      .catch(() => ({ stdout: '' }))
    const picked = effortFromTranscript(stdout, since)
    if (picked !== undefined && run === effortRun) {
      await update($, effort, () => picked)
      return
    }
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'usage-pane',
      description: 'Show context and usage limits in a side pane',
    })
    void $.ui.open(OPEN)
    // Keep reset countdowns fresh between turns; nothing to refresh without limits.
    $.clock.every(60_000, () => {
      if (hasLimits) void update($, tick, n => n + 1)
    })

    return next(e)
  })

  on('command.run', { command: 'usage-pane' }, async $ => {
    await $.ui.open(OPEN)

    return { text: 'Usage pane opened.' }
  })

  // /effort is the only way the level changes mid-session, and max is never saved
  // to settings. Interactively the command's output never comes back to a hook:
  // a typed level is read from the argument; the bare menu's pick only lands in
  // the transcript, so its tail is polled briefly. Runs only on /effort.
  on('command.run', { command: 'effort' }, async ($, e, next) => {
    const typed = effortFromCommand(undefined, e.args)
    const run = ++effortRun
    if (typed !== undefined) {
      await update($, effort, () => typed)
    } else {
      void watchMenu($, run)
    }

    return next(e)
  })

  // Fires only when context, limits or cost moved.
  on('session.measure', async ($, e, next) => {
    await update($, tick, n => n + 1)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Markdown, Text } = $.ui.resolve(e)
    await read($, tick)
    // Plain usage() is free; a breakdown would re-estimate the context on every draw.
    // Effort: the session's /effort pick, else settings. Not turn.step (it routes every
    // streamed chunk through this plugin); classic.Stop never fires on the work account.
    const [usage, now, model, picked] = await Promise.all([
      $.session.usage(),
      $.clock.now(),
      $.session.model(),
      read($, effort),
    ])
    const level = picked ?? configuredEffort(await $.settings.read(), model) ?? 'default'
    const { context, rateLimits, cost } = usage
    const limits = sortLimits(rateLimits)
    hasLimits = limits.length > 0
    const ctx = context.percent

    if (e.props.placement === 'inline') {
      const sep = <Text dimColor> · </Text>
      return (
        <Text>
          <Text color={ACCENT}>{`${ICON.model} ${modelName(model)}`}</Text>
          <Text dimColor>{` ${level}`}</Text>
          {sep}
          <Text color={ACCENT}>{`${ICON.context} `}</Text>
          {ctx === undefined ? (
            <Text dimColor>-</Text>
          ) : (
            <Text color={colorFor(ctx)}>{`${ctx}%`}</Text>
          )}
          {limits.map(l => (
            <Text>
              {sep}
              <Text color={ACCENT}>{`${labelFor(l.kind)} `}</Text>
              <Text color={colorFor(l.percentUsed)}>{`${l.percentUsed}%`}</Text>
              <Text dimColor>{l.resetsAt ? ` ${resetsIn(l.resetsAt, now)}` : ''}</Text>
            </Text>
          ))}
          {cost && (
            <Text>
              {sep}
              <Text color={ACCENT}>{`${ICON.cost} `}</Text>
              {cost.usd.toFixed(2)}
            </Text>
          )}
        </Text>
      )
    }

    home ??= await $.env.get('HOME')
    const cwd = await $.session.cwd()
    const folderUrl = `file://${encodeURI(cwd)}`
    // One column of margin each side; bars span the rest.
    const width = Math.max(4, e.props.bodyColumns - 2)
    const row = (icon: string, value: string, color: string | undefined, detail: string) => (
      <Box justifyContent="space-between">
        <Text wrap="truncate-end">
          <Text color={ACCENT}>{`${icon} `}</Text>
          <Text color={color}>{value}</Text>
        </Text>
        <Text dimColor>{detail}</Text>
      </Box>
    )

    return (
      <Box flexDirection="column" paddingX={1} gap={1}>
        <Box flexDirection="column">
          <Text wrap="truncate-end">
            <Text bold color={ACCENT}>{`${ICON.model} ${modelName(model)}`}</Text>
            <Text dimColor>{` · ${level}`}</Text>
          </Text>
          {/* The path is a file:// link (a Button would invert under the pointer);
              Markdown cannot truncate, so the path is cut to fit beforehand. */}
          <Box>
            <Box flexShrink={0}>
              <Text color={ACCENT}>{`${ICON.folder} `}</Text>
            </Box>
            <Markdown
              key="open-folder"
              dimColor
              text={`[${mdEscape(tail(shortPath(cwd, home), e.props.bodyColumns - 4))}](${folderUrl})`}
              onLinkPress={() => void $.process.run(['gio', 'open', cwd]).catch(() => undefined)}
            />
          </Box>
        </Box>
        {ctx === undefined ? (
          row(ICON.context, '-', undefined, tokens(context.window))
        ) : (
          <Box flexDirection="column">
            {row(ICON.context, `${ctx}%`, undefined, `${tokens(context.tokens ?? 0)}/${tokens(context.window)}`)}
            <Text color={colorFor(ctx)}>{bar(ctx, width)}</Text>
          </Box>
        )}
        {limits.map(l => (
          <Box flexDirection="column">
            {row(labelFor(l.kind), `${l.percentUsed}%`, undefined, resetsIn(l.resetsAt, now))}
            <Text color={colorFor(l.percentUsed)}>{bar(l.percentUsed, width)}</Text>
          </Box>
        ))}
        {cost && row(ICON.cost, cost.usd.toFixed(2), undefined, '')}
      </Box>
    )
  })
}
