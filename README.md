# ClaudeStatusPanel

Claude Code mod (`usage-pane`): a side pane that keeps the chat header info visible, plus usage.

- Model, effort, workspace
- Context window usage
- Rate limits (session, weekly, Fable) with reset countdowns
- Session cost

Labels are Nerd Font icons: fine in Ghostty (built in); other terminals need a Nerd Font or show boxes.

## Install

```bash
git clone git@github.com:Yenreh/ClaudeStatusPanel.git ~/GIT/Utility/claude/ClaudeStatusPanel
```

Add to `~/.claude/settings.json` (paths separated by `:`):

```json
"env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/GIT/Utility/claude/ClaudeStatusPanel" }
```

Restart Claude Code. The pane opens on wide terminals (144+ columns); otherwise run `/usage-pane`. Docked it opens slightly wider than the dock minimum (28 columns); on narrow terminals it sits above the prompt as a one-line summary.

## Update

```bash
git -C ~/GIT/Utility/claude/ClaudeStatusPanel pull
```

## Check

```bash
claude plugin validate ~/GIT/Utility/claude/ClaudeStatusPanel
claude plugin test ~/GIT/Utility/claude/ClaudeStatusPanel
```
