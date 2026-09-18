const introScreen = document.querySelector('#introScreen');
const planScreen = document.querySelector('#planScreen');
const finalScreen = document.querySelector('#finalScreen');
const yesButton = document.querySelector('#yesButton');
const maybeButton = document.querySelector('#maybeButton');
const timeInput = document.querySelector('#timeInput');
const calendarGrid = document.querySelector('#calendarGrid');
const monthLabel = document.querySelector('#monthLabel');
const prevMonth = document.querySelector('#prevMonth');
const nextMonth = document.querySelector('#nextMonth');
const foodCards = [...document.querySelectorAll('.food-card')];
const confirmButton = document.querySelector('#confirmButton');
const errorMessage = document.querySelector('#errorMessage');
const bookingSummary = document.querySelector('#bookingSummary');
const copyButton = document.querySelector('#copyButton');
const copyStatus = document.querySelector('#copyStatus');
const sendButton = document.querySelector('#sendButton');
const sendStatus = document.querySelector('#sendStatus');

const resultRecipient = 'tientungdotwice@gmail.com';

const now = new Date();
const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
let calendarMonth = new Date(today.getFullYear(), today.getMonth(), 1);
let selectedDate = new Date(today);
let selectedFood = '';
let initialChoice = '';
let interactionLog = [];
let visitNotificationSent = false;
let visitNotificationInFlight = false;

try {
  interactionLog = JSON.parse(sessionStorage.getItem('love-oanh-interactions') || '[]');
  initialChoice = sessionStorage.getItem('love-oanh-initial-choice') || '';
  visitNotificationSent = sessionStorage.getItem('love-oanh-visit-notified') === '1';
} catch {
  interactionLog = [];
}

async function sendVisitNotification(type, choice) {
  if (visitNotificationSent || visitNotificationInFlight) return;
  visitNotificationInFlight = true;
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${resultRecipient}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'Có người vừa vào trang của bạn 💌',
        _template: 'table',
        _captcha: 'false',
        thong_bao: 'Có người vừa mở trang và bắt đầu tương tác.',
        thao_tac_dau_tien: type,
        nut_dau_tien: choice,
        thoi_gian: new Date().toLocaleString('vi-VN'),
      }),
    });
    if (!response.ok) throw new Error('visit_notification_failed');
    visitNotificationSent = true;
    try {
      sessionStorage.setItem('love-oanh-visit-notified', '1');
    } catch {
      // The in-memory flag still prevents duplicate notifications in this visit.
    }
  } catch {
    // The booking flow should continue even if the optional visit notice fails.
  } finally {
    visitNotificationInFlight = false;
  }
}

function recordInteraction(type, choice) {
  const event = { type, choice, at: new Date().toISOString() };
  interactionLog.push(event);
  void sendVisitNotification(type, choice);
  try {
    sessionStorage.setItem('love-oanh-interactions', JSON.stringify(interactionLog));
  } catch {
    // Tracking is optional; the booking can still be completed if storage is blocked.
  }
}

function rememberInitialChoice(choice) {
  if (initialChoice) return;
  initialChoice = choice;
  try {
    sessionStorage.setItem('love-oanh-initial-choice', initialChoice);
  } catch {
    // Tracking is optional; the booking can still be completed if storage is blocked.
  }
}

function interactionSummary() {
  const firstChoice = initialChoice || 'Chưa xác định';
  const events = interactionLog.length
    ? interactionLog.map((event) => `${event.type}: ${event.choice} (${event.at})`).join('\n')
    : 'Chưa ghi nhận được thao tác hover.';
  return `Lựa chọn ban đầu: ${firstChoice}\nNhật ký thao tác:\n${events}`;
}

function formatVietnameseDate(date) {
  return new Intl.DateTimeFormat('vi-VN', { weekday: 'long', day: 'numeric', month: 'numeric', year: 'numeric' }).format(date);
}

function renderCalendar() {
  const year = calendarMonth.getFullYear();
  const month = calendarMonth.getMonth();
  monthLabel.textContent = new Intl.DateTimeFormat('vi-VN', { month: 'long', year: 'numeric' }).format(calendarMonth);
  prevMonth.disabled = year === today.getFullYear() && month === today.getMonth();
  calendarGrid.innerHTML = '';
  const firstDay = new Date(year, month, 1).getDay();
  const leadingBlanks = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < leadingBlanks; i += 1) {
    const blank = document.createElement('span');
    blank.className = 'calendar-day empty';
    calendarGrid.append(blank);
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  for (let day = 1; day <= daysInMonth; day += 1) {
    const date = new Date(year, month, day);
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'calendar-day';
    button.textContent = day;
    button.disabled = date < today;
    if (date.toDateString() === selectedDate.toDateString()) button.classList.add('selected');
    button.addEventListener('click', () => { selectedDate = date; renderCalendar(); errorMessage.textContent = ''; });
    calendarGrid.append(button);
  }
}

