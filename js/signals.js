/**
 * signals.js
 *
 * SAMPLE DATA ONLY. These are fictional operational signals (support tickets,
 * system alerts, account activity) for demo purposes so the tool has
 * something to triage out of the box. This is not connected to any real
 * ticketing system, monitoring tool, or account database. Swapping this file
 * for a real webhook/API feed is the only change needed to go live; see
 * ROADMAP.md.
 */
const SAMPLE_SIGNALS = [
  {
    id: 'S1', category: 'system_alert', source: 'Monitoring',
    title: 'Checkout service error rate spike',
    body: 'Error rate on the checkout service jumped from 0.2% to 8.5% over the last 10 minutes. Correlates with a deploy at 14:02 UTC.',
    timestamp: '2026-07-18T14:12:00Z'
  },
  {
    id: 'S2', category: 'system_alert', source: 'Monitoring',
    title: 'Nightly batch job completed on schedule',
    body: 'The nightly reconciliation job completed in 42 minutes, within normal range.',
    timestamp: '2026-07-18T03:00:00Z'
  },
  {
    id: 'S3', category: 'system_alert', source: 'Monitoring',
    title: 'Primary database region reporting elevated latency',
    body: 'p99 query latency in us-east-1 is 4x baseline. No outage yet, but trending up over the last hour.',
    timestamp: '2026-07-18T09:47:00Z'
  },
  {
    id: 'S4', category: 'support_ticket', source: 'Support Queue',
    title: 'Customer reports unauthorized charge on their account',
    body: 'Customer says they see a charge they do not recognize and is asking whether their account was compromised.',
    timestamp: '2026-07-17T22:15:00Z'
  },
  {
    id: 'S5', category: 'support_ticket', source: 'Support Queue',
    title: 'Question about export file format',
    body: 'Customer is asking whether CSV exports can include a custom date format. Not blocking their work.',
    timestamp: '2026-07-17T11:30:00Z'
  },
  {
    id: 'S6', category: 'support_ticket', source: 'Support Queue',
    title: 'Refund dispute after failed payment retry',
    body: 'Customer was charged twice after a failed payment retry loop. They are requesting a refund and are frustrated.',
    timestamp: '2026-07-18T08:05:00Z'
  },
  {
    id: 'S7', category: 'account_activity', source: 'Account Monitoring',
    title: 'Login from a new country followed by a password change',
    body: 'Account logged in from a country with no prior login history, followed by a password reset 4 minutes later.',
    timestamp: '2026-07-18T05:22:00Z'
  },
  {
    id: 'S8', category: 'account_activity', source: 'Account Monitoring',
    title: 'Unusual spike in API usage on a single account',
    body: 'One account\'s API call volume is 15x its 30-day average over the past hour. No error spike associated with it.',
    timestamp: '2026-07-18T13:40:00Z'
  },
  {
    id: 'S9', category: 'account_activity', source: 'Account Monitoring',
    title: 'User updated their billing email',
    body: 'Routine profile update. No other unusual activity on the account.',
    timestamp: '2026-07-17T16:00:00Z'
  },
  {
    id: 'S10', category: 'system_alert', source: 'Monitoring',
    title: 'Possible data loss: backup job failed twice in a row',
    body: 'The automated backup job for the analytics warehouse has failed its last two scheduled runs. No successful backup in 26 hours.',
    timestamp: '2026-07-18T14:30:00Z'
  }
];

if (typeof module !== 'undefined' && module.exports) {
  module.exports = SAMPLE_SIGNALS;
}
