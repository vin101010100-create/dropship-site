// Shared frontend logic for the dropshipping catalog
// Works both inside Telegram WebApp and in a regular browser.

const API_URL = ''; // Relative URLs because frontend and API are served from the same origin
const CART_KEY = 'dropship_cart';

// --------------------------------------------------
// Telegram WebApp integration
// --------------------------------------------------

let telegramInitData = '';
let telegramUser = null;

function initTelegram() {
    // Check if the page is running inside Telegram WebApp
    if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
        const tg = window.Telegram.WebApp;
        tg.ready();
        tg.expand();

        // Store initData so it can be sent with API requests
        telegramInitData = tg.initData || '';

        // Parse user info if available
        if (tg.initDataUnsafe && tg.initDataUnsafe.user) {
            telegramUser = tg.initDataUnsafe.user;
        }

        console.log('Telegram WebApp initialized');
    } else {
        console.log('Running in regular browser');
    }
}

// Build headers for API requests, including Telegram init data when available
function apiHeaders() {
    const headers = {
        'Content-Type': 'application/json'
    };
    if (telegramInitData) {
        headers['X-Telegram-Init-Data'] = telegramInitData;
    }
    return headers;
}

// --------------------------------------------------
// Cart helpers (uses localStorage)
// --------------------------------------------------

function getCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch (e) {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    updateCartCount();
}

function addToCart(product) {
    const cart = getCart();
    // Avoid duplicates for this MVP
    if (!cart.find(item => item.id === product.id)) {
        cart.push(product);
        saveCart(cart);
    }
}

function removeFromCart(productId) {
    const cart = getCart().filter(item => item.id !== productId);
    saveCart(cart);
}

function clearCart() {
    localStorage.removeItem(CART_KEY);
    updateCartCount();
}

function updateCartCount() {
    const countEl = document.getElementById('cart-count');
    if (countEl) {
        countEl.textContent = getCart().length;
    }
}

// --------------------------------------------------
// API helpers
// --------------------------------------------------

async function fetchProducts() {
    const response = await fetch(`${API_URL}/api/products`);
    if (!response.ok) throw new Error('Failed to load products');
    return response.json();
}

async function fetchProduct(id) {
    const response = await fetch(`${API_URL}/api/products/${id}`);
    if (!response.ok) throw new Error('Failed to load product');
    return response.json();
}

async function placeOrder(orderData) {
    const response = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: apiHeaders(),
        body: JSON.stringify(orderData)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Failed to place order');
    return data;
}

// --------------------------------------------------
// Catalog page (index.html)
// --------------------------------------------------

async function renderCatalog() {
    const container = document.getElementById('product-grid');
    if (!container) return;

    try {
        const products = await fetchProducts();
        container.innerHTML = products.map(product => `
            <div class="card product-card" data-id="${product.id}">
                <img src="${product.image_url}" alt="${product.name}" class="product-image">
                <div class="product-info">
                    <h3 class="product-name">${product.name}</h3>
                    <p class="product-price">$${product.price.toFixed(2)}</p>
                    <p class="product-description">${product.description}</p>
                    <button class="btn btn-primary btn-block add-to-cart-btn" data-id="${product.id}">
                        Add to Cart
                    </button>
                </div>
            </div>
        `).join('');

        // Open product details when clicking a card (but not the button)
        container.querySelectorAll('.product-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('add-to-cart-btn')) {
                    openProductModal(card.dataset.id);
                }
            });
        });

        // Add to cart buttons
        container.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const product = await fetchProduct(btn.dataset.id);
                addToCart(product);
                btn.textContent = 'Added ✓';
                setTimeout(() => (btn.textContent = 'Add to Cart'), 1200);
            });
        });
    } catch (error) {
        console.error(error);
        container.innerHTML = `<div class="alert alert-error">Could not load products. Please try again later.</div>`;
    }
}

// --------------------------------------------------
// Product details modal
// --------------------------------------------------

