import { expect, test } from 'claude-code/testing'

import { bar, colorFor, configuredEffort, labelFor, modelName, resetsIn, shortPath, sortLimits, tokens } from './format'

test('labels the Fable window', () => {
  expect(labelFor('seven_day_overage_included')).toBe('Fable (weekly)')
  expect(labelFor('five_hour')).toBe('Session (5h)')
  expect(labelFor('other')).toBe('other')
})

test('orders session, weekly, then Fable', () => {
  const kinds = sortLimits([
    { kind: 'seven_day_overage_included' },
    { kind: 'seven_day' },
    { kind: 'five_hour' },
  ]).map(l => l.kind)
  expect(kinds).toEqual(['five_hour', 'seven_day', 'seven_day_overage_included'])
})

test('draws bars and colors by percent', () => {
  expect(bar(50, 10)).toBe('█████░░░░░')
  expect(bar(150, 4)).toBe('████')
  expect(colorFor(10)).toBe('#8b5cf6')
  expect(colorFor(75)).toBe('#c084fc')
  expect(colorFor(95)).toBe('#e879f9')
})

test('formats tokens and reset times', () => {
  expect(tokens(950)).toBe('950')
  expect(tokens(90_100)).toBe('90.1k')
  expect(tokens(200_000)).toBe('200k')
  expect(tokens(1_000_000)).toBe('1M')
  const now = Date.parse('2026-10-03T10:00:00Z')
  expect(resetsIn('2026-10-03T12:10:00Z', now)).toBe('resets in 2h 10m')
  expect(resetsIn('2026-10-06T13:00:00Z', now)).toBe('resets in 3d 3h')
  expect(resetsIn(undefined, now)).toBe('')
})

test('modelName formats Claude ids', () => {
  expect(modelName('claude-opus-5-5')).toBe('Opus 5.5')
  expect(modelName('claude-sonnet-5-5[1m]')).toBe('Sonnet 5.5 [1m]')
  expect(modelName('claude-haiku-4-5-20251001')).toBe('Haiku 4.5')
  expect(modelName('custom-model')).toBe('custom-model')
})

test('configuredEffort prefers the per-model setting', () => {
  const s = { effortLevel: 'medium', modelSettings: { 'claude-opus-5-5': { effortLevel: 'high' } } }
  expect(configuredEffort(s, 'claude-opus-5-5[1m]')).toBe('high')
  expect(configuredEffort(s, 'claude-sonnet-5-5')).toBe('medium')
  expect(configuredEffort({}, 'claude-opus-5-5')).toBeUndefined()
})

test('shortPath abbreviates home', () => {
  expect(shortPath('/home/u/TMP/Claude', '/home/u')).toBe('~/TMP/Claude')
  expect(shortPath('/home/u', '/home/u')).toBe('~')
  expect(shortPath('/home/user2/x', '/home/u')).toBe('/home/user2/x')
})
