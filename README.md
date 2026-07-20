# Signal Triage

An AI-assisted operational triage queue: incoming signals (support tickets, system alerts, account activity) get scored for urgency and given a recommended next action. Nothing executes automatically. A human always approves, edits, or dismisses each recommendation before it becomes a decision, and every decision is written to an audit log.

**Live demo:** https://hkim0303.github.io/signal-triage/
**Part of my product portfolio:** https://app.notion.com/p/39fc9e01eb308124b369df917f865fd0
**Product requirements & decisions doc:** [PRD.md](./PRD.md)

## Why I built this

This is a live version of a product pattern I defined at BlueRidge Global (Case Study 4 in my portfolio: AI-assisted automation and recommendation workflows) that's still roadmap-stage there, not something I can screenshot or hand a recruiter a link to. This project builds the same pattern end to end, in a non-proprietary domain, so it's something you can actually open and test: a signal comes in, it gets triaged, a human decides, the decision is logged.

## Features

- **Triage Queue** — sample operational signals, each scored for urgency (low/medium/high/critical) with a recommended next action and the reasoning behind it.
- **Demo mode** — urgency scoring and recommendations are rule-based (keyword and category heuristics), clearly labeled as such, no API key required. Works instantly for anyone.
- **Live mode** — calls the real Claude API directly from your browser using your own Anthropic API key, via Anthropic's documented "bring your own key" CORS support (`anthropic-dangerous-direct-browser-access`). Your key lives only in this browser tab's session storage, cleared when you close the tab, sent only to `api.anthropic.com`, never to any server of mine, because this tool has no backend at all.
- **Compare Demo vs Live** — run a pending signal through Claude without losing the rule-based assessment; see both side by side with an agree/disagree indicator, then optionally promote the live result.
- **Cost transparency** — every live call shows its real input/output token count and a cost estimate at Claude Sonnet 5's published rate, plus a running total for the session.
- **Configurable demo-mode keywords** — override the rule-based scorer's critical/elevated keyword lists in Settings, no code required.
- **Prompt transparency** — every signal has an expandable panel showing the exact prompt that would be sent to Claude, whether or not live mode is on.
- **Add your own signal** — paste in real ticket or alert text and see how it gets triaged, in demo or live mode.
- **Urgency-sorted queue** — the queue orders by urgency, not by insertion order, with the highest-priority signal tagged "next up" and a time-in-queue indicator on every card.
- **Pre-call cost estimate** — before you click "Compare with Claude," see an estimated cost for that call, not just the real number after.
- **Keyboard shortcuts** — A / E / D approve, edit-and-approve, or dismiss the front-of-queue card without touching the mouse.
- **Human review queue** — every recommendation can be approved as-is, edited before approving, or dismissed with a note. Nothing happens automatically.
- **Audit log** — every decision is recorded: what was decided, the urgency level, the final action, any note, whether it was rule-based or live-Claude, and when. This is what makes "a human is always in the loop" checkable instead of just claimed. Includes a summary stats strip, an urgency-mix chart, and CSV export.
- **Demo vs Live Calibration report** — an aggregate view, in the Audit Log tab, of how often the rule-based scorer agrees with Claude across every comparison you've run, with an explicit note that this is not a rigorous benchmark.

## An honest note on the AI

Demo mode's scoring and recommendations are deliberately simple rule-based heuristics (keyword matching, category weighting), not a model, and the UI labels them that way. Live mode is real: an actual Claude API call generates the urgency assessment and recommendation when you supply your own key. Neither mode ever takes an action on a real system, ticket, or account. This is a decision-support tool, not an automation tool, on purpose, that's the actual product idea being demonstrated.

## Architecture

Fully static: plain HTML/CSS/JavaScript, no build step, no framework, no backend. Deploys directly to GitHub Pages. In live mode, the browser calls Anthropic's API directly, no server of mine sits in between.

```
index.html               Single-page app shell (tab navigation)
css/style.css              All styling
js/scoring.js               Rule-based urgency scoring (demo mode, pure function)
js/recommendations.js        Templated recommended actions (demo mode, pure function)
js/claude.js                 Live-mode Claude API client (prompt building, response
                               parsing, and cost estimation are pure and tested; the
                               network call itself is exercised manually in-browser)
js/signals.js                 Sample signal data (demo only, see note above)
js/storage.js                  Audit log persistence (localStorage)
js/settings.js                  Mode toggle, keyword overrides (localStorage), API key
                                  (sessionStorage only)
js/stats.js                      Pure aggregation over the audit log (decision and
                                   urgency-level breakdown)
js/export.js                      CSV export of the audit log
js/queue.js                        Pure queue ordering (urgency-first) and elapsed-time
                                     formatting
js/comparisons.js                   Comparison log: records every "Compare with Claude"
                                      run and summarizes agreement, independent of the
                                      audit log
js/app.js                            DOM wiring: tabs, queue rendering, review actions,
                                       compare mode, audit log, calibration report,
                            