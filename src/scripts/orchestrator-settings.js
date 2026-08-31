const statusEl = document.getElementById('status');
const cardsEl = document.getElementById('pageSettingsCards');
const tierListEl = document.getElementById('tierList');
const displaySelectorEl = document.getElementById('displaySelector');
const shareSourceDisplayEl = document.getElementById('shareSourceDisplay');
const shareTargetDisplayEl = document.getElementById('shareTargetDisplay');
const showDeletedToggleEl = document.getElementById('showDeletedPages');
const displayUrlsEl = document.getElementById('displayUrls');

const state = {
  displayId: 'hallway',
  settings: null,
  pages: [],
  tierList: [0, 1, 2, 3],
  displays: ['hallway'],
  deletedDisplays: {}
};

function setStatus(message) {
  statusEl.textContent = String(message || 'Ready');
}

function pageControlId(pageId, key) {
  return `page-${pageId}-${key}`;
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

async function csl(command, payload = {}) {
  const response = await fetch('/csl/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, payload })
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`${command} failed (${response.status}): ${details}`);
  }

  return response.json();
}

async function fetchSettings() {
  return csl('orchestrator.settings.get', { displayId: state.displayId });
}

async function fetchPages() {
  const payload = await csl('orchestrator.pages.list', { displayId: state.displayId });
  return Array.isArray(payload?.pages) ? payload.pages : [];
}

async function fetchTierList() {
  const payload = await csl('orchestrator.tierList.get', { displayId: state.displayId });
  return Array.isArray(payload?.tierList) ? payload.tierList : [0, 1, 2, 3];
}

async function fetchDisplays() {
  const payload = await csl('orchestrator.displays.list', {});
  return {
    displays: Array.isArray(payload?.displays) ? payload.displays : ['hallway'],
    deletedDisplays: payload?.deletedDisplays && typeof payload.deletedDisplays === 'object' ? payload.deletedDisplays : {}
  };
}

function renderDisplayRegistry() {
  const options = state.displays.map((displayId) => {
    const selected = displayId === state.displayId ? 'selected' : '';
    return `<option value="${escapeHtml(displayId)}" ${selected}>${escapeHtml(displayId)}</option>`;
  }).join('');

  displaySelectorEl.innerHTML = options;
  shareSourceDisplayEl.innerHTML = options;
  shareTargetDisplayEl.innerHTML = options;
  shareSourceDisplayEl.value = state.displayId;
  shareTargetDisplayEl.value = state.displayId;

  const lines = [];
  for (const displayId of state.displays) {
    lines.push(`/display/${displayId}/current`);
    lines.push(`/display/${displayId}/hallway/current`);
    lines.push(`/content/settings.json?displayId=${displayId}`);
  }

  const deleted = Object.entries(state.deletedDisplays);
  if (deleted.length > 0) {
    lines.push('--- deleted displays ---');
    for (const [id, deletedAt] of deleted) {
      lines.push(`${id} (deletedAt=${deletedAt})`);
    }
  }

  displayUrlsEl.textContent = lines.join('\n');
}

function tierBadge(pageSettings) {
  const tier = Number(pageSettings?.tier ?? 1);
  return `Tier ${tier}`;
}

function tierOptions(selectedTier) {
  const values = Array.from(new Set([0, ...state.tierList])).sort((a, b) => a - b);
  return values.map((tier) => `<option value="${tier}" ${tier === selectedTier ? 'selected' : ''}>Tier ${tier}</option>`).join('');
}

