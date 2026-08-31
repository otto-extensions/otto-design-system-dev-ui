const statusEl = document.getElementById('status');
const previewEl = document.getElementById('rotationPreview');
const intervalEl = document.getElementById('rotationIntervalMs');
const rotationValueEl = document.getElementById('rotation-value');

async function traceDebugCommand(command, status, details, payload) {
  try {
    await fetch('/csl/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'debug.trace.command',
        payload: {
          command,
          status,
          details,
          payload
        }
      })
    });
  } catch {
    // Do not throw from tracing paths.
  }
}

async function traceDebugApi(method, route, statusCode, details) {
  try {
    await fetch('/csl/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command: 'debug.trace.api',
        payload: {
          method,
          route,
          statusCode,
          details
        }
      })
    });
  } catch {
    // Do not throw from tracing paths.
  }
}

function setStatus(message) {
  statusEl.textContent = message;
}

function getEnabledPages() {
  return [
    document.getElementById('pageHallway').checked ? 'hallway' : null,
    document.getElementById('pageWeather').checked ? 'weather' : null,
    document.getElementById('pageTime').checked ? 'time' : null
  ].filter(Boolean);
}

function render(settings) {
  document.getElementById('pageHallway').checked = settings.enabledPages.includes('hallway');
  document.getElementById('pageWeather').checked = settings.enabledPages.includes('weather');
  document.getElementById('pageTime').checked = settings.enabledPages.includes('time');

  intervalEl.value = String(settings.rotationIntervalMs);
  rotationValueEl.textContent = `${Math.round(settings.rotationIntervalMs / 1000)} seconds`;
  document.getElementById('rotationMode').value = settings.rotationMode;

  document.getElementById('weatherSevere').checked = settings.weatherTriggers.severeWeather;
  document.getElementById('weatherTempThreshold').value = String(settings.weatherTriggers.tempThreshold);

  document.getElementById('scheduleClassChange').checked = settings.scheduleTriggers.classChange;
  document.getElementById('schedulePassingPeriod').checked = settings.scheduleTriggers.passingPeriod;

  document.getElementById('phaseChapel').checked = settings.phaseTriggers.chapel;
  document.getElementById('phaseAssembly').checked = settings.phaseTriggers.assembly;
  document.getElementById('phaseEmergency').checked = settings.phaseTriggers.emergency;
}

function collectPatch() {
  return {
    enabledPages: getEnabledPages(),
    rotationIntervalMs: Number(intervalEl.value),
    rotationMode: document.getElementById('rotationMode').value,
    weatherTriggers: {
      severeWeather: document.getElementById('weatherSevere').checked,
      tempThreshold: Number(document.getElementById('weatherTempThreshold').value)
    },
    scheduleTriggers: {
      classChange: document.getElementById('scheduleClassChange').checked,
      passingPeriod: document.getElementById('schedulePassingPeriod').checked
    },
    phaseTriggers: {
      chapel: document.getElementById('phaseChapel').checked,
      assembly: document.getElementById('phaseAssembly').checked,
      emergency: document.getElementById('phaseEmergency').checked
    }
  };
}

async function fetchSettings() {
  const response = await fetch('/csl/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'orchestrator.settings.get', payload: {} })
  });
  await traceDebugApi('POST', '/csl/command', response.status, 'orchestrator.settings.get');
  if (!response.ok) throw new Error(`settings load failed (${response.status})`);
  return response.json();
}

async function fetchRotationPlan() {
  const response = await fetch('/csl/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command: 'orchestrator.rotation.plan.get', payload: {} })
  });
  await traceDebugApi('POST', '/csl/command', response.status, 'orchestrator.rotation.plan.get');
  if (!response.ok) throw new Error(`rotation plan failed (${response.status})`);
  return response.json();
}

async function renderRotationPreview(plan) {
  if (!plan || !plan.pages) {
    previewEl.textContent = 'No rotation plan available';
    return;
  }

  const pagesList = plan.pages
    .map((p, i) => `  ${i + 1}. ${p.id} (${p.label})`)
    .join('\n');

  const preview = [
    `Generated: ${new Date(plan.generatedAt).toLocaleTimeString()}`,
    `Mode: ${plan.rotationMode}`,
    `Interval: ${Math.round(plan.rotationIntervalMs / 1000)}s`,
    `Pages (${plan.pages.length}):`,
    pagesList,
    ''
  ].join('\n');

  previewEl.textContent = preview;
}