function showPlan() {
  introScreen.hidden = true;
  finalScreen.hidden = true;
  planScreen.hidden = false;
  window.scrollTo({ top: 0, behavior: 'smooth' });
  renderCalendar();
}

yesButton.addEventListener('pointerenter', () => {
  rememberInitialChoice('Dạ có 💖');
  recordInteraction('hover', 'Dạ có 💖');
});
yesButton.addEventListener('click', () => {
  rememberInitialChoice('Dạ có 💖');
  recordInteraction('click', 'Dạ có 💖');
  showPlan();
});

let moveCount = 0;
let skipClickAfterTouch = false;
const escapePositions = [
  'translate(118px, -30px) rotate(-5deg)',
  'translate(-92px, 26px) rotate(4deg)',
  'translate(72px, 40px) rotate(-3deg)',
];

function advanceMaybeButton(eventType) {
  const currentLabel = maybeButton.textContent;
  rememberInitialChoice('Em suy nghĩ đã');
  recordInteraction(eventType, currentLabel);
  if (moveCount >= 4) return;
  moveCount += 1;
  if (moveCount <= 3) {
    maybeButton.style.transform = escapePositions[moveCount - 1];
    maybeButton.textContent = moveCount === 3 ? 'đồng ý đi mà' : 'Em suy nghĩ đã';
    return;
  }
  maybeButton.style.transform = 'none';
  maybeButton.textContent = 'Dạ kó';
}

maybeButton.addEventListener('mouseenter', () => {
  advanceMaybeButton('hover');
});
maybeButton.addEventListener('touchstart', (event) => {
  event.preventDefault();
  skipClickAfterTouch = true;
  if (moveCount >= 4) {
    rememberInitialChoice('Em suy nghĩ đã');
    recordInteraction('tap', maybeButton.textContent);
    showPlan();
    return;
  }
  advanceMaybeButton('tap');
}, { passive: false });
maybeButton.addEventListener('click', () => {
  if (skipClickAfterTouch) {
    skipClickAfterTouch = false;
    return;
  }
  rememberInitialChoice('Em suy nghĩ đã');
  recordInteraction('click', maybeButton.textContent);
  if (moveCount >= 4) showPlan();
});

prevMonth.addEventListener('click', () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1); renderCalendar(); });
nextMonth.addEventListener('click', () => { calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1); renderCalendar(); });

foodCards.forEach((card) => card.addEventListener('click', () => {
  foodCards.forEach((item) => { item.classList.remove('selected'); item.setAttribute('aria-pressed', 'false'); });
  card.classList.add('selected');
  card.setAttribute('aria-pressed', 'true');
  selectedFood = card.dataset.food;
  errorMessage.textContent = '';
}));

confirmButton.addEventListener('click', () => {
  if (!selectedDate || !timeInput.value || !selectedFood) {
    errorMessage.textContent = 'Em chọn ngày, giờ và một món nha 💕';
    return;
  }
  const bookingText = `Ngày: ${formatVietnameseDate(selectedDate)}\nGiờ: ${timeInput.value}\nMón: ${selectedFood}\n\n${interactionSummary()}`;
  bookingSummary.innerHTML = `<div>📅 <strong>${formatVietnameseDate(selectedDate)}</strong></div><div>⏰ ${timeInput.value}</div><div>🍽️ <strong>${selectedFood}</strong></div>`;
  confirmButton.disabled = true;
  planScreen.hidden = true;
  finalScreen.hidden = false;
  finalScreen.dataset.booking = bookingText;
  sendButton.disabled = false;
  sendStatus.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
  void sendBookingEmail();
});

async function sendBookingEmail() {
  const booking = finalScreen.dataset.booking;
  if (!booking || sendButton.disabled) return;

  sendButton.disabled = true;
  sendStatus.textContent = 'Đang gửi lựa chọn của em...';
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${resultRecipient}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'Có người vừa xác nhận lựa chọn hẹn hò 💗',
        _template: 'table',
        _captcha: 'false',
        ket_qua_lua_chon: booking,
      }),
    });
    if (!response.ok) throw new Error('send_failed');
    sendStatus.textContent = 'Đã gửi lựa chọn thành công rồi nha 💗';
  } catch {
    sendButton.disabled = false;
    sendButton.textContent = 'Gửi lại lựa chọn cho anh 💌';
    sendStatus.textContent = 'Chưa gửi được tự động. Em bấm nút sao chép để gửi lại cho anh nha 💕';
  }
}

sendButton.addEventListener('click', sendBookingEmail);

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(finalScreen.dataset.booking || 'Đã chốt kèo với Phan Kiều Oanh 💗');
    copyStatus.textContent = 'Đã sao chép lựa chọn. Bạn có thể dán gửi qua nơi muốn nhận.';
  } catch {
    copyStatus.textContent = 'Bạn có thể chụp màn hình màn này để gửi lại nha 💕';
  }
});

renderCalendar();

