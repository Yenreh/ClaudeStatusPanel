# ClaudeStatusPanel

Claude Code mod (`usage-pane`): a side pane that keeps the chat header info visible, plus usage.

- Model, effort, workspace
- Context window usage and breakdown
- Rate limits (session, weekly, Fable) with reset countdowns
- Session cost

## Install

```bash
git clone git@github.com:Yenreh/ClaudeStatusPanel.git ~/.claude/mods/usage-pane
```

Add to `~/.claude/settings.json` (paths separated by `:`):

```json
"env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/.claude/mods/usage-pane" }
```

Restart Claude Code. The pane opens on wide terminals (144+ columns); otherwise run `/usage-pane`.

## Update

```bash
git -C ~/.claude/mods/usage-pane pull
```

## Check

```bash
claude plugin validate ~/.claude/mods/usage-pane
claude plugin test ~/.claude/mods/usage-pane
```