function triggerSection(page, settings) {
  const trigger = settings.triggers || {};

  return `
    <details>
      <summary>Trigger Modes</summary>
      <details open>
        <summary>Time-based</summary>
        <label><input id="${pageControlId(page.id, 'trigger-time')}" type="checkbox" ${trigger.timeBased ? 'checked' : ''} /> Enabled</label>
        <div class="mono">Countdown preview: ${Math.round((settings.displayDurationMs || 0) / 1000)}s</div>
      </details>
      <details>
        <summary>Schedule-based</summary>
        <label><input id="${pageControlId(page.id, 'trigger-schedule')}" type="checkbox" ${trigger.scheduleBased ? 'checked' : ''} /> Enabled</label>
        <label>Schedule Event
          <select id="${pageControlId(page.id, 'schedule-event')}">
            <option value="classChange" ${trigger.scheduleEvent === 'classChange' ? 'selected' : ''}>classChange</option>
            <option value="passingPeriod" ${trigger.scheduleEvent === 'passingPeriod' ? 'selected' : ''}>passingPeriod</option>
            <option value="startOfDay" ${trigger.scheduleEvent === 'startOfDay' ? 'selected' : ''}>startOfDay</option>
          </select>
        </label>
        <div class="mono">Countdown preview: event-based</div>
      </details>
      <details>
        <summary>Weather-based</summary>
        <label><input id="${pageControlId(page.id, 'trigger-weather')}" type="checkbox" ${trigger.weatherBased ? 'checked' : ''} /> Enabled</label>
        <label>Weather Condition
          <select id="${pageControlId(page.id, 'weather-condition')}">
            <option value="any" ${trigger.weatherCondition === 'any' ? 'selected' : ''}>any</option>
            <option value="severe" ${trigger.weatherCondition === 'severe' ? 'selected' : ''}>severe</option>
            <option value="rain" ${trigger.weatherCondition === 'rain' ? 'selected' : ''}>rain</option>
          </select>
        </label>
        <div class="mono">Expiry preview: condition-based</div>
      </details>
      <details>
        <summary>Phase-based</summary>
        <label><input id="${pageControlId(page.id, 'trigger-phase')}" type="checkbox" ${trigger.phaseBased ? 'checked' : ''} /> Enabled</label>
        <label>Phase
          <select id="${pageControlId(page.id, 'phase')}">
            <option value="chapel" ${trigger.phase === 'chapel' ? 'selected' : ''}>chapel</option>
            <option value="assembly" ${trigger.phase === 'assembly' ? 'selected' : ''}>assembly</option>
            <option value="emergency" ${trigger.phase === 'emergency' ? 'selected' : ''}>emergency</option>
            <option value="lockdown" ${trigger.phase === 'lockdown' ? 'selected' : ''}>lockdown</option>
            <option value="fire-drill" ${trigger.phase === 'fire-drill' ? 'selected' : ''}>fire-drill</option>
          </select>
        </label>
        <div class="mono">Countdown preview: phase schedule</div>
      </details>
    </details>
  `;
}

function timeSettingsSection(page, settings) {
  const time = settings.timeSettings || {
    timeZone: 'UTC',
    useDaylightSavings: true,
    format: '24h',
    style: 'digital',
    showSeconds: true,
    leadingZero: true
  };

  return `
    <details open>
      <summary>Time Controls</summary>
      <label>Time Zone
        <select id="${pageControlId(page.id, 'tz')}">
          <option value="UTC" ${time.timeZone === 'UTC' ? 'selected' : ''}>UTC</option>
          <option value="America/New_York" ${time.timeZone === 'America/New_York' ? 'selected' : ''}>America/New_York</option>
          <option value="America/Chicago" ${time.timeZone === 'America/Chicago' ? 'selected' : ''}>America/Chicago</option>
          <option value="America/Denver" ${time.timeZone === 'America/Denver' ? 'selected' : ''}>America/Denver</option>
          <option value="America/Los_Angeles" ${time.timeZone === 'America/Los_Angeles' ? 'selected' : ''}>America/Los_Angeles</option>
        </select>
      </label>
      <label><input id="${pageControlId(page.id, 'dst')}" type="checkbox" ${time.useDaylightSavings ? 'checked' : ''} /> Use Daylight Savings</label>
      <label>Format
        <select id="${pageControlId(page.id, 'format')}">
          <option value="12h" ${time.format === '12h' ? 'selected' : ''}>12h</option>
          <option value="24h" ${time.format === '24h' ? 'selected' : ''}>24h</option>
        </select>
      </label>
      <label>Style
        <select id="${pageControlId(page.id, 'style')}">
          <option value="digital" ${time.style === 'digital' ? 'selected' : ''}>digital</option>
          <option value="analog" ${time.style === 'analog' ? 'selected' : ''}>analog</option>
        </select>
      </label>
      <label><input id="${pageControlId(page.id, 'show-seconds')}" type="checkbox" ${time.showSeconds !== false ? 'checked' : ''} /> showSeconds</label>
      <label><input id="${pageControlId(page.id, 'leading-zero')}" type="checkbox" ${time.leadingZero !== false ? 'checked' : ''} /> leadingZero</label>
    </details>
  `;
}

