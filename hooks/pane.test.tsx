import { expect, test } from 'claude-code/testing'
import type { TestBody } from 'claude-code/testing'

import { ICON } from './format'

const USAGE = {
  startedAt: 0,
  context: { tokens: 90_000, window: 200_000, percent: 45 },
  rateLimits: [
    { kind: 'seven_day_overage_included', percentUsed: 12, resetsAt: '2026-10-06T00:00:00Z' },
    { kind: 'five_hour', percentUsed: 30, resetsAt: '2026-10-03T12:00:00Z' },
    { kind: 'seven_day', percentUsed: 60, resetsAt: '2026-10-06T00:00:00Z' },
  ],
  cost: { usd: 1.5 },
}

type Args = Parameters<TestBody>

const mount = async (
  $: Args[0],
  on: Args[1],
  surface: 'terminal' | 'desktop',
  placement: 'dock' | 'inline',
  bodyColumns: number,
  cwd = '/home/u/TMP/Claude',
) => {
  on('session.usage', () => ({ value: USAGE }))
  on('clock.now', () => ({ value: Date.parse('2026-10-03T10:00:00Z') }))
  on('session.model', () => ({ value: 'claude-opus-5-5' }))
  on('session.cwd', () => ({ value: cwd }))
  on('env.get', (_$, e) => ({ value: e.name === 'HOME' ? '/home/u' : undefined }))
  on('settings.read', () => ({ value: { effortLevel: 'xhigh' } }))
  return $.ui.mount({
    plugin: 'usage-pane',
    surface,
    component: 'Pane',
    props: {
      title: 'Usage',
      isFocused: false,
      bodyColumns,
      placement,
      scroll: { offset: 0, bodyRows: 40 },
      view: {},
    },
    requestId: 'usage',
  })
}

for (const surface of ['terminal', 'desktop'] as const) {
  test(`docked pane draws context and all limits on ${surface}`, async ($, on) => {
    const ui = await mount($, on, surface, 'dock', 22)
    expect(await ui.find({ text: '45%' })).toBeDefined()
    expect(await ui.find({ text: '90k/200k' })).toBeDefined()
    expect(await ui.find({ text: '30%' })).toBeDefined()
    expect(await ui.find({ text: '60%' })).toBeDefined()
    expect(await ui.find({ text: `${ICON.calendar} fable ` })).toBeDefined()
    expect(await ui.find({ text: '2h0m' })).toBeDefined()
    expect(await ui.find({ text: '1.50' })).toBeDefined()
    expect(await ui.find({ text: `${ICON.model} Opus 5.5` })).toBeDefined()
    expect(await ui.find({ text: 'claude' })).toBeDefined()
    expect(await ui.find({ text: / xhigh/ })).toBeDefined()
    expect((await ui.find({ key: 'open-folder' }))?.text).toBe('[~/TMP/Claude](file:///home/u/TMP/Claude)')
    expect(await ui.find({ text: '█'.repeat(9) + '░'.repeat(11) })).toBeDefined()
  })

  test(`long workspace path keeps its icon on ${surface}`, async ($, on) => {
    const ui = await mount($, on, surface, 'dock', 25, '/home/u/GIT/Org/Team/SomeRepository')
    expect(await ui.find({ text: `${ICON.folder} ` })).toBeDefined()
    expect((await ui.find({ key: 'open-folder' }))?.text).toBe(
      '[…/Team/SomeRepository](file:///home/u/GIT/Org/Team/SomeRepository)',
    )
  })

  test(`folder icon opens the workspace on ${surface}`, async ($, on) => {
    const runs: string[][] = []
    on('process.run', (_$, e) => {
      runs.push([...e.argv])
      return { value: { exitCode: 0, stdout: '', stderr: '', isStdoutTruncated: false, isStderrTruncated: false } }
    })
    const ui = await mount($, on, surface, 'dock', 22)
    await ui.press({ key: 'open-folder', link: { href: 'file:///home/u/TMP/Claude' } })
    expect(runs).toEqual([['xdg-open', '/home/u/TMP/Claude']])
  })

  test(`inline pane is one compact line on ${surface}`, async ($, on) => {
    const ui = await mount($, on, surface, 'inline', 60)
    expect(await ui.find({ text: `${ICON.model} Opus 5.5` })).toBeDefined()
    expect(await ui.find({ text: '45%' })).toBeDefined()
    expect(await ui.find({ text: '30%' })).toBeDefined()
    expect(await ui.find({ text: / 2h0m/ })).toBeDefined()
    expect(await ui.find({ text: '1.50' })).toBeDefined()
    expect(await ui.find({ text: '~/TMP/Claude' })).toBeUndefined()
  })
}
