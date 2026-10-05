export type Tick = number
export type Effort = string | null

declare module 'claude-code' {
  interface PluginState {
    'usage-pane': { tick: Tick; effort: Effort }
  }
}