function weatherSettingsSection(page, settings) {
  const weather = settings.weatherSettings || { units: 'F', iconPack: 'default', severeWeatherOverride: true };
  return `
    <details open>
      <summary>Weather Controls</summary>
      <label>Units
        <select id="${pageControlId(page.id, 'weather-units')}">
          <option value="F" ${weather.units === 'F' ? 'selected' : ''}>F</option>
          <option value="C" ${weather.units === 'C' ? 'selected' : ''}>C</option>
        </select>
      </label>
      <label>Icon Pack
        <input id="${pageControlId(page.id, 'weather-icon-pack')}" type="text" value="${escapeHtml(weather.iconPack || 'default')}" />
      </label>
      <label><input id="${pageControlId(page.id, 'weather-override')}" type="checkbox" ${weather.severeWeatherOverride !== false ? 'checked' : ''} /> severeWeatherOverride</label>
    </details>
  `;
}

function customSettingsSection(page, settings) {
  const custom = settings.customSettings || { inlineCode: '', url: '', assetFolder: '' };
  return `
    <details open>
      <summary>Custom Controls</summary>
      <label>URL
        <input id="${pageControlId(page.id, 'custom-url')}" type="url" value="${escapeHtml(custom.url || '')}" placeholder="https://example.com/custom" />
      </label>
      <label>Inline Code
        <textarea id="${pageControlId(page.id, 'custom-inline')}" rows="5" class="mono">${escapeHtml(custom.inlineCode || '')}</textarea>
      </label>
      <label>Asset Folder
        <input id="${pageControlId(page.id, 'custom-assets')}" type="text" value="${escapeHtml(custom.assetFolder || '')}" placeholder="/content/assets" />
      </label>
    </details>
  `;
}

function emergencySection(page, settings) {
  const emergency = settings.emergencySettings || { severity: 'critical', overrideBehavior: 'suppress-all', expiryTime: '' };
  return `
    <details open>
      <summary>Emergency Controls</summary>
      <label>Expiry Time
        <input id="${pageControlId(page.id, 'emergency-expiry')}" type="datetime-local" value="${escapeHtml((emergency.expiryTime || '').slice(0, 16))}" />
      </label>
      <label>Severity
        <select id="${pageControlId(page.id, 'emergency-severity')}">
          <option value="low" ${emergency.severity === 'low' ? 'selected' : ''}>low</option>
          <option value="medium" ${emergency.severity === 'medium' ? 'selected' : ''}>medium</option>
          <option value="high" ${emergency.severity === 'high' ? 'selected' : ''}>high</option>
          <option value="critical" ${emergency.severity === 'critical' ? 'selected' : ''}>critical</option>
        </select>
      </label>
      <label>Override Behavior
        <select id="${pageControlId(page.id, 'emergency-override')}">
          <option value="suppress-all" ${emergency.overrideBehavior === 'suppress-all' ? 'selected' : ''}>suppress-all</option>
          <option value="tier-only" ${emergency.overrideBehavior === 'tier-only' ? 'selected' : ''}>tier-only</option>
        </select>
      </label>
    </details>
  `;
}