async function saveSettings() {
  try {
    const patch = collectPatch();
    
    if (patch.enabledPages.length === 0) {
      throw new Error('At least one page must be enabled');
    }

    setStatus('Saving...');
    await traceDebugCommand('orchestrator.settings.set', 'start', 'save settings initiated', patch);

    const settingsResult = await fetch('/csl/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command: 'orchestrator.settings.set', payload: { patch } })
    });
    await traceDebugApi('POST', '/csl/command', settingsResult.status, 'orchestrator.settings.set request');
    
    if (!settingsResult.ok) {
      const errBody = await settingsResult.text();
      await traceDebugCommand('orchestrator.settings.set', 'error', errBody, patch);
      throw new Error(`save failed (${settingsResult.status}): ${errBody}`);
    }

    const settings = await settingsResult.json();
    
    // Trigger orchestrator recompile lifecycle after settings save
    try {
      const recompileResult = await fetch('/csl/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command: 'orchestrator.settings.list', payload: {} })
      });
      await traceDebugApi('POST', '/csl/command', recompileResult.status, 'orchestrator.settings.list post-save refresh');
    } catch (e) {
      await traceDebugCommand('orchestrator.settings.list', 'error', String(e));
    }

    render(settings);
    await refreshPreview();
    await traceDebugCommand('orchestrator.settings.set', 'ok', 'save settings completed');
    setStatus(`Saved at ${new Date().toLocaleTimeString()}`);
  } catch (error) {
    const msg = String(error);
    await traceDebugCommand('orchestrator.settings.set', 'error', msg);
    setStatus(`Error: ${msg}`);
  }
}

async function savePage() {
  const name = String(document.getElementById('newPageName').value || '').trim();
  const type = String(document.getElementById('newPageType').value || 'url');
  const url = String(document.getElementById('newPageUrl').value || '').trim();
  const code = String(document.getElementById('newPageCode').value || '').trim();

  await traceDebugCommand('orchestrator.pages.add', 'start', 'add page initiated', { name, type });

  const response = await fetch('/csl/command', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      command: 'orchestrator.pages.add',
      payload: { name, type, url, code }
    })
  });
  await traceDebugApi('POST', '/csl/command', response.status, 'orchestrator.pages.add');

  if (!response.ok) {
    const details = await response.text();
    await traceDebugCommand('orchestrator.pages.add', 'error', details);
    throw new Error(`page save failed (${response.status}): ${details}`);
  }

  const result = await response.json();
  await traceDebugCommand('orchestrator.pages.add', 'ok', 'page added', result);
  setStatus(`Page saved: ${result.id}`);
  await refreshPreview();
}

async function downloadSettings() {
  const response = await fetch('/content/settings/download', { cache: 'no-store' });
  await traceDebugApi('GET', '/content/settings/download', response.status, 'download settings');
  if (!response.ok) {
    throw new Error(`settings download failed (${response.status})`);
  }

  const payload = await response.json();
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  
  // Use a more reliable download method
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'orchestrator-settings-download.json');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  
  // Trigger the download
  setTimeout(() => {
    link.click();
  }, 0);
  
  // Cleanup after download
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
  
  setStatus('Settings download ready');
}

async function backupPages() {
  const response = await fetch('/content/pages/download-all', { cache: 'no-store' });
  await traceDebugApi('GET', '/content/pages/download-all', response.status, 'backup pages');
  if (!response.ok) {
    throw new Error(`pages backup failed (${response.status})`);
  }

  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'pages-backup.zip');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  
  // Trigger the download
  setTimeout(() => {
    link.click();
  }, 0);
  
  // Cleanup after download
  setTimeout(() => {
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 100);
  
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

  const response = await fetch('/content/settings/restore', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  await traceDebugApi('POST', '/content/settings/restore', response.status, 'restore settings');

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`settings restore failed (${response.status}): ${details}`);
  }

  await response.json();
  await refreshAll();
  setStatus('Settings restored');
}

