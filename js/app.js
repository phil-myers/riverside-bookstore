const books = [
  {
    id: 1,
    title: 'The River House',
    author: 'Clara Bennett',
    category: 'fiction',
    price: 18.99,
    rating: 4.8,
    description: 'A moving story about family, memory, and the quiet power of home.',
    accent: 'Fiction'
  },
  {
    id: 2,
    title: 'Night Signals',
    author: 'Marcus Vale',
    category: 'mystery',
    price: 16.5,
    rating: 4.7,
    description: 'A tense investigation that follows the last train home and one missing witness.',
    accent: 'Mystery'
  },
  {
    id: 3,
    title: 'The Quiet Mind',
    author: 'Ariana Cole',
    category: 'nonfiction',
    price: 21.0,
    rating: 4.9,
    description: 'Practical guidance for building calm, clarity, and healthier daily rituals.',
    accent: 'Nonfiction'
  },
  {
    id: 4,
    title: 'Moonbeam Market',
    author: 'Lena Hart',
    category: 'children',
    price: 14.75,
    rating: 4.6,
    description: 'A warm story of friendship, imagination, and a secret Saturday market.',
    accent: 'Children'
  },
  {
    id: 5,
    title: 'Planet in Motion',
    author: 'Dr. Theo Martin',
    category: 'science',
    price: 24.25,
    rating: 4.9,
    description: 'An engaging look at the systems that shape our planet and our future.',
    accent: 'Science'
  },
  {
    id: 6,
    title: 'Paper Lanterns',
    author: 'Nora Ives',
    category: 'fiction',
    price: 17.25,
    rating: 4.7,
    description: 'A lyrical novel about second chances and the stories we carry across cities.',
    accent: 'Fiction'
  }
];

const cart = [];

const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const booksGrid = document.getElementById('booksGrid');
const resultCount = document.getElementById('resultCount');
const cartItems = document.getElementById('cartItems');
const cartCount = document.getElementById('cart-count');
const subtotalEl = document.getElementById('subtotal');
const shippingEl = document.getElementById('shipping');
const totalEl = document.getElementById('total');
const cartBadge = document.getElementById('cartBadge');
const checkoutBtn = document.getElementById('checkoutBtn');

function formatPrice(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
}

function getVisibleBooks() {
  const query = searchInput.value.trim().toLowerCase();
  const category = categoryFilter.value;

  return books.filter((book) => {
    const matchesSearch =
      !query ||
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query);

    const matchesCategory = category === 'all' || book.category === category;

    return matchesSearch && matchesCategory;
  });
}

function renderBooks() {
  const visibleBooks = getVisibleBooks();

  resultCount.textContent = `${visibleBooks.length} book${visibleBooks.length === 1 ? '' : 's'}`;

  if (!visibleBooks.length) {
    booksGrid.innerHTML = `
      <div class="empty-state">
        <h4>No books match your search.</h4>
        <p>Try another title, author, or category.</p>
      </div>
    `;
    return;
  }

  booksGrid.innerHTML = visibleBooks
    .map(
      (book) => `
        <article class="book-card">
          <div class="book-cover">
            <span>${book.accent}</span>
            <strong>${book.title}</strong>
          </div>
          <div class="book-info">
            <div class="book-topline">
              <h4>${book.title}</h4>
              <span class="rating">★ ${book.rating}</span>
            </div>
            <p class="author">by ${book.author}</p>
            <p class="book-description">${book.description}</p>
            <div class="book-footer">
              <span class="price">${formatPrice(book.price)}</span>
              <button type="button" class="add-btn" data-id="${book.id}">Add to cart</button>
            </div>
          </div>
        </article>
      `
    )
    .join('');

  booksGrid.querySelectorAll('.add-btn').forEach((button) => {
    button.addEventListener('click', () => addToCart(Number(button.dataset.id)));
  });
}

function addToCart(bookId) {
  const existing = cart.find((item) => item.id === bookId);

  if (existing) {
    existing.quantity += 1;
  } else {
    const book = books.find((entry) => entry.id === bookId);
    if (!book) return;
    cart.push({ id: book.id, title: book.title, price: book.price, quantity: 1 });
  }

  renderCart();
}

function removeFromCart(bookId) {
  const index = cart.findIndex((item) => item.id === bookId);
  if (index === -1) return;

  cart.splice(index, 1);
  renderCart();
}

function getCartTotals() {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = cart.length ? 6.5 : 0;
  const total = subtotal + shipping;
  return { subtotal, shipping, total };
}

function renderCart() {
  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const { subtotal, shipping, total } = getCartTotals();

  cartCount.textContent = String(totalItems);
  cartBadge.textContent = `${totalItems} item${totalItems === 1 ? '' : 's'}`;
  subtotalEl.textContent = formatPrice(subtotal);
  shippingEl.textContent = formatPrice(shipping);
  totalEl.textContent = formatPrice(total);

  if (!cart.length) {
    cartItems.innerHTML = '<li class="empty-cart">Your cart is empty.</li>';
    return;
  }

  cartItems.innerHTML = cart
    .map(
      (item) => `
        <li class="cart-item">
          <div>
            <strong>${item.title}</strong>
            <div class="cart-meta">Qty: ${item.quantity} · ${formatPrice(item.price)}</div>
          </div>
          <button type="button" data-remove-id="${item.id}">Remove</button>
        </li>
      `
    )
    .join('');

  cartItems.querySelectorAll('[data-remove-id]').forEach((button) => {
    button.addEventListener('click', () => removeFromCart(Number(button.dataset.removeId)));
  });
}

searchInput.addEventListener('input', renderBooks);
categoryFilter.addEventListener('change', renderBooks);

checkoutBtn.addEventListener('click', () => {
  if (!cart.length) {
    alert('Your cart is empty. Add a few books before checkout.');
    return;
  }

  alert('Thank you for shopping at Riverside Bookstore!');
});

renderBooks();
renderCart();