function renderPageCards(pages, settings) {
  const byId = settings?.pages || {};
  const showDeleted = showDeletedToggleEl.checked;

  const rendered = pages
    .map((page) => {
      const pageSettings = byId[page.id] || {
        id: page.id,
        name: page.name || page.id,
        type: page.type || 'custom',
        enabled: true,
        tier: page.id === 'emergency' ? 0 : 1,
        deleted: false,
        displayDurationMs: 30000,
        triggers: { timeBased: true, scheduleBased: false, weatherBased: false, phaseBased: false }
      };

      if (pageSettings.deleted && !showDeleted) {
        return '';
      }

      const lockedTierZero = Number(pageSettings.tier) === 0;

      return `
        <article class="page-card" data-page-id="${escapeHtml(page.id)}">
          <h3>${escapeHtml(page.name || page.id)} ${lockedTierZero ? '• Tier 0 Locked' : ''}</h3>
          <div class="mono">type: ${escapeHtml(page.type || pageSettings.type || 'custom')} • ${tierBadge(pageSettings)}</div>
          <label><input id="${pageControlId(page.id, 'enabled')}" type="checkbox" ${pageSettings.enabled ? 'checked' : ''} ${lockedTierZero ? 'disabled' : ''} /> enabled</label>
          <label>Tier
            <select id="${pageControlId(page.id, 'tier')}" ${lockedTierZero ? 'disabled' : ''}>
              ${tierOptions(Number(pageSettings.tier || 1))}
            </select>
          </label>
          <label>Display Duration
            <input id="${pageControlId(page.id, 'duration')}" type="range" min="5000" max="300000" step="1000" value="${Number(pageSettings.displayDurationMs || 30000)}" />
            <span id="${pageControlId(page.id, 'durationLabel')}" class="mono">${Math.round(Number(pageSettings.displayDurationMs || 30000) / 1000)}s</span>
          </label>
          ${triggerSection(page, pageSettings)}
          ${(page.type === 'time' || page.id === 'time') ? timeSettingsSection(page, pageSettings) : ''}
          {(page.type === 'weather' || page.id === 'weather') ? weatherSettingsSection(page, pageSettings) : ''}
          {(page.type === 'custom' || page.type === 'inline-code' || page.type === 'url') ? customSettingsSection(page, pageSettings) : ''}
          {(page.type === 'emergency' || page.id === 'emergency') ? emergencySection(page, pageSettings) : ''}
          <div class="row">
            <button data-action="save-page" data-page-id="${escapeHtml(page.id)}" type="button">Save Page</button>
            <button data-action="delete-page" data-page-id="${escapeHtml(page.id)}" type="button" ${lockedTierZero ? 'disabled' : ''}>Delete Page</button>
            <button data-action="restore-page" data-page-id="${escapeHtml(page.id)}" type="button">Restore Page</button>
          </div>
          ${pageSettings.deleted ? `<div class="mono">deletedAt=${escapeHtml(pageSettings.deletedAt || '')}</div>` : ''}
        </article>
      `;
    })
    .filter(Boolean)
    .join('');

  cardsEl.innerHTML = rendered;
}

function renderTierList() {
  const tierList = Array.isArray(state.tierList) ? state.tierList : [0, 1, 2, 3];
  tierListEl.innerHTML = tierList.map((tier, index) => {
    const locked = tier === 0;
    return `
      <li draggable="${locked ? 'false' : 'true'}" data-tier="${tier}" data-index="${index}" class="row">
        <span class="mono">Tier ${tier}${locked ? ' (Emergency Locked)' : ''}</span>
        <button data-action="move-tier-up" data-tier="${tier}" type="button" ${locked || index <= 1 ? 'disabled' : ''}>↑</button>
        <button data-action="move-tier-down" data-tier="${tier}" type="button" ${locked || index === tierList.length - 1 ? 'disabled' : ''}>↓</button>
        <button data-action="delete-tier" data-tier="${tier}" type="button" ${locked ? 'disabled' : ''}>Delete</button>
      </li>
    `;
  }).join('');
}

function readCheckbox(id) {
  const el = document.getElementById(id);
  return Boolean(el && el.checked);
}

function readValue(id, fallback = '') {
  const el = document.getElementById(id);
  return el ? String(el.value ?? fallback) : fallback;
}