async function refreshPreview() {
  try {
    const plan = await fetchRotationPlan();
    await renderRotationPreview(plan);
  } catch (error) {
    const details = String(error);
    await traceDebugCommand('orchestrator.preview.refresh', 'error', details);
    previewEl.textContent = `Error loading preview: ${details}`;
  }
}

async function refreshAll() {
  try {
    setStatus('Loading...');
    const settings = await fetchSettings();
    render(settings);
    await refreshPreview();
    await traceDebugCommand('orchestrator.settings.refresh', 'ok', 'settings view loaded');
    setStatus('Ready');
  } catch (error) {
    const msg = String(error);
    await traceDebugCommand('orchestrator.settings.refresh', 'error', msg);
    setStatus(`Error: ${msg}`);
  }
}

// Debounce timer for auto-saving settings on multiple changes
let saveDebounceTimer;
function scheduleAutoSave() {
  clearTimeout(saveDebounceTimer);
  saveDebounceTimer = setTimeout(() => {
    saveSettings().catch(error => {
      const msg = String(error);
      setStatus(`Auto-save error: ${msg}`);
    });
  }, 300);
}

// Event listeners
intervalEl.addEventListener('input', () => {
  rotationValueEl.textContent = `${Math.round(Number(intervalEl.value) / 1000)} seconds`;
  scheduleAutoSave();
});

// Auto-save when page toggles change
document.getElementById('pageHallway').addEventListener('change', scheduleAutoSave);
document.getElementById('pageWeather').addEventListener('change', scheduleAutoSave);
document.getElementById('pageTime').addEventListener('change', scheduleAutoSave);

// Auto-save when rotation mode changes
document.getElementById('rotationMode').addEventListener('change', scheduleAutoSave);

// Auto-save when weather triggers change
document.getElementById('weatherSevere').addEventListener('change', scheduleAutoSave);
document.getElementById('weatherTempThreshold').addEventListener('change', scheduleAutoSave);

// Auto-save when schedule triggers change
document.getElementById('scheduleClassChange').addEventListener('change', scheduleAutoSave);
document.getElementById('schedulePassingPeriod').addEventListener('change', scheduleAutoSave);

// Auto-save when phase triggers change
document.getElementById('phaseChapel').addEventListener('change', scheduleAutoSave);
document.getElementById('phaseAssembly').addEventListener('change', scheduleAutoSave);
document.getElementById('phaseEmergency').addEventListener('change', scheduleAutoSave);

document.getElementById('saveSettings').addEventListener('click', async () => {
  await saveSettings();
});

document.getElementById('refreshSettings').addEventListener('click', async () => {
  await refreshAll();
});

document.getElementById('savePage').addEventListener('click', async () => {
  try {
    await savePage();
  } catch (error) {
    const msg = String(error);
    await traceDebugCommand('orchestrator.pages.add', 'error', msg);
    setStatus(`Error: ${msg}`);
  }
});

document.getElementById('downloadSettings').addEventListener('click', async () => {
  try {
    await downloadSettings();
  } catch (error) {
    const msg = String(error);
    await traceDebugCommand('orchestrator.settings.download', 'error', msg);
    setStatus(`Error: ${msg}`);
  }
});

document.getElementById('backupPages').addEventListener('click', async () => {
  try {
    await backupPages();
  } catch (error) {
    const msg = String(error);
    await traceDebugCommand('orchestrator.pages.download-all', 'error', msg);
    setStatus(`Error: ${msg}`);
  }
});

document.getElementById('restoreSettings').addEventListener('click', async () => {
  try {
    await restoreSettings();
  } catch (error) {
    const msg = String(error);
    await traceDebugCommand('orchestrator.settings.restore', 'error', msg);
    setStatus(`Error: ${msg}`);
  }
});

// Initial load
window.addEventListener('load', () => {
  refreshAll().catch(async (error) => {
    const msg = String(error);
    await traceDebugCommand('orchestrator.settings.initial-load', 'error', msg);
    setStatus(`Initial load error: ${msg}`);
  });
});
