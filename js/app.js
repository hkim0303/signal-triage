/**
 * app.js — DOM wiring for Signal Triage.
 * Depends on Scoring, Recommendations, ClaudeClient, SAMPLE_SIGNALS,
 * AuditLog, Settings, Stats, ExportCsv, Queue, ComparisonLog, and (for the
 * audit chart) the global Chart constructor from Chart.js, all loaded as
 * globals before this file.
 */
(function () {
  'use strict';

  let queue = [];
  let customCounter = 0;
  let sessionCalls = 0;
  let sessionInputTokens = 0;
  let sessionOutputTokens = 0;
  let sessionCostUsd = 0;
  let auditChart = null;

  function showToast(msg) {
    const t = document.getElementById('toast');
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(showToast._timer);
    showToast._timer = setTimeout(() => t.classList.remove('show'), 2600);
  }

  function escapeHtml(str) {
    const d = document.createElement('div');
    d.textContent = str == null ? '' : String(str);
    return d.innerHTML;
  }

  function keywordConfig() {
    const settings = Settings.get();
    return {
      criticalKeywords: settings.criticalKeywords || undefined,
      elevatedKeywords: settings.elevatedKeywords || undefined
    };
  }

  function triageDemo(signal) {
    const scoring = Scoring.scoreSignal(signal, keywordConfig());
    const recommendation = Recommendations.recommendAction(signal, scoring);
    return { signal, scoring, recommendation, liveComparison: null };
  }

  async function callClaude(signal) {
    const apiKey = Settings.getApiKey();
    const result = await ClaudeClient.triageWithClaude(signal, apiKey);
    trackUsage(result);
    return result;
  }

  function trackUsage(result) {
    if (!result.usage) return;
    sessionCalls += 1;
    sessionInputTokens += result.usage.input_tokens || 0;
    sessionOutputTokens += result.usage.output_tokens || 0;
    if (result.cost) sessionCostUsd += result.cost.totalCostUsd;
    renderSessionCost();
  }

  function renderSessionCost() {
    const el = document.getElementById('session-cost');
    if (sessionCalls === 0) {
      el.style.display = 'none';
      return;
    }
    el.style.display = 'inline';
    el.textContent = ' · Session: ' + sessionCalls + ' live call' + (sessionCalls === 1 ? '' : 's') +
      ', ' + (sessionInputTokens + sessionOutputTokens).toLocaleString() + ' tokens, ~$' + sessionCostUsd.toFixed(4);
  }

  function isLiveModeReady() {
    return Settings.get().mode === 'live' && !!Settings.getApiKey();
  }

  function formatTimestamp(iso) {
    try {
      return new Date(iso).toLocaleString(undefined, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    } catch (e) {
      return iso;
    }
  }

  function categoryLabel(category) {
    const labels = { system_alert: 'System Alert', support_ticket: 'Support Ticket', account_activity: 'Account Activity' };
    return labels[category] || category;
  }

  function sourceLabel(source) {
    return source === 'claude-live' ? 'Live: Claude' : 'Rule-based';
  }

  // ---------- Queue rendering ----------

  function renderQueue() {
    const list = document.getElementById('queue-list');
    const empty = document.getElementById('queue-empty');
    list.innerHTML = '';

    if (!queue.length) {
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    const sorted = Queue.sortByUrgency(queue);
    sorted.forEach((item, index) => {
      list.appendChild(buildSignalCard(item, index === 0));
    });
  }

  function buildSignalCard(item, isFront) {
    const { signal, scoring, recommendation, liveComparison } = item;
    const card = document.createElement('div');
    card.className = 'signal-card' + (isFront ? ' is-front' : '');
    card.dataset.id = signal.id;
    if (isFront) card.dataset.front = 'true';

    const canCompare = isLiveModeReady() && scoring.source !== 'claude-live' && !liveComparison;
    const promptText = ClaudeClient.buildTriagePrompt(signal)[0].content;
    const elapsed = Queue.formatElapsed(signal.timestamp);
    const preCallEstimate = canCompare ? ClaudeClient.estimatePreCallCost(signal) : null;

    card.innerHTML = `
      <div class="signal-card-top">
        <div>
          <div class="signal-meta">${escapeHtml(categoryLabel(signal.category))} · ${escapeHtml(formatTimestamp(signal.timestamp))} <span class="elapsed-tag">· waiting ${escapeHtml(elapsed)}</span>${isFront ? ' <span class="front-tag">next up</span>' : ''}</div>
          <div class="signal-title">${escapeHtml(signal.title)}</div>
        </div>
        <span class="urgency-badge ${scoring.level}">${scoring.level} (${scoring.score !== undefined ? scoring.score : '—'})</span>
      </div>
      <p class="signal-body">${escapeHtml(signal.body)}</p>
      <ul class="reasons-list">${(scoring.reasons || []).map((r) => `<li>${escapeHtml(r)}</li>`).join('')}</ul>
      <div class="recommendation-box">
        <div class="action">${escapeHtml(recommendation.action)}</div>
        <div class="rationale">${escapeHtml(recommendation.rationale)}</div>
      </div>
      <div class="source-tag">Assessed by: ${escapeHtml(sourceLabel(scoring.source))}</div>

      <div class="comparison-panel" data-role="comparison-panel" style="${liveComparison ? '' : 'display:none;'}"></div>

      <details class="prompt-details">
        <summary>View the exact prompt Claude would receive</summary>
        <pre class="prompt-pre">${escapeHtml(promptText)}</pre>
      </details>

      <div class="btn-row">
        <button class="btn approve-btn" type="button">Approve</button>
        <button class="btn secondary edit-btn" type="button">Edit &amp; Approve</button>
        <button class="btn danger dismiss-btn" type="button">Dismiss</button>
        ${canCompare ? '<button class="btn secondary compare-btn" type="button">Compare with Claude</button>' : ''}
      </div>
      ${preCallEstimate ? `<div class="precall-estimate">Est. cost to compare: ~$${preCallEstimate.estimatedCostUsd.toFixed(4)} (${preCallEstimate.estimatedInputTokens} input tokens + ~${preCallEstimate.estimatedOutputTokens} output tokens, before the call is made)</div>` : ''}
      <div class="edit-box" data-role="edit-box">
        <div class="field">
          <label>Edit the recommended action before approving</label>
          <input type="text" class="edit-action-input" value="${escapeHtml(recommendation.action)}">
        </div>
        <div class="btn-row">
          <button class="btn small confirm-edit-btn" type="button">Confirm &amp; Approve</button>
          <button class="btn secondary small cancel-edit-btn" type="button">Cancel</button>
        </div>
      </div>
      <div class="edit-box" data-role="dismiss-box">
        <div class="field decision-note">
          <label>Reason for dismissing (optional)</label>
          <input type="text" class="dismiss-note-input" placeholder="e.g. false positive, already handled">
        </div>
        <div class="btn-row">
          <button class="btn danger small confirm-dismiss-btn" type="button">Confirm Dismiss</button>
          <button class="btn secondary small cancel-dismiss-btn" type="button">Cancel</button>
        </div>
      </div>
    `;

    if (liveComparison) renderComparisonPanel(card, item);
    wireCard(card, item);
    return card;
  }

  function renderComparisonPanel(card, item) {
    const panel = card.querySelector('[data-role="comparison-panel"]');
    const { scoring, liveComparison } = item;
    const agree = scoring.level === liveComparison.scoring.level;
    panel.style.display = 'block';
    panel.innerHTML = `
      <div class="compare-heading">Rule-based vs Claude ${agree ? '<span class="agree-tag agree">agree</span>' : '<span class="agree-tag disagree">disagree</span>'}</div>
      <div class="compare-row"><span class="compare-label">Rule-based:</span> <span class="urgency-badge ${scoring.level}">${scoring.level}</span> ${escapeHtml(item.recommendation.action)}</div>
      <div class="compare-row"><span class="compare-label">Claude:</span> <span class="urgency-badge ${liveComparison.scoring.level}">${liveComparison.scoring.level}</span> ${escapeHtml(liveComparison.recommendation.action)}</div>
      <div class="compare-rationale">${escapeHtml(liveComparison.recommendation.rationale)}</div>
      <div class="btn-row">
        <button class="btn small use-claude-btn" type="button">Use Claude's assessment</button>
      </div>
    `;
    panel.querySelector('.use-claude-btn').addEventListener('click', () => {
      item.scoring = liveComparison.scoring;
      item.recommendation = liveComparison.recommendation;
      item.liveComparison = null;
      renderQueue();
      showToast('Switched to Claude’s assessment');
    });
  }

  function removeFromQueue(signalId) {
    queue = queue.filter((q) => q.signal.id !== signalId);
  }

  function wireCard(card, item) {
    const { signal } = item;
    const editBox = card.querySelector('[data-role="edit-box"]');
    const dismissBox = card.querySelector('[data-role="dismiss-box"]');

    function currentAssessment() {
      return { scoring: item.scoring, recommendation: item.recommendation };
    }

    card.querySelector('.approve-btn').addEventListener('click', () => {
      const { scoring, recommendation } = currentAssessment();
      AuditLog.record({
        signalId: signal.id, signalTitle: signal.title, category: signal.category, level: scoring.level,
        decision: 'approved', finalAction: recommendation.action, source: scoring.source
      });
      removeFromQueue(signal.id);
      renderQueue();
      renderAuditLog();
      showToast('Approved: ' + recommendation.action);
    });

    card.querySelector('.edit-btn').addEventListener('click', () => {
      dismissBox.classList.remove('visible');
      editBox.classList.toggle('visible');
    });

    card.querySelector('.cancel-edit-btn').addEventListener('click', () => {
      editBox.classList.remove('visible');
    });

    card.querySelector('.confirm-edit-btn').addEventListener('click', () => {
      const { scoring, recommendation } = currentAssessment();
      const editedAction = card.querySelector('.edit-action-input').value.trim() || recommendation.action;
      AuditLog.record({
        signalId: signal.id, signalTitle: signal.title, category: signal.category, level: scoring.level,
        decision: 'edited', finalAction: editedAction, source: scoring.source
      });
      removeFromQueue(signal.id);
      renderQueue();
      renderAuditLog();
      showToast('Approved with edits');
    });

    card.querySelector('.dismiss-btn').addEventListener('click', () => {
      editBox.classList.remove('visible');
      dismissBox.classList.toggle('visible');
    });

    card.querySelector('.cancel-dismiss-btn').addEventListener('click', () => {
      dismissBox.classList.remove('visible');
    });

    card.querySelector('.confirm-dismiss-btn').addEventListener('click', () => {
      const { scoring } = currentAssessment();
      const note = card.querySelector('.dismiss-note-input').value.trim();
      AuditLog.record({
        signalId: signal.id, signalTitle: signal.title, category: signal.category, level: scoring.level,
        decision: 'dismissed', note, source: scoring.source
      });
      removeFromQueue(signal.id);
      renderQueue();
      renderAuditLog();
      showToast('Dismissed');
    });

    const compareBtn = card.querySelector('.compare-btn');
    if (compareBtn) {
      compareBtn.addEventListener('click', async () => {
        compareBtn.disabled = true;
        compareBtn.textContent = 'Comparing…';
        try {
          const result = await callClaude(signal);
          item.liveComparison = {
            scoring: { level: result.level, reasons: result.reasons, source: 'claude-live' },
            recommendation: { action: result.action, rationale: result.rationale, source: 'claude-live' }
          };
          ComparisonLog.record({
            signalId: signal.id, signalTitle: signal.title,
            ruleLevel: item.scoring.level, liveLevel: result.level
          });
          renderQueue();
          showToast('Compared with Claude');
        } catch (err) {
          compareBtn.disabled = false;
          compareBtn.textContent = 'Compare with Claude';
          showToast('Live comparison failed: ' + err.message);
        }
      });
    }
  }

  // ---------- Audit log rendering ----------

  function renderAuditLog() {
    const entries = AuditLog.getAll();
    const empty = document.getElementById('audit-empty');
    const table = document.getElementById('audit-table');
    const actions = document.getElementById('audit-actions');
    const statsGrid = document.getElementById('audit-stats');
    const chartWrap = document.getElementById('audit-chart-wrap');
    const tbody = document.getElementById('audit-tbody');

    renderCalibrationBox();

    if (!entries.length) {
      empty.style.display = 'block';
      table.style.display = 'none';
      actions.style.display = 'none';
      statsGrid.style.display = 'none';
      chartWrap.style.display = 'none';
      return;
    }
    empty.style.display = 'none';
    table.style.display = 'table';
    actions.style.display = 'flex';
    statsGrid.style.display = 'grid';
    chartWrap.style.display = 'block';

    const stats = Stats.summarize(entries);
    document.getElementById('stat-total').textContent = stats.total;
    document.getElementById('stat-approved').textContent = stats.approvedPct + '%';
    document.getElementById('stat-edited').textContent = stats.editedPct + '%';
    document.getElementById('stat-dismissed').textContent = stats.dismissedPct + '%';
    renderAuditChart(stats);

    tbody.innerHTML = entries.map((e) => `
      <tr>
        <td>${escapeHtml(e.signalTitle)}</td>
        <td>${e.level ? `<span class="urgency-badge ${e.level}">${escapeHtml(e.level)}</span>` : '—'}</td>
        <td><span class="decision-tag ${e.decision}">${escapeHtml(e.decision)}</span></td>
        <td>${escapeHtml(e.finalAction || '—')}</td>
        <td>${escapeHtml(e.note || '—')}</td>
        <td>${escapeHtml(sourceLabel(e.source))}</td>
        <td>${escapeHtml(formatTimestamp(e.decidedAt))}</td>
      </tr>
    `).join('');
  }

  function renderCalibrationBox() {
    const box = document.getElementById('calibration-box');
    const comparisons = ComparisonLog.getAll();
    if (!comparisons.length) {
      box.style.display = 'none';
      return;
    }
    box.style.display = 'block';
    const summary = ComparisonLog.summarize(comparisons);
    document.getElementById('cal-total').textContent = summary.total;
    document.getElementById('cal-agree').textContent = summary.agreePct + '%';
    document.getElementById('cal-higher').textContent = summary.liveHigherCount;
    document.getElementById('cal-lower').textContent = summary.liveLowerCount;
  }

  function renderAuditChart(stats) {
    if (typeof Chart === 'undefined') return;
    const canvas = document.getElementById('audit-chart');
    const ctx = canvas.getContext('2d');
    if (auditChart) auditChart.destroy();
    auditChart = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Low', 'Medium', 'High', 'Critical'],
        datasets: [{
          label: 'Signals reviewed',
          data: [stats.byLevel.low, stats.byLevel.medium, stats.byLevel.high, stats.byLevel.critical],
          backgroundColor: ['#2F6B4F', '#4a6fa5', '#b3762c', '#b3462c']
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
      }
    });
  }

  // ---------- Tabs ----------

  function initTabs() {
    document.querySelectorAll('.tab-btn').forEach((btn) => {
      btn.addEventListener('click', () => switchTab(btn.dataset.tab));
    });
  }

  function switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach((b) => b.classList.toggle('active', b.dataset.tab === tabId));
    document.querySelectorAll('.tab-panel').forEach((p) => p.classList.toggle('active', p.id === 'tab-' + tabId));
    if (tabId === 'audit') renderAuditLog();
  }

  // ---------- Settings ----------

  function refreshModeBanner() {
    const settings = Settings.get();
    const tag = document.getElementById('mode-tag');
    const desc = document.getElementById('mode-description');
    if (settings.mode === 'live' && Settings.getApiKey()) {
      tag.textContent = 'Live mode';
      tag.className = 'mode-tag live';
      desc.textContent = 'New signals can be scored by a real Claude API call; pending ones can be compared against it.';
    } else {
      tag.textContent = 'Demo mode';
      tag.className = 'mode-tag demo';
      desc.textContent = 'Scoring and recommendations below are rule-based, not a live model.';
    }
    renderSessionCost();
  }

  function initSettings() {
    const toggle = document.getElementById('settings-toggle');
    const box = document.getElementById('settings-box');
    const modeDemo = document.getElementById('mode-demo');
    const modeLive = document.getElementById('mode-live');
    const apiKeyField = document.getElementById('api-key-field');
    const apiKeyInput = document.getElementById('api-key-input');

    const settings = Settings.get();
    if (settings.mode === 'live') {
      modeLive.checked = true;
      apiKeyField.style.display = 'block';
    }
    apiKeyInput.value = Settings.getApiKey();
    document.getElementById('custom-critical-keywords').value = (settings.criticalKeywords || []).join(', ');
    document.getElementById('custom-elevated-keywords').value = (settings.elevatedKeywords || []).join(', ');

    toggle.addEventListener('click', () => {
      box.style.display = box.style.display === 'none' ? 'block' : 'none';
    });

    [modeDemo, modeLive].forEach((radio) => {
      radio.addEventListener('change', () => {
        apiKeyField.style.display = modeLive.checked ? 'block' : 'none';
      });
    });

    document.getElementById('save-mode-settings').addEventListener('click', () => {
      const mode = modeLive.checked ? 'live' : 'demo';
      Settings.save({ mode });
      Settings.setApiKey(apiKeyInput.value.trim());
      refreshModeBanner();
      renderQueue();
      showToast(mode === 'live' ? 'Live mode enabled' : 'Switched to demo mode');
    });

    document.getElementById('save-keyword-settings').addEventListener('click', () => {
      const critical = document.getElementById('custom-critical-keywords').value
        .split(',').map((s) => s.trim()).filter(Boolean);
      const elevated = document.getElementById('custom-elevated-keywords').value
        .split(',').map((s) => s.trim()).filter(Boolean);
      Settings.save({
        criticalKeywords: critical.length ? critical : null,
        elevatedKeywords: elevated.length ? elevated : null
      });
      requeueDemoOnly();
      showToast('Keyword settings applied');
    });

    document.getElementById('reset-keyword-settings').addEventListener('click', () => {
      Settings.resetKeywords();
      document.getElementById('custom-critical-keywords').value = '';
      document.getElementById('custom-elevated-keywords').value = '';
      requeueDemoOnly();
      showToast('Reset to default keywords');
    });
  }

  // Re-scores any still-pending, not-yet-live-assessed items with the current
  // keyword settings, without touching items already assessed live.
  function requeueDemoOnly() {
    queue = queue.map((item) => {
      if (item.scoring.source === 'claude-live') return item;
      return triageDemo(item.signal);
    });
    renderQueue();
  }

  // ---------- Custom signal form ----------

  function initCustomSignalForm() {
    const addBtn = document.getElementById('add-custom-signal');
    addBtn.addEventListener('click', async () => {
      const title = document.getElementById('custom-title').value.trim();
      const category = document.getElementById('custom-category').value;
      const body = document.getElementById('custom-body').value.trim();

      if (!title || !body) {
        showToast('Add a title and some details first');
        return;
      }

      customCounter += 1;
      const signal = {
        id: 'custom_' + Date.now().toString(36) + '_' + customCounter,
        category, title, body, timestamp: new Date().toISOString()
      };

      addBtn.disabled = true;
      const originalText = addBtn.textContent;
      addBtn.textContent = isLiveModeReady() ? 'Triaging with Claude…' : 'Adding…';

      try {
        let item;
        if (isLiveModeReady()) {
          const result = await callClaude(signal);
          item = {
            signal,
            scoring: { level: result.level, reasons: result.reasons, source: 'claude-live' },
            recommendation: { action: result.action, rationale: result.rationale, source: 'claude-live' },
            liveComparison: null
          };
        } else {
          item = triageDemo(signal);
        }
        queue.unshift(item);
        renderQueue();
        document.getElementById('custom-title').value = '';
        document.getElementById('custom-body').value = '';
        showToast('Signal added to the queue');
      } catch (err) {
        showToast('Could not triage that signal: ' + err.message);
      } finally {
        addBtn.disabled = false;
        addBtn.textContent = originalText;
      }
    });
  }

  // ---------- Init ----------

  function init() {
    queue = SAMPLE_SIGNALS.map(triageDemo);
    initTabs();
    initSettings();
    initCustomSignalForm();
    refreshModeBanner();
    renderQueue();
    renderAuditLog();

    document.getElementById('clear-audit-log').addEventListener('click', () => {
      AuditLog.clear();
      renderAuditLog();
      showToast('Audit log cleared');
    });

    document.getElementById('export-audit-csv').addEventListener('click', () => {
      const entries = AuditLog.getAll();
      if (!entries.length) { showToast('No decisions to export yet'); return; }
      ExportCsv.download(entries, 'signal-triage-audit-log.csv');
      showToast('Audit log exported as CSV');
    });

    document.getElementById('clear-calibration-log').addEventListener('click', () => {
      ComparisonLog.clear();
      renderCalibrationBox();
      showToast('Comparison log cleared');
    });

    initKeyboardShortcuts();
  }

  // ---------- Keyboard shortcuts ----------
  // A / E / D act on the front-of-queue card (the topmost, most urgent
  // signal) when the Triage Queue tab is active. Ignored while a text
  // field, textarea, or select has focus so typing "a dog" into the
  // custom signal form doesn't accidentally approve something.
  function initKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const tag = (document.activeElement && document.activeElement.tagName) || '';
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      const queueTab = document.getElementById('tab-queue');
      if (!queueTab || !queueTab.classList.contains('active')) return;

      const frontCard = document.querySelector('.signal-card[data-front="true"]');
      if (!frontCard) return;

      const key = e.key.toLowerCase();
      if (key === 'a') {
        e.preventDefault();
        frontCard.querySelector('.approve-btn').click();
      } else if (key === 'e') {
        e.preventDefault();
        frontCard.querySelector('.edit-btn').click();
        const input = frontCard.querySelector('.edit-action-input');
        if (input) input.focus();
      } else if (key === 'd') {
        e.preventDefault();
        frontCard.querySelector('.dismiss-btn').click();
      }
    });
  }

  document.addEventListener('DOMContentLoaded', init);
})();
