'use strict';

const APP_CONFIG = {
  partnerName: 'My Love',
  senderName: 'Your favourite person',
  imageFileName: 'our-date-plan.png'
};

const screens = ['welcome', 'schedule', 'food', 'place', 'summary'];
const progressLabels = ['Invitation', 'Date & time', 'Food', 'Place', 'Our date'];
const progressValues = [8, 28, 52, 76, 100];

const timeOptions = ['12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'];
const foodOptions = [
  { id: 'pizza', icon: '🍕', label: 'Pizza', note: 'Cheesy and cosy' },
  { id: 'sushi', icon: '🍣', label: 'Sushi', note: 'A little fancy' },
  { id: 'burgers', icon: '🍔', label: 'Burgers', note: 'Fun and casual' },
  { id: 'pasta', icon: '🍝', label: 'Pasta', note: 'Classic date-night' },
  { id: 'biryani', icon: '🍛', label: 'Biryani', note: 'Rich and comforting' },
  { id: 'kacchi', icon: '🥘', label: 'Kacchi', note: 'A proper feast' },
  { id: 'dessert', icon: '🍰', label: 'Dessert & coffee', note: 'Sweet like us' },
  { id: 'custom', icon: '✨', label: 'Something else', note: 'Your craving wins' }
];

const placeOptions = [
  { id: 'rooftop', icon: '🌆', label: 'Rooftop dinner', note: 'City lights and us' },
  { id: 'cafe', icon: '☕', label: 'Cosy café', note: 'Long talks, warm drinks' },
  { id: 'restaurant', icon: '🍽️', label: 'Beautiful restaurant', note: 'Dress up a little' },
  { id: 'lakeside', icon: '🌙', label: 'Lakeside evening', note: 'A walk before dinner' },
  { id: 'movie', icon: '🎬', label: 'Movie & dinner', note: 'Two plans in one' },
  { id: 'surprise', icon: '🎁', label: 'Surprise me', note: 'You choose the secret' },
  { id: 'home', icon: '🕯️', label: 'Candlelight at home', note: 'Private and peaceful' },
  { id: 'custom', icon: '📍', label: 'Another place', note: 'Write your own' }
];

