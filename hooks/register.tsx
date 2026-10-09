import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Effort } from '../types'
import { ACCENT, ICON, bar, mdEscape, tail, colorFor, configuredEffort, labelFor, modelName, shortPath, resetsIn, sortLimits, tokens } from './format'

const PANE = 'usage'
const TITLE = 'Usage'
// Requested size: docked, a little over the dock's minimum (about 25 body
// columns); inline, a few rows above the prompt.
const DOCK_COLUMNS = 28
const INLINE_ROWS = 2
const OPEN = { id: PANE, title: TITLE, columns: DOCK_COLUMNS, rows: INLINE_ROWS }
const tick = atom({ plugin: 'usage-pane', key: 'tick' } as const, 0)
// No getter exposes the session's effort; record what the main loop last sent.
const effort = atom({ plugin: 'usage-pane', key: 'effort' } as const, null as Effort)

export const register: Register = on => {
  let lastEffort: Effort = null

  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'usage-pane',
      description: 'Show context and usage limits in a side pane',
    })
    void $.ui.open(OPEN)
    // Keep reset countdowns fresh between turns.
    $.clock.every(60_000, () => void update($, tick, n => n + 1))

    return next(e)
  })

  on('command.run', { command: 'usage-pane' }, async $ => {
    await $.ui.open(OPEN)

    return { text: 'Usage pane opened.' }
  })

  on('turn.step', async function* ($, e, next) {
    if (!e.agentId) {
      const value = e.effort === undefined ? 'none' : String(e.effort)
      // Write only on change: every write redraws the pane.
      if (value !== lastEffort) {
        lastEffort = value
        await update($, effort, () => value)
      }
    }

    return yield* next(e)
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
    const [usage, now, model, sent] = await Promise.all([
      $.session.usage(),
      $.clock.now(),
      $.session.model(),
      read($, effort),
    ])
    // Before the first request, fall back to the effort the settings configure.
    const level = sent ?? configuredEffort(await $.settings.read(), model) ?? 'default'
    const { context, rateLimits, cost } = usage
    const limits = sortLimits(rateLimits)
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

    const [cwd, home] = await Promise.all([$.session.cwd(), $.env.get('HOME')])
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