function buildPagePatch(page) {
  const pageId = page.id;
  const tier = Number(readValue(pageControlId(pageId, 'tier'), '1'));

  const patch = {
    id: page.id,
    name: page.name || page.id,
    type: page.type || 'custom',
    displayId: state.displayId,
    enabled: readCheckbox(pageControlId(pageId, 'enabled')),
    tier,
    displayDurationMs: Number(readValue(pageControlId(pageId, 'duration'), '30000')),
    triggers: {
      timeBased: readCheckbox(pageControlId(pageId, 'trigger-time')),
      scheduleBased: readCheckbox(pageControlId(pageId, 'trigger-schedule')),
      weatherBased: readCheckbox(pageControlId(pageId, 'trigger-weather')),
      phaseBased: readCheckbox(pageControlId(pageId, 'trigger-phase')),
      scheduleEvent: readValue(pageControlId(pageId, 'schedule-event'), 'classChange'),
      weatherCondition: readValue(pageControlId(pageId, 'weather-condition'), 'any'),
      phase: readValue(pageControlId(pageId, 'phase'), 'assembly')
    }
  };

  if (page.type === 'time' || page.id === 'time') {
    patch.timeSettings = {
      timeZone: readValue(pageControlId(pageId, 'tz'), 'UTC'),
      useDaylightSavings: readCheckbox(pageControlId(pageId, 'dst')),
      format: readValue(pageControlId(pageId, 'format'), '24h'),
      style: readValue(pageControlId(pageId, 'style'), 'digital'),
      showSeconds: readCheckbox(pageControlId(pageId, 'show-seconds')),
      leadingZero: readCheckbox(pageControlId(pageId, 'leading-zero'))
    };
  }

  if (page.type === 'weather' || page.id === 'weather') {
    patch.weatherSettings = {
      units: readValue(pageControlId(pageId, 'weather-units'), 'F'),
      iconPack: readValue(pageControlId(pageId, 'weather-icon-pack'), 'default'),
      severeWeatherOverride: readCheckbox(pageControlId(pageId, 'weather-override'))
    };
  }

  if (page.type === 'custom' || page.type === 'inline-code' || page.type === 'url') {
    patch.customSettings = {
      url: readValue(pageControlId(pageId, 'custom-url'), ''),
      inlineCode: readValue(pageControlId(pageId, 'custom-inline'), ''),
      assetFolder: readValue(pageControlId(pageId, 'custom-assets'), '')
    };
  }

  if (page.type === 'emergency' || page.id === 'emergency') {
    const expiryInput = readValue(pageControlId(pageId, 'emergency-expiry'), '');
    patch.emergencySettings = {
      expiryTime: expiryInput ? new Date(expiryInput).toISOString() : undefined,
      severity: readValue(pageControlId(pageId, 'emergency-severity'), 'critical'),
      overrideBehavior: readValue(pageControlId(pageId, 'emergency-override'), 'suppress-all')
    };
  }

  return patch;
}

async function savePageCardById(pageId) {
  const page = state.pages.find((entry) => entry.id === pageId);
  if (!page) {
    throw new Error(`Unknown page ${pageId}`);
  }
  const patch = buildPagePatch(page);
  await csl('orchestrator.pageSettings.set', {
    displayId: state.displayId,
    pageId,
    patch
  });
}

async function setTierListPatch(patch) {
  await csl('orchestrator.tierList.set', {
    displayId: state.displayId,
    patch
  });
}

async function savePage() {
  const name = String(document.getElementById('newPageName').value || '').trim();
  const type = String(document.getElementById('newPageType').value || 'url');
  const url = String(document.getElementById('newPageUrl').value || '').trim();
  const code = String(document.getElementById('newPageCode').value || '').trim();

  const payload = { name, type, url, code, displayId: state.displayId };
  await csl('orchestrator.pages.add', payload);
  await refreshAll();
  setStatus(`Page created: ${name}`);
}

async function deletePage(pageId) {
  await csl('orchestrator.page.softDelete', { displayId: state.displayId, pageId });
  await refreshAll();
  setStatus(`Page soft-deleted: ${pageId}`);
}

