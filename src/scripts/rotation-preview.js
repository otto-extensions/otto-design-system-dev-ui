const previewCardEl = document.getElementById('rotationPreviewCard');

function formatCountdown(ms) {
  const seconds = Math.max(0, Math.ceil(Number(ms || 0) / 1000));
  if (seconds < 60) {
    return `${seconds}s`;
  }
  const minutes = Math.floor(seconds / 60);
  const rem = seconds % 60;
  return `${minutes}m ${rem}s`;
}

function deriveReason(plan) {
  if (plan?.triggerReason) {
    return plan.triggerReason;
  }
  return 'Waiting for time duration';
}

function formatMaybe(value, fallback = 'n/a') {
  return value === undefined || value === null || value === '' ? fallback : String(value);
}

export async function renderRotationPreviewCard(displayId = 'hallway') {
  if (!previewCardEl) return;

  try {
    const response = await fetch(`/content/rotation.json?displayId=${encodeURIComponent(displayId)}`, { cache: 'no-store' });
    if (!response.ok) {
      throw new Error(`rotation preview failed (${response.status})`);
    }

    const plan = await response.json();
    const current = plan.currentPage;
    const next = plan.nextPage;
    const countdown = formatCountdown(current?.countdownMs ?? plan.countdownMs ?? 0);
    const reason = deriveReason(plan);

    previewCardEl.innerHTML = [
      `<div><span class="preview-highlight">Display:</span> ${formatMaybe(plan.displayId)}</div>`,
      `<div><span class="preview-highlight">Current Page:</span> ${current?.name || current?.id || 'n/a'}</div>`,
      `<div><span class="preview-highlight">Next Page:</span> ${next?.name || next?.id || 'n/a'}</div>`,
      `<div><span class="preview-highlight">Current Tier:</span> ${formatMaybe(plan.currentTier)}</div>`,
      `<div><span class="preview-highlight">Next Tier:</span> ${formatMaybe(plan.nextTier)}</div>`,
      `<div><span class="preview-highlight">Reason:</span> ${reason}</div>`,
      `<div><span class="preview-highlight">Countdown:</span> ${countdown}</div>`,
      `<div><span class="preview-highlight">Expiry:</span> ${formatMaybe(plan.expiry)}</div>`,
      `<div><span class="preview-highlight">Bumped By:</span> ${formatMaybe(plan.bumpedBy)}</div>`
    ].join('');
  } catch (error) {
    previewCardEl.textContent = `Preview error: ${String(error)}`;
  }
}

if (typeof window !== 'undefined') {
  window.renderRotationPreviewCard = renderRotationPreviewCard;
  setInterval(() => {
    const displayId = document.getElementById('displaySelector')?.value || 'hallway';
    renderRotationPreviewCard(displayId).catch(() => {});
  }, 1000);
}