const today = startOfDay(new Date());
const state = {
  step: 0,
  selectedDate: null,
  selectedTime: '',
  selectedFood: null,
  customFood: '',
  selectedPlace: null,
  customPlace: '',
  calendarCursor: new Date(today.getFullYear(), today.getMonth(), 1)
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

const calendarGrid = $('#calendarGrid');
const calendarMonth = $('#calendarMonth');
const previousMonthButton = $('#previousMonth');
const nextMonthButton = $('#nextMonth');
const timePills = $('#timePills');
const customTime = $('#customTime');
const scheduleNext = $('#scheduleNext');
const foodNext = $('#foodNext');
const placeNext = $('#placeNext');
const schedulePreview = $('#schedulePreview');
const toast = $('#toast');
let toastTimer;

function startOfDay(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function sameDay(a, b) {
  return Boolean(a && b) && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDate(date, style = 'long') {
  if (!date) return '—';
  const options = style === 'long'
    ? { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' }
    : { month: 'short', day: 'numeric', year: 'numeric' };
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

function formatTimeFrom24(value) {
  if (!value) return '';
  const [hours, minutes] = value.split(':').map(Number);
  const date = new Date(2000, 0, 1, hours, minutes);
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(date);
}

function goToStep(step) {
  const bounded = Math.min(Math.max(step, 0), screens.length - 1);
  state.step = bounded;
  $$('.screen').forEach(screen => screen.classList.toggle('active', screen.dataset.screen === screens[bounded]));
  $('#progressLabel').textContent = progressLabels[bounded];
  $('#progressBar').style.width = `${progressValues[bounded]}%`;
  document.title = bounded === 4 ? 'It’s a date! 💗' : 'Our Date 💗';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  saveState();
}

function saveState() {
  const serializable = {
    ...state,
    selectedDate: state.selectedDate ? state.selectedDate.toISOString() : null,
    calendarCursor: state.calendarCursor.toISOString()
  };
  try {
    localStorage.setItem('romanticDatePlan', JSON.stringify(serializable));
  } catch (_) {
    // Storage can be unavailable when the file is opened from a restricted context.
  }
}

function restoreState() {
  try {
    const stored = JSON.parse(localStorage.getItem('romanticDatePlan'));
    if (!stored) return;
    state.selectedDate = stored.selectedDate ? new Date(stored.selectedDate) : null;
    if (state.selectedDate && state.selectedDate < today) state.selectedDate = null;
    state.selectedTime = stored.selectedTime || '';
    state.selectedFood = stored.selectedFood || null;
    state.customFood = stored.customFood || '';
    state.selectedPlace = stored.selectedPlace || null;
    state.customPlace = stored.customPlace || '';
    state.calendarCursor = stored.calendarCursor ? new Date(stored.calendarCursor) : new Date(today.getFullYear(), today.getMonth(), 1);
    state.step = Number.isInteger(stored.step) ? Math.min(Math.max(stored.step, 0), 4) : 0;
  } catch (error) {
    console.warn('Could not restore the previous plan.', error);
  }
}

function renderCalendar() {
  calendarGrid.replaceChildren();
  const year = state.calendarCursor.getFullYear();
  const month = state.calendarCursor.getMonth();
  calendarMonth.textContent = new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(state.calendarCursor);

  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let i = 0; i < firstWeekday; i += 1) {
    const blank = document.createElement('span');
    blank.className = 'date-cell empty';
    calendarGrid.append(blank);
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'date-cell';
    button.textContent = String(day);
    button.dataset.date = date.toISOString();
    button.setAttribute('role', 'gridcell');
    button.setAttribute('aria-label', formatDate(date));
    if (date < today) button.disabled = true;
    if (sameDay(date, today)) button.classList.add('today');
    if (sameDay(date, state.selectedDate)) {
      button.classList.add('selected');
      button.setAttribute('aria-selected', 'true');
    }
    calendarGrid.append(button);
  }

  const firstAllowedMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  previousMonthButton.disabled = state.calendarCursor <= firstAllowedMonth;
}

function renderTimes() {
  timePills.replaceChildren();
  timeOptions.forEach(time => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'time-pill';
    button.textContent = time;
    button.dataset.time = time;
    if (state.selectedTime === time) button.classList.add('selected');
    timePills.append(button);
  });
}

function renderOptionGrid(container, options, selected, type) {
  container.replaceChildren();
  options.forEach(option => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'option-card';
    button.dataset.optionId = option.id;
    button.dataset.optionType = type;
    if (selected?.id === option.id) button.classList.add('selected');
    button.innerHTML = `
      <span class="option-emoji" aria-hidden="true">${option.icon}</span>
      <strong>${escapeHtml(option.label)}</strong>
      <small>${escapeHtml(option.note)}</small>
    `;
    button.setAttribute('aria-pressed', selected?.id === option.id ? 'true' : 'false');
    container.append(button);
  });
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}

function updateScheduleUI() {
  renderCalendar();
  renderTimes();
  const ready = Boolean(state.selectedDate && state.selectedTime);
  scheduleNext.disabled = !ready;
  if (ready) {
    schedulePreview.innerHTML = `<span>💗</span><p><strong>${escapeHtml(formatDate(state.selectedDate, 'short'))}</strong> at <strong>${escapeHtml(state.selectedTime)}</strong> sounds perfect.</p>`;
  } else {
    schedulePreview.innerHTML = '<span>📅</span><p>Choose a date and time to continue.</p>';
  }
  saveState();
}

function getFoodLabel() {
  if (!state.selectedFood) return '';
  return state.selectedFood.id === 'custom' ? state.customFood.trim() : state.selectedFood.label;
}

function getPlaceLabel() {
  if (!state.selectedPlace) return '';
  return state.selectedPlace.id === 'custom' ? state.customPlace.trim() : state.selectedPlace.label;
}

function updateFoodUI() {
  renderOptionGrid($('#foodGrid'), foodOptions, state.selectedFood, 'food');
  const isCustom = state.selectedFood?.id === 'custom';
  $('#customFoodWrap').classList.toggle('hidden', !isCustom);
  $('#customFood').value = state.customFood;
  foodNext.disabled = !state.selectedFood || (isCustom && !state.customFood.trim());
  saveState();
}

function updatePlaceUI() {
  renderOptionGrid($('#placeGrid'), placeOptions, state.selectedPlace, 'place');
  const isCustom = state.selectedPlace?.id === 'custom';
  $('#customPlaceWrap').classList.toggle('hidden', !isCustom);
  $('#customPlace').value = state.customPlace;
  placeNext.disabled = !state.selectedPlace || (isCustom && !state.customPlace.trim());
  saveState();
}

function renderSummary() {
  $('#summaryDate').textContent = formatDate(state.selectedDate);
  $('#summaryTime').textContent = state.selectedTime || '—';
  $('#summaryFood').textContent = getFoodLabel() || '—';
  $('#summaryPlace').textContent = getPlaceLabel() || '—';
  $('#summaryFoodIcon').textContent = state.selectedFood?.icon || '🍽️';
  $('#summaryPlaceIcon').textContent = state.selectedPlace?.icon || '📍';
  createCelebration();
}

function buildSummaryText() {
  return [
    '💗 IT’S A DATE! 💗',
    `📅 ${formatDate(state.selectedDate)}`,
    `⏰ ${state.selectedTime}`,
    `${state.selectedFood?.icon || '🍽️'} ${getFoodLabel()}`,
    `${state.selectedPlace?.icon || '📍'} ${getPlaceLabel()}`,
    '',
    'I cannot wait to make this memory with you. ♥'
  ].join('\n');
}

async function copySummary() {
  const text = buildSummaryText();
  try {
    await navigator.clipboard.writeText(text);
    showToast('Date details copied to the clipboard.');
  } catch (_) {
    const area = document.createElement('textarea');
    area.value = text;
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.append(area);
    area.select();
    document.execCommand('copy');
    area.remove();
    showToast('Date details copied to the clipboard.');
  }
}

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function wrapCanvasText(ctx, text, x, y, maxWidth, lineHeight, maxLines = 2) {
  const words = String(text).split(/\s+/);
  const lines = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
      if (lines.length === maxLines - 1) break;
    } else {
      line = test;
    }
  }
  const consumed = lines.join(' ').split(/\s+/).filter(Boolean).length;
  if (lines.length === maxLines - 1 && consumed < words.length) {
    let last = words.slice(consumed).join(' ');
    while (ctx.measureText(`${last}…`).width > maxWidth && last.length > 1) last = last.slice(0, -1);
    lines.push(`${last}…`);
  } else if (line) {
    lines.push(line);
  }
  lines.slice(0, maxLines).forEach((entry, index) => ctx.fillText(entry, x, y + index * lineHeight));
}