async function restorePage(pageId) {
  await csl('orchestrator.page.restore', { displayId: state.displayId, pageId });
  await refreshAll();
  setStatus(`Page restored: ${pageId}`);
}

async function downloadSettings() {
  const response = await fetch(`/content/settings/download?displayId=${encodeURIComponent(state.displayId)}`, { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`settings download failed (${response.status})`);
  }

  const payload = await response.json();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `orchestrator-settings-${state.displayId}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setStatus('Settings download ready');
}

async function backupPages() {
  const response = await fetch('/content/pages/download-all', { cache: 'no-store' });
  if (!response.ok) {
    throw new Error(`pages backup failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `pages-backup-${state.displayId}.zip`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  setStatus('Pages backup ready');
}

async function restoreSettings() {
  const input = document.getElementById('restoreSettingsFile');
  const file = input.files?.[0];
  if (!file) {
    throw new Error('Select a restore settings file first');
  }

  const text = await file.text();
  const payload = JSON.parse(text);
  payload.displayId = state.displayId;

  const response = await fetch('/content/settings/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`settings restore failed (${response.status}): ${details}`);
  }

  await response.json();
  await refreshAll();
  setStatus('Settings restored');
}

async function refreshPreview() {
  if (window.renderRotationPreviewCard) {
    await window.renderRotationPreviewCard(state.displayId);
  }
}

async function changeDisplay(displayId) {
  state.displayId = String(displayId || 'hallway');
  await refreshAll();
}