async function openProductModal(productId) {
    const modal = document.getElementById('product-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    try {
        const product = await fetchProduct(productId);
        body.innerHTML = `
            <img src="${product.image_url}" alt="${product.name}" class="product-image mb-16">
            <h2>${product.name}</h2>
            <p class="product-price">$${product.price.toFixed(2)}</p>
            <p>${product.description}</p>
            <p><strong>Category:</strong> ${product.category}</p>
        `;

        const addBtn = document.getElementById('modal-add-to-cart');
        addBtn.onclick = () => {
            addToCart(product);
            closeProductModal();
        };

        modal.classList.add('active');
    } catch (error) {
        console.error(error);
    }
}

function closeProductModal() {
    const modal = document.getElementById('product-modal');
    if (modal) modal.classList.remove('active');
}

// --------------------------------------------------
// Cart page (cart.html)
// --------------------------------------------------

function renderCart() {
    const container = document.getElementById('cart-items');
    if (!container) return;

    const cart = getCart();

    if (cart.length === 0) {
        container.innerHTML = `
            <div class="cart-empty">
                <p>Your cart is empty.</p>
                <a href="index.html" class="btn btn-primary mt-16">Back to Catalog</a>
            </div>
        `;
        return;
    }

    container.innerHTML = cart.map(item => `
        <div class="cart-item" data-id="${item.id}">
            <img src="${item.image_url}" alt="${item.name}">
            <div class="cart-item-info">
                <p class="cart-item-name">${item.name}</p>
                <p class="cart-item-price">$${item.price.toFixed(2)}</p>
            </div>
            <button class="btn btn-danger remove-item-btn" data-id="${item.id}">Remove</button>
        </div>
    `).join('');

    container.querySelectorAll('.remove-item-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            removeFromCart(Number(btn.dataset.id));
            renderCart();
        });
    });
}

function initCartForm() {
    const form = document.getElementById('order-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const cart = getCart();
        if (cart.length === 0) {
            showMessage('Your cart is empty.', 'error');
            return;
        }

        const customerName = document.getElementById('customer-name').value.trim();
        const phone = document.getElementById('customer-phone').value.trim();
        const address = document.getElementById('customer-address').value.trim();

        if (!customerName || !phone || !address) {
            showMessage('Please fill in all fields.', 'error');
            return;
        }

        // For the MVP, place one order per cart item
        try {
            const results = [];
            for (const item of cart) {
                const order = await placeOrder({
                    product_id: item.id,
                    customer_name: customerName,
                    phone: phone,
                    address: address
                });
                results.push(order);
            }

            clearCart();
            renderCart();
            form.reset();

            const orderIds = results.map(r => `#${r.id}`).join(', ');
            showMessage(`Order placed successfully! Order ID(s): ${orderIds}`, 'success');

            // Close WebApp after a short delay if inside Telegram
            if (typeof window.Telegram !== 'undefined' && window.Telegram.WebApp) {
                setTimeout(() => window.Telegram.WebApp.close(), 2500);
            }
        } catch (error) {
            console.error(error);
            showMessage(error.message || 'Failed to place order. Please try again.', 'error');
        }
    });
}

function showMessage(text, type) {
    const el = document.getElementById('message');
    if (!el) return;
    el.className = `alert alert-${type}`;
    el.textContent = text;
    el.style.display = 'block';
}

// --------------------------------------------------
// Initialize on page load
// --------------------------------------------------

document.addEventListener('DOMContentLoaded', () => {
    initTelegram();
    updateCartCount();
    renderCatalog();
    renderCart();
    initCartForm();

    // Modal close buttons
    document.getElementById('modal-close')?.addEventListener('click', closeProductModal);
    document.getElementById('modal-cancel')?.addEventListener('click', closeProductModal);
    document.getElementById('product-modal')?.addEventListener('click', (e) => {
        if (e.target.id === 'product-modal') closeProductModal();
    });
});
