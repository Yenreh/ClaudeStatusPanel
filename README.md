# ClaudeStatusPanel

Claude Code mod (`usage-pane`): a side pane that keeps the chat header info visible, plus usage.

- Instance (`claude` or `claude-work`, from `CLAUDE_CONFIG_DIR`)
- Model, effort (from `/effort`, typed or picked in its menu, else settings), workspace
- Context window usage
- Rate limits (session, weekly, Fable) with reset countdowns
- Session cost

Labels are Nerd Font icons: fine in Ghostty (built in); other terminals need a Nerd Font or show boxes.

## Install

```bash
git clone https://github.com/Yenreh/ClaudeStatusPanel.git ~/ClaudeStatusPanel
```

Add to `~/.claude/settings.json` (paths separated by `:`):

```json
"env": { "CLAUDE_CODE_PLUGIN_DIRS": "~/ClaudeStatusPanel" }
```

Restart Claude Code. The pane opens on its own from 144 columns (110 once opened by hand); narrower, a one-line summary shows under the prompt until the terminal widens or you run `/usage-pane`. Docked it opens slightly wider than the dock minimum (28 columns); on narrow terminals it sits above the prompt as a one-line summary.

## Update

```bash
git -C ~/ClaudeStatusPanel pull
```

## Check

```bash
claude plugin validate ~/ClaudeStatusPanel
claude plugin test ~/ClaudeStatusPanel
```

## License

MIT