function bindGlobalEvents() {
  cardsEl.addEventListener('input', async (event) => {
    const card = event.target.closest('.page-card');
    if (!card) return;
    const pageId = card.dataset.pageId;
    if (!pageId) return;

    if (event.target.id && event.target.id.endsWith('duration')) {
      const label = document.getElementById(pageControlId(pageId, 'durationLabel'));
      if (label) {
        label.textContent = `${Math.round(Number(event.target.value) / 1000)}s`;
      }
    }
  });

  cardsEl.addEventListener('click', async (event) => {
    const action = event.target.dataset.action;
    const pageId = event.target.dataset.pageId;
    if (!action || !pageId) return;

    try {
      if (action === 'save-page') {
        await savePageCardById(pageId);
        await refreshPreview();
        setStatus(`Saved ${pageId} settings`);
      }
      if (action === 'delete-page') {
        await deletePage(pageId);
      }
      if (action === 'restore-page') {
        await restorePage(pageId);
      }
    } catch (error) {
      setStatus(String(error));
    }
  });

  tierListEl.addEventListener('click', async (event) => {
    const action = event.target.dataset.action;
    const tier = Number(event.target.dataset.tier);
    if (!action || Number.isNaN(tier)) return;

    try {
      const current = [...state.tierList];
      const index = current.indexOf(tier);

      if (action === 'move-tier-up' && index > 1) {
        const next = [...current];
        next.splice(index, 1);
        next.splice(index - 1, 0, tier);
        await setTierListPatch({ tierList: next });
      }

      if (action === 'move-tier-down' && index > 0 && index < current.length - 1) {
        const next = [...current];
        next.splice(index, 1);
        next.splice(index + 1, 0, tier);
        await setTierListPatch({ tierList: next });
      }

      if (action === 'delete-tier' && tier !== 0) {
        await setTierListPatch({ deleteTier: tier, fallbackTier: 1 });
      }

      await refreshAll();
      setStatus(`Tier operation complete for tier ${tier}`);
    } catch (error) {
      setStatus(String(error));
    }
  });

  tierListEl.addEventListener('dragstart', (event) => {
    const li = event.target.closest('li[data-tier]');
    if (!li) return;
    event.dataTransfer?.setData('text/plain', li.dataset.tier);
  });

  tierListEl.addEventListener('dragover', (event) => {
    event.preventDefault();
  });

  tierListEl.addEventListener('drop', async (event) => {
    event.preventDefault();
    const sourceTier = Number(event.dataTransfer?.getData('text/plain'));
    const targetLi = event.target.closest('li[data-tier]');
    if (!targetLi || Number.isNaN(sourceTier)) return;

    const targetTier = Number(targetLi.dataset.tier);
    const next = state.tierList.filter((tier) => tier !== sourceTier);
    const targetIndex = next.indexOf(targetTier);
    const insertIndex = Math.max(1, targetIndex);
    next.splice(insertIndex, 0, sourceTier);

    try {
      await setTierListPatch({ tierList: next });
      await refreshAll();
      setStatus('Tier order updated');
    } catch (error) {
      setStatus(String(error));
    }
  });

  displaySelectorEl.addEventListener('change', async () => {
    try {
      await changeDisplay(displaySelectorEl.value);
    } catch (error) {
      setStatus(String(error));
    }
  });

  document.getElementById('showDeletedPages').addEventListener('change', () => {
    renderPageCards(state.pages, state.settings);
  });

  document.getElementById('addTier').addEventListener('click', async () => {
    try {
      const value = Number(document.getElementById('newTierValue').value);
      if (!Number.isInteger(value) || value <= 0) {
        throw new Error('Tier must be an integer > 0');
      }
      await setTierListPatch({ addTier: value });
      await refreshAll();
      setStatus(`Added tier ${value}`);
    } catch (error) {
      setStatus(String(error));
    }
  });

  document.getElementById('addDisplay').addEventListener('click', async () => {
    try {
      const displayId = String(document.getElementById('newDisplayId').value || '').trim();
      await csl('orchestrator.displays.add', { displayId });
      await refreshAll();
      setStatus(`Display added: ${displayId}`);
    } catch (error) {
      setStatus(String(error));
    }
  });

  document.getElementById('deleteDisplay').addEventListener('click', async () => {
    try {
      await csl('orchestrator.displays.delete', { displayId: state.displayId });
      state.displayId = 'hallway';
      await refreshAll();
      setStatus('Display deleted');
    } catch (error) {
      setStatus(String(error));
    }
  });

  document.getElementById('sharePlaylist').addEventListener('click', async () => {
    try {
      const sourceDisplayId = shareSourceDisplayEl.value;
      const targetDisplayId = shareTargetDisplayEl.value;
      await csl('orchestrator.displays.sharePlaylist', { sourceDisplayId, targetDisplayId });
      await refreshAll();
      setStatus(`Playlist shared ${sourceDisplayId} -> ${targetDisplayId}`);
    } catch (error) {
      setStatus(String(error));
    }
  });

  document.getElementById('refreshSettings').addEventListener('click', async () => {
    try {
      await refreshAll();
    } catch (error) {
      setStatus(String(error));
    }
  });

  document.getElementById('savePage').addEventListener('click', async () => {
    try {
      await savePage();
    } catch (error) {
      setStatus(String(error));
    }
  });

  document.getElementById('downloadSettings').addEventListener('click', async () => {
    try {
      await downloadSettings();
    } catch (error) {
      setStatus(String(error));
    }
  });

  document.getElementById('backupPages').addEventListener('click', async () => {
    try {
      await backupPages();
    } catch (error) {
      setStatus(String(error));
    }
  });

  document.getElementById('restoreSettings').addEventListener('click', async () => {
    try {
      await restoreSettings();
    } catch (error) {
      setStatus(String(error));
    }
  });
}

async function refreshAll() {
  setStatus('Loading...');
  const [displayRegistry, settings, pages, tierList] = await Promise.all([
    fetchDisplays(),
    fetchSettings(),
    fetchPages(),
    fetchTierList()
  ]);

  state.displays = displayRegistry.displays;
  state.deletedDisplays = displayRegistry.deletedDisplays;
  state.settings = settings;
  state.pages = pages;
  state.tierList = tierList;

  renderDisplayRegistry();
  renderTierList();
  renderPageCards(pages, settings);
  await refreshPreview();
  setStatus('Ready');
}

bindGlobalEvents();

window.addEventListener('load', () => {
  refreshAll().catch((error) => {
    setStatus(`Initial load error: ${String(error)}`);
  });
});
