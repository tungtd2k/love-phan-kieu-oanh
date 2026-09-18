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

yesButton.addEventListener('click', showPlan);

let moveCount = 0;
let isJumping = false;
const escapePositions = [
  'translate(118px, -30px) rotate(-5deg)',
  'translate(-92px, 26px) rotate(4deg)',
  'translate(72px, 40px) rotate(-3deg)',
];

function runNextJump() {
  if (moveCount >= 3) {
    isJumping = false;
    moveCount = 4;
    maybeButton.textContent = 'Dạ kó';
    maybeButton.style.transform = 'none';
    return;
  }
  moveCount += 1;
  maybeButton.style.transform = escapePositions[moveCount - 1];
  maybeButton.textContent = ['Ơ, bắt hụt rồi 😳', 'Né nhẹ thôi nha 🙈', 'Đừng để anh chờ lâu nhé 🥺'][moveCount - 1];
  window.setTimeout(runNextJump, 430);
}

maybeButton.addEventListener('pointerenter', () => {
  if (isJumping) return;
  if (moveCount < 3) {
    isJumping = true;
    runNextJump();
  }
});
maybeButton.addEventListener('click', () => { if (moveCount >= 4) showPlan(); });

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
  const bookingText = `Ngày: ${formatVietnameseDate(selectedDate)}\nGiờ: ${timeInput.value}\nMón: ${selectedFood}`;
  bookingSummary.innerHTML = `<div>📅 <strong>${formatVietnameseDate(selectedDate)}</strong></div><div>⏰ ${timeInput.value}</div><div>🍽️ <strong>${selectedFood}</strong></div>`;
  confirmButton.disabled = true;
  planScreen.hidden = true;
  finalScreen.hidden = false;
  finalScreen.dataset.booking = bookingText;
  sendButton.disabled = false;
  sendStatus.textContent = '';
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

sendButton.addEventListener('click', async () => {
  const booking = finalScreen.dataset.booking;
  if (!booking || sendButton.disabled) return;

  sendButton.disabled = true;
  sendStatus.textContent = 'Đang gửi lựa chọn của em...';
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${resultRecipient}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: 'Có người vừa chốt kèo hẹn hò 💗',
        _template: 'table',
        _captcha: 'false',
        ket_qua_lua_chon: booking,
      }),
    });
    if (!response.ok) throw new Error('send_failed');
    sendStatus.textContent = 'Đã gửi lựa chọn thành công rồi nha 💗';
  } catch {
    sendButton.disabled = false;
    sendStatus.textContent = 'Chưa gửi được tự động. Em bấm nút sao chép để gửi lại cho anh nha 💕';
  }
});

copyButton.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(finalScreen.dataset.booking || 'Đã chốt kèo với Phan Kiều Oanh 💗');
    copyStatus.textContent = 'Đã sao chép lựa chọn. Bạn có thể dán gửi qua nơi muốn nhận.';
  } catch {
    copyStatus.textContent = 'Bạn có thể chụp màn hình màn này để gửi lại nha 💕';
  }
});

renderCalendar();
