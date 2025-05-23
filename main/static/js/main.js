document.addEventListener("DOMContentLoaded", function () {
    // Инициализация навигации и оверлеев
    const currentPath = window.location.pathname;
    console.log('DOM loaded on', currentPath);

    initNavigation(currentPath);
    initOverlays();

    // Фильтр каталога
    if (document.getElementById('categoryFilter')) {
        initCatalogFilter();
    }

    // Центрирование контента относительно экрана
    if (document.getElementById('catalogContent')) {
        centerContent();
        window.addEventListener("resize", centerContent);
    }

    // Добавление в корзину на странице товара
    const addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function (e) {
            e.preventDefault();
            const item = {
                id: parseInt(this.dataset.id, 10),
                title: this.dataset.title,
                price: parseInt(this.dataset.price, 10),
                image: this.dataset.image,
                qty: 1
            };
            addToCart(item);
            console.log(`"${item.title}" добавлен(а) в корзину`);
        });
    }

    // Обновляем счётчик товаров в корзине
    updateCartBadge();
});

function initNavigation(currentPath) {
    const navItems = {
        '/catalog/': 'КАТАЛОГ',
        '/collections/': 'коллекции',
        '/about/': 'о нас'
    };

    const domItems = Array.from(document.querySelectorAll('.nav-cell'));
    domItems.forEach(item => {
        item.classList.remove('active');
        item.style.backgroundColor = '';
    });

    for (const [path, title] of Object.entries(navItems)) {  // ✅ Исправлено: )) -> )
        if (currentPath === path) {
            const navItem = domItems.find(el => el.textContent.includes(title));
            if (navItem) {
                navItem.classList.add('active');
                navItem.style.backgroundColor = '#FFE778';
            }
        }
    }
}

// =================== CATALOG FILTER ===================
function initCatalogFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'all';
    const filterSelect = document.getElementById('categoryFilter');
    if (filterSelect) {
        filterSelect.value = category;
        filterSelect.addEventListener('change', function () {
            window.location.href = `/catalog/?category=${this.value}`;
        });
    }
}

