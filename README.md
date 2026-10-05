# ClaudeStatusPanel

Claude Code mod (`usage-pane`): a side pane that keeps the chat header info visible, plus usage.

- Model, effort, workspace
- Context window usage and breakdown
- Rate limits (session, weekly, Fable) with reset countdowns
- Session cost

## Install

```bash
git clone git@github.com:Yenreh/ClaudeStatusPanel.git ~/GIT/Utility/claude/ClaudeStatusPanel
```

Add to `~/.claude/settings.json` (paths separated by `:`):

```json
"env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/GIT/Utility/claude/ClaudeStatusPanel" }
```

Restart Claude Code. The pane opens on wide terminals (144+ columns); otherwise run `/usage-pane`.

## Update

```bash
git -C ~/GIT/Utility/claude/ClaudeStatusPanel pull
```

## Check

```bash
claude plugin validate ~/GIT/Utility/claude/ClaudeStatusPanel
claude plugin test ~/GIT/Utility/claude/ClaudeStatusPanel
```
