import { atom, read, update } from 'claude-code'
import type { Register } from 'claude-code'

import type { Effort } from '../types'
import { ACCENT, bar, colorFor, configuredEffort, labelFor, modelName, shortPath, pad, resetsIn, sortLimits, tokens } from './format'

const PANE = 'usage'
const TITLE = 'Usage'
const tick = atom({ plugin: 'usage-pane', key: 'tick' } as const, 0)
// No getter exposes the session's effort; record what the main loop last sent.
const effort = atom({ plugin: 'usage-pane', key: 'effort' } as const, null as Effort)

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    await $.command.register({
      name: 'usage-pane',
      description: 'Show context and usage limits in a side pane',
    })
    void $.ui.open({ id: PANE, title: TITLE })
    // Keep "resets in" countdowns fresh between turns.
    $.clock.every(60_000, () => void update($, tick, n => n + 1))

    return next(e)
  })

  on('command.run', { command: 'usage-pane' }, async $ => {
    await $.ui.open({ id: PANE, title: TITLE })

    return { text: 'Usage pane opened.' }
  })

  on('turn.step', async function* ($, e, next) {
    if (!e.agentId) {
      const value = e.effort === undefined ? 'none' : String(e.effort)
      await update($, effort, () => value)
    }

    return yield* next(e)
  })

  on('session.measure', async ($, e, next) => {
    await update($, tick, n => n + 1)

    return next(e)
  })

  on('ui.render', { component: 'Pane', requestId: PANE }, async ($, e) => {
    const { Box, Text } = $.ui.resolve(e)
    await read($, tick)
    const cols = e.props.bodyColumns
    const width = Math.max(10, Math.min(30, cols - 6))
    const [usage, now, model, sent, cwd, home] = await Promise.all([
      $.session.usage({ breakdown: 'summary', columns: cols }),
      $.clock.now(),
      $.session.model(),
      read($, effort),
      $.session.cwd(),
      $.env.get('HOME'),
    ])
    // Before the first request, fall back to the effort the settings configure.
    const level = sent ?? configuredEffort(await $.settings.read(), model)
    const { context, rateLimits, cost } = usage
    const categories = (context.breakdown?.categories ?? []).filter(
      c => c.kind === 'used' && c.tokens > 0,
    )
    const limits = sortLimits(rateLimits)

    return (
      <Box flexDirection="column">
        <Text bold color={ACCENT}>Model</Text>
        <Text>{modelName(model)}</Text>
        <Text dimColor>{`  effort ${level ?? 'default'}`}</Text>
        <Text> </Text>
        <Text bold color={ACCENT}>Workspace</Text>
        <Text wrap="truncate-start">{shortPath(cwd, home)}</Text>
        <Text> </Text>
        <Text bold color={ACCENT}>Context</Text>
        {context.percent === undefined ? (
          <Text dimColor>No response yet ({tokens(context.window)} window)</Text>
        ) : (
          <Text>
            <Text color={colorFor(context.percent)}>{bar(context.percent, width)}</Text>
            {` ${context.percent}%  ${tokens(context.tokens ?? 0)} / ${tokens(context.window)}`}
          </Text>
        )}
        {categories.map(c => (
          <Text dimColor>
            {`  ${pad(c.name, 18)} ${tokens(c.tokens)}`}
          </Text>
        ))}
        <Text> </Text>
        <Text bold color={ACCENT}>Limits</Text>
        {limits.length === 0 && <Text dimColor>No reading yet (subscription only)</Text>}
        {limits.map(l => (
          <Box flexDirection="column">
            <Text>{labelFor(l.kind)}</Text>
            <Text>
              <Text color={colorFor(l.percentUsed)}>{bar(l.percentUsed, width)}</Text>
              {` ${l.percentUsed}%`}
            </Text>
            <Text dimColor>{`  ${resetsIn(l.resetsAt, now)}`}</Text>
          </Box>
        ))}
        {cost && (
          <>
            <Text> </Text>
            <Text>
              <Text bold color={ACCENT}>Cost </Text>
              {`$${cost.usd.toFixed(2)}`}
            </Text>
          </>
        )}
      </Box>
    )
  })
}