// Optional: AJAX-фильтрация
function filterCatalog(category) {
    fetch(`/api/catalog/filter/?category=${category}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest' }
    })
        .then(res => res.json())
        .then(data => updateCatalogContent(data.items))
        .catch(console.error);
}

function updateCatalogContent(items) {
    const catalogContent = document.getElementById('catalogContent');

    if (!catalogContent) return;

    catalogContent.innerHTML = items.length
        ? ''
        : '<p>Товары не найдены для выбранной категории.</p>';

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'product-card col-span-2';
        el.innerHTML = `
            <a href="/catalog/${item.id}/" class="catalog-item-link">
              <img src="${item.image.url}" alt="${item.title}" class="catalog-image">
              <div class="catalog-title">${item.title}</div>
            </a>`;
        catalogContent.appendChild(el);
    });
}

// =================== SEARCH ===================
async function handleInput(el) {
    el.style.width = ((el.value.length + 1) * 8) + 'px';
    const q = el.value.trim();
    if (q.length > 1) await performSearch(q);
}

// Поиск
async function performSearch(query) {
    try {
        const resp = await fetch(`/api/search/?query=${encodeURIComponent(query)}`);
        const { items } = await resp.json();
        renderSearchResults(items);
    } catch (err) {
        console.error('Ошибка поиска:', err);
    }
}

function renderSearchResults(items) {
    const c = document.getElementById('search-results');
    if (!c) return;

    c.innerHTML = items.length
        ? ''
        : '<p>Ничего не найдено</p>';

    items.forEach(i => {
        const el = document.createElement('div');
        const id = i.id;
        el.className = 'search-item';
        el.innerHTML = `<a href="/catalog/${id}" class="catalog-item-link">
                <img src="${i.image_url}" width="250" height="250"
                     style="object-fit:cover;object-position:center" alt="${i.title}" />
                <h3>${i.title}</h3>
                <p>${i.category}</p>
            </a>`;
        c.appendChild(el);
    });
}


// =================== OVERLAYS (Search & Cart) ===================
function initOverlays() {
    const searchNav = document.querySelector('.nav-cell[data-overlay="search"]');
    const cartNav = document.querySelector('.nav-cell[data-overlay="cart"]');

    if (searchNav) {
        searchNav.addEventListener('click', () => toggleOverlay('search'));
    }

    if (cartNav) {
        cartNav.addEventListener('click', () => toggleOverlay('cart'));
    }

    // Закрытие по клику вне содержимого
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.addEventListener('click', function(e) {
            if (e.target === this) closeOverlay(this.id.replace('-overlay', ''));
        });
    });

    // Поиск в оверлее
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            const q = e.target.value.trim();
            if (q.length > 1) performSearch(q);
        });
    }
}

function toggleOverlay(type) {
    overlays.forEach(overlayType => {
        if (overlayType !== type) closeOverlay(overlayType);
    });

    const overlay = document.getElementById(`${type}-overlay`);
    const cell = document.getElementById(`${type}-cell`);

    if (!overlay || !cell) return;

    const isOpen = overlay.style.display === 'block';

    if (isOpen) {
        closeOverlay(type);
    } else {
        overlay.style.display = 'block';
        cell.classList.add('active');
        document.body.style.overflow = 'hidden';

        // Если это корзина — отрисуем её содержимое
        if (type === 'cart') renderCartOverlay();

        setTimeout(() => overlay.classList.add('active'), 10);
    }
}

function closeOverlay(type) {
    const overlay = document.getElementById(`${type}-overlay`);
    const cell = document.getElementById(`${type}-cell`);

    if (!overlay || !cell) return;

    overlay.classList.remove('active');
    cell.classList.remove('active');

    setTimeout(() => {
        overlay.style.display = 'none';
        document.body.style.overflow = '';
    }, 10);
}

// =================== CART LOGIC ===================
const CART_KEY = 'cart';

function loadCart() {
    try {
        return JSON.parse(localStorage.getItem(CART_KEY)) || [];
    } catch {
        return [];
    }
}

function saveCart(cart) {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
}

function addToCart(item) {
    const cart = loadCart();
    const idx = cart.findIndex(i => i.id === item.id);
    if (idx >= 0) cart[idx].qty += 1;
    else cart.push({ ...item, qty: 1 });
    saveCart(cart);
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;

    const total = loadCart().reduce((sum, i) => sum + i.qty, 0);
    badge.textContent = total;
}

function renderCartOverlay() {
    const container = document.getElementById('cart-items');
    const cart = loadCart();

    if (!container) return;

    if (cart.length === 0) {
        container.innerHTML = '<p>Корзина пуста.</p>';
        return;
    }

    // Считаем общую сумму
    let total = cart.reduce((sum, i) => sum + i.price * i.qty, 0);

    // HTML для корзины
    let html = `
        <ul class="cart-list">
            <div class="cart-footer">
                <div class="cart-footer-label">
                    <div>КОРЗИНА [CART]:</div>
                    <div>${total} р.</div>
                </div>
            </div>
    `;

    cart.forEach(i => {
        const itemSum = i.price * i.qty;
        html += `
            <li class="cart-item" data-id="${i.id}">
                <div class="cart-general">
                    <img class="cart-thumb" src="${i.image}" alt="${i.title}">
                    <div class="cart-info">
                        <button class="delete-item-btn">Удалить</button>
                        <p><strong>${i.title}</strong></p>
                    </div>
                </div>
                <div class="cart-sum">${itemSum} р.</div>
            </li>`;
    });

    html += '</ul>';
    container.innerHTML = html;

    // Назначаем обработчики удаления
    container.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const li = e.target.closest('.cart-item');
            const id = parseInt(li.dataset.id, 10);
            removeFromCart(id);
        });
    });
}

function removeFromCart(itemId) {
    const cart = loadCart().filter(i => i.id !== itemId);
    saveCart(cart);
    updateCartBadge();
    renderCartOverlay();
}

// Центрирование контента относительно экрана
function centerContent() {
    const header = document.querySelector('.nav-container');
    const content = document.getElementById('catalogContent');

    if (!content) return;

    const headerHeight = header ? header.offsetHeight : 60; // Резервная высота
    const windowHeight = window.innerHeight;
    const marginTop = (windowHeight / 2) - (headerHeight); // Более точный расчёт

    content.style.marginTop = `${marginTop}px`;
}

document.addEventListener('DOMContentLoaded', function () {
    const scrollContainer = document.getElementById('scroll-target');
    const images = document.querySelectorAll('.additional-image');

    if (!scrollContainer || !images.length) return;

    function updateImagePosition() {
        const scrollTop = scrollContainer.scrollTop;

        images.forEach((img, index) => {
            // Чем больше индекс, тем медленнее движется
            const offset = scrollTop * (index + 1) * 0.5;

            img.style.transform = `translateX(-${offset}px)`;
            img.style.opacity = Math.max(1 - offset / 500, 0.3); // исчезает, если слишком далеко
        });
    }

    scrollContainer.addEventListener('scroll', updateImagePosition);
});