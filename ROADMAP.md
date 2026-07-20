# Roadmap

Status legend: **Shipped** = live in this repo today. **Dream** = intentionally not built, either requires infrastructure not available for a personal project, or is a larger investment than a portfolio piece warrants. Listed here so scope is explicit, not implied.

## Shipped (v1-v3)

- Rule-based urgency scoring and recommended actions (demo mode), clearly labeled as heuristics, not a model
- Live mode: real Claude API calls from the browser using a visitor-supplied API key (bring-your-own-key pattern)
- Custom signal input: paste your own ticket/alert text and triage it in either mode
- Human review queue: approve, edit-and-approve, or dismiss, nothing executes automatically
- Audit log of every decision, including urgency level, source (rule-based vs. live), and any note
- Compare Demo vs Live: run a signal through Claude without losing the rule-based assessment, see both side by side, promote whichever one you trust
- Session stats strip and urgency-mix chart summarizing the audit log
- Live-mode cost transparency: real token counts and a cost estimate per call, plus a running session total
- Configurable demo-mode keyword lists, editable in Settings
- Prompt transparency panel showing the exact prompt Claude would receive for any signal
- CSV export of the audit log
- Queue sorted by urgency (not insertion order), with a "next up" tag and a time-in-queue indicator on every card
- Demo vs Live Calibration report in the Audit Log tab: aggregate agree / Claude-rated-higher / Claude-rated-lower stats across every comparison run, with an explicit small-sample-size caveat
- Pre-call cost estimate shown next to "Compare with Claude," before you spend anything
- Keyboard shortcuts (A / E / D) to approve, edit-and-approve, or dismiss the front-of-queue card without touching the mouse

## Dream / Future (not built)

- **Real signal ingestion** (webhook from a real ticketing system, monitoring tool, or account platform) to replace the sample data. Requires a backend and real integrations, out of scope for a static personal project.
- **Multi-model support** — let a visitor choose between providers (OpenAI, Gemini) instead of Claude only. Would need provider-specific prompt handling and CORS support varies by provider.
- **Team/shared review queue** — right now this is single-browser, single-user (localStorage). A real team tool would need accounts, a database, and a backend, the same tradeoff made in the Real Estate Deal Analyzer.
- **Configurable category weights** — Settings now lets a visitor override the keyword lists (shipped in v2), but the +10 system-alert category weight and the scoring thresholds themselves are still hardcoded. Reasonable next step.
- **Escalation policies** — e.g. "auto-notify a Slack channel when something is approved as critical." Deliberately not built: this project's whole point is that nothing acts without a human decision first, and a real notification integration would need a backend.
- **Historical trend view** — chart urgency levels and decision outcomes over time from the audit log. Would be a natural compa