function renderShareCanvas() {
  const canvas = $('#shareCanvas');
  const ctx = canvas.getContext('2d');
  const w = canvas.width;
  const h = canvas.height;

  const gradient = ctx.createLinearGradient(0, 0, w, h);
  gradient.addColorStop(0, '#fffaf7');
  gradient.addColorStop(0.52, '#f8dce7');
  gradient.addColorStop(1, '#e9b4c8');
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, w, h);

  const glow = ctx.createRadialGradient(900, 160, 0, 900, 160, 480);
  glow.addColorStop(0, 'rgba(255,255,255,0.94)');
  glow.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.fillStyle = '#b83268';
  ctx.font = '280px Georgia';
  ctx.fillText('♥', 790, 245);
  ctx.fillText('♥', -40, 1330);
  ctx.restore();

  ctx.save();
  ctx.shadowColor = 'rgba(86,26,50,0.17)';
  ctx.shadowBlur = 46;
  ctx.shadowOffsetY = 20;
  roundedRect(ctx, 90, 90, 900, 1170, 48);
  ctx.fillStyle = 'rgba(255,255,255,0.88)';
  ctx.fill();
  ctx.restore();

  ctx.fillStyle = '#b83268';
  ctx.textAlign = 'center';
  ctx.font = '700 27px Arial';
  ctx.fillText('OUR PLAN IS OFFICIAL', w / 2, 190);

  ctx.fillStyle = '#74233f';
  ctx.font = '64px Georgia';
  ctx.fillText('Yay! It’s a date.', w / 2, 280);

  ctx.fillStyle = '#7a6470';
  ctx.font = '28px Arial';
  ctx.fillText('One beautiful memory, already in the making.', w / 2, 334);

  const rows = [
    { icon: '📅', label: 'DATE', value: formatDate(state.selectedDate) },
    { icon: '⏰', label: 'TIME', value: state.selectedTime },
    { icon: state.selectedFood?.icon || '🍽️', label: 'FOOD', value: getFoodLabel() },
    { icon: state.selectedPlace?.icon || '📍', label: 'PLACE', value: getPlaceLabel() }
  ];

  rows.forEach((row, index) => {
    const x = 155;
    const y = 395 + index * 155;
    const width = 770;
    const height = 125;
    roundedRect(ctx, x, y, width, height, 25);
    ctx.fillStyle = index % 2 === 0 ? '#fff8fb' : '#fffdfb';
    ctx.fill();
    ctx.strokeStyle = 'rgba(116,35,63,0.12)';
    ctx.lineWidth = 2;
    ctx.stroke();

    roundedRect(ctx, x + 22, y + 24, 78, 78, 22);
    ctx.fillStyle = '#f8dce7';
    ctx.fill();
    ctx.font = '42px Arial';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#321f29';
    ctx.fillText(row.icon, x + 61, y + 76);

    ctx.textAlign = 'left';
    ctx.fillStyle = '#a24b70';
    ctx.font = '700 21px Arial';
    ctx.fillText(row.label, x + 125, y + 48);

    ctx.fillStyle = '#74233f';
    ctx.font = '700 30px Arial';
    wrapCanvasText(ctx, row.value, x + 125, y + 86, 610, 35, 2);
  });

  ctx.textAlign = 'center';
  ctx.fillStyle = '#74233f';
  ctx.font = 'italic 31px Georgia';
  ctx.fillText('“All I need is you, a little time,', w / 2, 1075);
  ctx.fillText('and one lovely memory together.”', w / 2, 1118);
  ctx.fillStyle = '#b83268';
  ctx.font = 'italic 27px Georgia';
  ctx.fillText('With love, always ♥', w / 2, 1190);

  ctx.fillStyle = 'rgba(116,35,63,0.65)';
  ctx.font = '700 18px Arial';
  ctx.fillText('MADE WITH LOVE', w / 2, 1310);
  return canvas;
}

function canvasToBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error('Could not create the image.')), 'image/png', 1);
  });
}

async function createShareFile() {
  const canvas = renderShareCanvas();
  const blob = await canvasToBlob(canvas);
  return new File([blob], APP_CONFIG.imageFileName, { type: 'image/png' });
}

async function downloadImage(silent = false) {
  try {
    const file = await createShareFile();
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = file.name;
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
    if (!silent) showToast('Your date card image has been saved.');
  } catch (error) {
    console.error(error);
    showToast('The image could not be created in this browser.');
  }
}

async function shareImage(target) {
  try {
    const file = await createShareFile();
    const shareData = {
      title: 'Our date plan 💗',
      text: buildSummaryText(),
      files: [file]
    };

    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share(shareData);
      showToast(`Share sheet opened—choose ${target}.`);
      return;
    }

    await downloadImage(true);
    fallbackOpenTarget(target);
    showToast(`Image saved. Attach it in ${target}.`);
  } catch (error) {
    if (error?.name === 'AbortError') return;
    console.error(error);
    await downloadImage(true);
    fallbackOpenTarget(target);
    showToast(`Image saved. Attach it in ${target}.`);
  }
}

function fallbackOpenTarget(target) {
  const text = encodeURIComponent(buildSummaryText());
  const currentUrl = encodeURIComponent(location.href);
  let url = '';
  switch (target) {
    case 'WhatsApp':
      url = `https://wa.me/?text=${text}`;
      break;
    case 'Facebook':
      url = `https://www.facebook.com/sharer/sharer.php?u=${currentUrl}&quote=${text}`;
      break;
    case 'Messenger':
      url = `fb-messenger://share/?link=${currentUrl}`;
      break;
    case 'Messages':
      url = `sms:?&body=${text}`;
      break;
    case 'Instagram':
      url = 'instagram://app';
      break;
    default:
      return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

function createCelebration() {
  const field = $('#petalField');
  for (let i = 0; i < 34; i += 1) {
    const petal = document.createElement('span');
    petal.className = 'petal';
    petal.textContent = i % 3 === 0 ? '♥' : '✿';
    petal.style.left = `${Math.random() * 100}%`;
    petal.style.setProperty('--drift', `${Math.random() * 180 - 90}px`);
    petal.style.animationDuration = `${4.4 + Math.random() * 4}s`;
    petal.style.animationDelay = `${Math.random() * 1.4}s`;
    petal.style.color = i % 3 === 0 ? '#c54172' : '#eaa2bd';
    field.append(petal);
    setTimeout(() => petal.remove(), 9500);
  }
}

function showToast(message) {
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('show');
  toastTimer = setTimeout(() => toast.classList.remove('show'), 3200);
}

function selectOption(type, id) {
  if (type === 'food') {
    state.selectedFood = foodOptions.find(item => item.id === id) || null;
    if (id !== 'custom') state.customFood = '';
    updateFoodUI();
    if (id === 'custom') setTimeout(() => $('#customFood').focus(), 100);
  } else {
    state.selectedPlace = placeOptions.find(item => item.id === id) || null;
    if (id !== 'custom') state.customPlace = '';
    updatePlaceUI();
    if (id === 'custom') setTimeout(() => $('#customPlace').focus(), 100);
  }
}

function validatePlan() {
  return Boolean(state.selectedDate && state.selectedTime && getFoodLabel() && getPlaceLabel());
}

function resetPlan() {
  try { localStorage.removeItem('romanticDatePlan'); } catch (_) {}
  state.step = 0;
  state.selectedDate = null;
  state.selectedTime = '';
  state.selectedFood = null;
  state.customFood = '';
  state.selectedPlace = null;
  state.customPlace = '';
  state.calendarCursor = new Date(today.getFullYear(), today.getMonth(), 1);
  customTime.value = '';
  updateScheduleUI();
  updateFoodUI();
  updatePlaceUI();
  goToStep(0);
}

function handleAction(action) {
  switch (action) {
    case 'go-home':
      goToStep(0);
      break;
    case 'say-yes':
      goToStep(1);
      break;
    case 'back':
      goToStep(state.step - 1);
      break;
    case 'next-food':
      if (state.selectedDate && state.selectedTime) goToStep(2);
      break;
    case 'next-place':
      if (getFoodLabel()) goToStep(3);
      break;
    case 'show-summary':
      if (validatePlan()) {
        renderSummary();
        goToStep(4);
      }
      break;
    case 'copy-summary':
      copySummary();
      break;
    case 'download-image':
      downloadImage();
      break;
    case 'edit-plan':
      goToStep(1);
      break;
    case 'start-over':
      resetPlan();
      break;
    default:
      break;
  }
}

document.addEventListener('click', event => {
  const actionButton = event.target.closest('[data-action]');
  if (actionButton) handleAction(actionButton.dataset.action);

  const dateButton = event.target.closest('[data-date]');
  if (dateButton && !dateButton.disabled) {
    state.selectedDate = new Date(dateButton.dataset.date);
    updateScheduleUI();
  }

  const timeButton = event.target.closest('[data-time]');
  if (timeButton) {
    state.selectedTime = timeButton.dataset.time;
    customTime.value = '';
    updateScheduleUI();
  }

  const optionButton = event.target.closest('[data-option-id]');
  if (optionButton) selectOption(optionButton.dataset.optionType, optionButton.dataset.optionId);

  const shareButton = event.target.closest('[data-share]');
  if (shareButton) shareImage(shareButton.dataset.share);
});

previousMonthButton.addEventListener('click', () => {
  state.calendarCursor = new Date(state.calendarCursor.getFullYear(), state.calendarCursor.getMonth() - 1, 1);
  renderCalendar();
  saveState();
});

nextMonthButton.addEventListener('click', () => {
  state.calendarCursor = new Date(state.calendarCursor.getFullYear(), state.calendarCursor.getMonth() + 1, 1);
  renderCalendar();
  saveState();
});

customTime.addEventListener('input', event => {
  state.selectedTime = formatTimeFrom24(event.target.value);
  updateScheduleUI();
});

$('#customFood').addEventListener('input', event => {
  state.customFood = event.target.value;
  updateFoodUI();
});

$('#customPlace').addEventListener('input', event => {
  state.customPlace = event.target.value;
  updatePlaceUI();
});

restoreState();
updateScheduleUI();
updateFoodUI();
updatePlaceUI();
if (state.step === 4 && !validatePlan()) state.step = 0;
if (state.step === 4) renderSummary();
goToStep(state.step);

if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}
