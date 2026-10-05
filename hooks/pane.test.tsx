import { expect, test } from 'claude-code/testing'

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

for (const surface of ['terminal', 'desktop'] as const) {
  test(`draws context and all limits on ${surface}`, async ($, on) => {
    on('session.usage', () => ({ value: USAGE }))
    on('clock.now', () => ({ value: Date.parse('2026-10-03T10:00:00Z') }))
    on('session.model', () => ({ value: 'claude-opus-5-5' }))
    on('session.cwd', () => ({ value: '/home/u/TMP/Claude' }))
    on('env.get', () => ({ value: '/home/u' }))
    on('settings.read', () => ({ value: { effortLevel: 'xhigh' } }))
    const ui = await $.ui.mount({
      plugin: 'usage-pane',
      surface,
      component: 'Pane',
      props: {
        title: 'Usage',
        isFocused: false,
        bodyColumns: 40,
        placement: 'dock',
        scroll: { offset: 0, bodyRows: 40 },
        view: {},
      },
      requestId: 'usage',
    })
    expect(await ui.find({ text: /45%/ })).toBeDefined()
    expect(await ui.find({ text: 'Session (5h)' })).toBeDefined()
    expect(await ui.find({ text: 'Weekly' })).toBeDefined()
    expect(await ui.find({ text: 'Fable (weekly)' })).toBeDefined()
    expect(await ui.find({ text: /\$1\.50/ })).toBeDefined()
    expect(await ui.find({ text: 'Opus 5.5' })).toBeDefined()
    expect(await ui.find({ text: /effort xhigh/ })).toBeDefined()
    expect(await ui.find({ text: '~/TMP/Claude' })).toBeDefined()
  })
}
