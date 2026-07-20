/**
 * recommendations.js
 *
 * Templated recommended actions for demo mode, keyed by signal category and
 * urgency level. Every template is written to require human review, never
 * to imply the tool takes the action itself. Live mode (js/claude.js)
 * replaces this with a real model-generated recommendation.
 */
const Recommendations = (function () {
  const TEMPLATES = {
    system_alert: {
      critical: { action: 'Page the on-call engineer now', rationale: 'Critical infrastructure signals need a human response immediately; this tool does not page anyone automatically.' },
      high: { action: 'Escalate to the infrastructure team within the hour', rationale: 'High-severity signal, but not yet confirmed as an outage.' },
      medium: { action: 'Add to the engineering triage queue for this shift', rationale: 'Worth a look this shift, not an emergency yet.' },
      low: { action: 'Log for trend monitoring, no immediate action needed', rationale: 'Within normal range or already resolved.' }
    },
    support_ticket: {
      critical: { action: 'Route to a senior support lead for a same-day response', rationale: 'Signals possible account security or billing harm; needs a human decision, not an automatic refund or account action.' },
      high: { action: 'Prioritize ahead of the standard queue', rationale: 'Customer impact looks real, but not urgent enough to interrupt someone.' },
      medium: { action: 'Handle in normal queue order', rationale: 'Standard support request.' },
      low: { action: 'Standard response time applies', rationale: 'No urgency signals present.' }
    },
    account_activity: {
      critical: { action: 'Flag the account for manual security review before any restriction is applied', rationale: 'Possible account compromise; a human should verify before locking or restricting anything.' },
      high: { action: 'Queue for account review within 24 hours', rationale: 'Unusual but not clearly malicious activity.' },
      medium: { action: 'Note on the account for the next scheduled review', rationale: 'Minor deviation from normal usage.' },
      low: { action: 'No action needed', rationale: 'Routine account activity.' }
    }
  };

  function recommendAction(signal, scoring) {
    const byCategory = TEMPLATES[signal.category] || TEMPLATES.support_ticket;
    const rec = byCategory[scoring.level] || byCategory.low;
    return { action: rec.action, rationale: rec.rationale, source: 'rule-based template' };
  }

  return { recommendAction, TEMPLATES };
})();

if (typeof module !== 'undefined' && module.exports) {
  module.exports = Recommendations;
}
