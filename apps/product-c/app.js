const faqQuestions = [
  'What are your store hours?',
  'How do I track my order?',
  'Do you offer pickup?',
  'Do you deliver?',
  'Do you have recommendations for new readers?',
  'Can I return a book for an exchange?'
];

const quickPrompts = [
  'Order status',
  'Store hours',
  'Book recommendation',
  'Delivery options',
  'Return for exchange'
];

const faqAnswers = {
  'What are your store hours?':
    'Riverside Books is open Monday–Saturday from 9:00 AM to 7:00 PM and Sunday from 10:00 AM to 4:00 PM.',
  'How do I track my order?':
    'Once your order ships, you will receive a confirmation email with a tracking link. If you still need help, email support@riversidebooks.com.',
  'Do you offer pickup?':
    'Yes. You can choose in-store pickup at checkout. We will email you when your order is ready to pick up.',
  'Do you deliver?':
    'Yes. We offer local delivery within Riverside city limits for qualifying orders. Delivery fees and timing depend on your address and order size.',
  'Do you have recommendations for new readers?':
    'Absolutely. Try The River House for a warm character-driven novel or The Quiet Mind for a thoughtful nonfiction read.',
  'Can I return a book for an exchange?':
    'Yes. Please bring the book and your receipt to the register within 30 days. We can exchange it for another title or store credit if the item is in good condition.'
};

const chatMessages = document.getElementById('chatMessages');
const chatForm = document.getElementById('chatForm');
const userInput = document.getElementById('userInput');
const faqList = document.getElementById('faqList');
const quickPromptsEl = document.getElementById('quickPrompts');

function addMessage(text, sender = 'bot') {
  const messageEl = document.createElement('div');
  messageEl.className = `message message--${sender}`;

  const textEl = document.createElement('p');
  textEl.textContent = text;
  messageEl.appendChild(textEl);
  chatMessages.appendChild(messageEl);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getResponseFromKeywords(question) {
  const normalized = question.trim().toLowerCase();

  if (!normalized) {
    return 'Please ask a question about your order, pickup, store hours, or book recommendations.';
  }

  if (normalized.includes('hour') || normalized.includes('open') || normalized.includes('closed')) {
    return faqAnswers['What are your store hours?'];
  }

  if (normalized.includes('track') || normalized.includes('ship') || normalized.includes('status') || normalized.includes('order')) {
    return faqAnswers['How do I track my order?'];
  }

  if (normalized.includes('pickup') || normalized.includes('collect') || normalized.includes('pick up')) {
    return faqAnswers['Do you offer pickup?'];
  }

  if (normalized.includes('deliver') || normalized.includes('delivery') || normalized.includes('shipping')) {
    return faqAnswers['Do you deliver?'];
  }

  if (normalized.includes('recommend') || normalized.includes('read') || normalized.includes('book')) {
    return faqAnswers['Do you have recommendations for new readers?'];
  }

  if (normalized.includes('return') || normalized.includes('exchange') || normalized.includes('damaged') || normalized.includes('broken')) {
    return faqAnswers['Can I return a book for an exchange?'];
  }

  if (normalized.includes('hello') || normalized.includes('hi') || normalized.includes('hey')) {
    return 'Hi there! I can help with order status, pickup, store hours, returns, and recommendations.';
  }

  return 'I can help with order tracking, pickup, exchanges, store hours, and reading suggestions. Try asking me one of those questions.';
}

function renderFaq() {
  faqList.innerHTML = '';

  faqQuestions.forEach((question) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'faq-item';
    button.textContent = question;
    button.addEventListener('click', () => {
      userInput.value = question;
      userInput.focus();
      chatForm.dispatchEvent(new Event('submit'));
    });
    faqList.appendChild(button);
  });
}

function renderQuickPrompts() {
  quickPromptsEl.innerHTML = '';

  quickPrompts.forEach((prompt) => {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'quick-chip';
    button.textContent = prompt;
    button.addEventListener('click', () => {
      userInput.value = prompt;
      userInput.focus();
      chatForm.dispatchEvent(new Event('submit'));
    });
    quickPromptsEl.appendChild(button);
  });
}

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();
  const question = userInput.value.trim();

  if (!question) return;

  addMessage(question, 'user');
  userInput.value = '';

  const response = getResponseFromKeywords(question);
  setTimeout(() => addMessage(response, 'bot'), 260);
});

renderFaq();
renderQuickPrompts();
