# Product Requirements & Decisions — Signal Triage

**Author:** Heewon Kim, Product Manager
**Status:** Shipped (v1), maintained as a personal project

---

## 1. Problem statement

Operational teams (support, infrastructure, trust and safety) get a constant stream of signals that need a judgment call: is this urgent, and what should happen next? Doing that triage well requires two things that are hard to have both of at once: speed, so nothing sits unnoticed, and control, so nothing happens that a human didn't actually decide. Fully automated systems optimize for speed and lose control. Fully manual systems keep control and lose speed. This project is a small, honest attempt at the middle: fast triage, mandatory human decision.

Separately, I needed a live artifact for a product pattern I've only defined on a roadmap, not shipped: AI-assisted automation with a human always in the loop, from my current role at BlueRidge Global. That case study has no demo behind it. This project gives it one, in a domain that isn't proprietary.

## 2. Target user

**Primary persona: an ops, support, or trust-and-safety lead** triaging a queue of tickets or alerts who wants help prioritizing and doesn't want a system that acts on its own. Not sourced from user interviews, this is a personal project, but grounded in a pattern common enough across support and infrastructure tooling that it doesn't require invented specifics to describe accurately.

**Explicitly not the target user:** anyone looking for full automation. If the goal is "handle this without me," this is the wrong tool on purpose.

## 3. Goals

- Take an unstructured signal (a ticket, an alert, an activity log entry) and produce an urgency assessment and a recommended action in seconds
- Never let a recommendation become a real decision without a human explicitly approving, editing, or dismissing it
- Make the human-in-the-loop claim checkable, not just stated, via a real audit log
- Be honest about which parts are a real model and which parts are a heuristic standing in for one

## 4. Non-goals (v1)

- **Taking real action on real systems.** This tool does not integrate with any ticketing system, monitoring platform, or account database, and it never will in its current form. Every "action" is a recommendation logged for a human, nothing more.
- **Full automation / auto-approval.** There is no setting, threshold, or mode that skips human review, even for low-urgency signals. This is a deliberate constraint, not a missing feature.
- **Multi-provider AI support.** Live mode supports Claude only, not OpenAI, Gemini, or others. A real product might offer a choice; this one is scoped to prove the pattern, not build a provider-agnostic platform.
- **Team accounts / shared queues.** Like the Real Estate Deal Analyzer, this is client-side only (localStorage), single-browser, single-user. A real deployment for a team would need a backend.

## 5. What shipped

| Area | Scope |
|---|---|
| Scoring | Rule-based keyword and category heuristic (demo mode) or real Claude API call (live mode) |
| Recommendations | Templated by category and urgency (demo mode) or model-generated (live mode), always framed as requiring human approval |
| Review | Approve, edit-and-approve, or dismiss with a note; nothing else the tool can do to a signal |
| Audit log | Every decision recorded with source, urgency level, final action, note, and timestamp, plus a stats strip and urgency-mix chart |
| Custom input | Paste arbitrary signal text and triage it in either mode |
| Compare (v2) | Run a pending signal through Claude without losing the rule-based assessment; see both side by side with an agree/disagree indicator, promote whichever one wins |
| Cost transparency (v2) | Real input/output token counts and a cost estimate per live call, plus a running session total, computed from Anthropic's published per-token rates |
| Configurable keywords (v2) | Override the demo-mode scorer's critical/elevated keyword lists in Settings, no code required |
| Prompt transparency (v2) | Every signal has an expandable panel showing the exact prompt Claude would receive |
| Urgency-sorted queue (v3) | Queue orders by urgency, not insertion order, with a "next up" tag and a time-in-queue indicator per card |
| Demo vs Live Calibration (v3) | Aggregate report of how often the rule-based scorer agrees with Claude, built from every logged comparison, with an explicit small-sample-size caveat |
| Pre-call cost estimate (v3) | Estimated cost shown next to "Compare with Claude" before the call is made, not just after |
| Keyboard shortcuts (v3) | A / E / D approve, edit-and-approve, or dismiss the front-of-queue card |

Full feature detail: [README.md](./README.md). Forward-looking scope: [ROADMAP.md](./ROADMAP.md).

## 6. Key product decisions & tradeoffs

**Bring-your-own-key live mode instead of a hosted backend.**
Tradeoff: a visitor has to have (and trust the tool with) their own Anthropic API key to see real model output; demo mode exists specifically so the tool is still fully usable without one. Chosen because a static site with an embedded API key would leak that key to anyone who opens dev tools, and a real backend proxy is infrastructure this project doesn't need to justify. Anthropic's `anthropic-dangerous-direct-browser-access` header exists for exactly this bring-your-own-key pattern, so this isn't a workaround, it's the documented supported path.

**API key in sessionStorage, not localStorage.**
Tradeoff: a visitor has to re-enter their key if they close the tab. Chosen deliberately: `localStorage` persists indefinitely on the visitor's machine, `sessionStorage` clears when the tab closes. For a value this sensitive, the extra friction is worth it. This is tested directly (`tests/test-settings.js`) to make sure a future change doesn't accidentally regress it into `localStorage`.

**Rule-based demo mode instead of always requiring a live call.**
Tradeoff: demo mode's "intelligence" is a keyword list and a category weight, not a model, and it says so in the UI. Chosen because a portfolio tool that only works if a stranger pastes in their own paid API key is a tool most recruiters will never actually see working. The honest labeling here is the same discipline as the Real Estate Deal Analyzer's rule-based Deal Insights panel.

**No auto-approval threshold, at any urgency level, in either mode.**
Tradeoff: even an obviously low-urgency signal still sits in the queue until a human dismisses or approves it, there's no "auto-clear anything under X score" setting. This was a deliberate decision, not an oversight: the entire point of this project is demonstrating that automation can accelerate a decision without making it. Adding an auto-approve threshold would quietly undermine the thing being demonstrated.

**Per-signal live comparison instead of live-triaging the whole queue at once.**
Tradeoff: switching to live mode doesn't retroactively re-score the 10 sample signals already in the queue, a visitor has to click "Compare with Claude" per card. Chosen to avoid firing ten API calls (and ten small charges) against a visitor's key the moment they flip a toggle, without asking.

**Compare instead of overwrite, with an explicit promote step.**
Tradeoff: seeing Claude's assess