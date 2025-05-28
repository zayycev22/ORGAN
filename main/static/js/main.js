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

    // Добавление в корзину на странице товара
    const addBtn = document.getElementById('add-to-cart-btn');
    if (addBtn) {
        addBtn.addEventListener('click', function (e) {
            addBtn.classList.add('active')
            setTimeout(() => addBtn.classList.remove('active'), 100)

            let sizes = [];
            try {
                sizes = JSON.parse(this.dataset.sizes || '[]');
            } catch (err) {
                console.warn('Ошибка парсинга sizes:', err);
            }
            e.preventDefault();
            const item = {
                id: parseInt(this.dataset.id, 10),
                title: this.dataset.title,
                price: parseInt(this.dataset.price, 10),
                category: this.dataset.category,
                image: this.dataset.image,
                sizes: sizes.length > 0 ? sizes : null,
            };
            addToCart(item);
        });
    }

    // Сразу обновляем счётчик
    updateCartBadge();
    if (currentPath.includes('about')) {
        const spawnContainer = document.getElementById('spawn-container');
        if (spawnContainer) {
            const NUM_PANELS = 250;
            for (let i = 0; i < NUM_PANELS; i++) {
                setTimeout(() => {
                    const panel = document.createElement('div');
                    panel.className = 'about-item';
                    panel.textContent = 'О нас [about]';
                    panel.style.top = `${Math.floor(i / 6) * 25}px`
                    panel.style.left = `${(i % 6) * 320}px`
                    panel.id = `about-item-${i}`
                    panel.onclick = () => hide_about(`about-item-${i}`)
                    spawnContainer.appendChild(panel);
                }, i * 100)
            }
        }
    }

});

function hide_about(name) {
    const about = document.getElementById(name);
    about.style.display = 'none';
}

async function handleInput(el) {
    el.style.width = ((el.value.length + 1) * 8) + 'px';
    const q = el.value.trim();
    if (q.length > 1)
        await performSearch(q);
}

// =================== NAVIGATION ===================
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

    for (const [path, title] of Object.entries(navItems)) {
        if (currentPath === path) {
            const navItem = domItems.find(el => el.textContent.includes(title));
            if (navItem) {
                navItem.classList.add('active');
                navItem.style.backgroundColor = '#FFE778!important';
            }
        }
    }
}


// =================== CATALOG FILTER ===================
function initCatalogFilter() {
    const urlParams = new URLSearchParams(window.location.search);
    const category = urlParams.get('category') || 'all';
    const filterSelect = document.getElementById('categoryFilter');
    filterSelect.value = category;
    filterSelect.addEventListener('change', function () {
        window.location.href = `/catalog/?category=${this.value}`;
    });
}

// Optional: AJAX-фильтрация
function filterCatalog(category) {
    fetch(`/api/catalog/filter/?category=${category}`, {
        headers: {'X-Requested-With': 'XMLHttpRequest'}
    })
        .then(res => res.json())
        .then(data => updateCatalogContent(data.items))
        .catch(console.error);
}

function updateCatalogContent(items) {
    const catalogContent = document.getElementById('catalogContent');
    catalogContent.innerHTML = items.length
        ? ''
        : '<p>Товары не найдены для выбранной категории.</p>';

    items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'catalog-item';
        el.innerHTML = `
            <a href="/catalog/${item.id}/">
              <img src="${item.image_url}" alt="${item.title}" class="catalog-image">
              <div class="catalog-title">${item.title}</div>
            </a>`;
        catalogContent.appendChild(el);
    });
}


// =================== OVERLAYS (Search & Cart) ===================
function initOverlays() {
    document.querySelector('.nav-cell[data-overlay="search"]')
        .addEventListener('click', () => toggleOverlay('search'));
    document.querySelector('.nav-cell[data-overlay="cart"]')
        .addEventListener('click', () => toggleOverlay('cart'));

    // Закрытие по клику вне содержимого
    document.querySelectorAll('.overlay').forEach(overlay => {
        overlay.addEventListener('click', function (e) {
            if (e.target === this) closeOverlay(this.id.replace('-overlay', ''));
        });
    });

    // Поиск в оверлее
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function (e) {
            const q = e.target.value.trim();
            if (q.length > 1) performSearch(q);
        });
    }
}

const overlays = ['cart', 'search']

function toggleOverlay(type) {
    for (const overlay of overlays) {
        if (overlay !== type)
            closeOverlay(overlay);
    }
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
        // если это корзина — отрисуем её содержимое
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


// =================== SEARCH ===================
async function performSearch(query) {
    try {
        const resp = await fetch(`/api/search/?query=${encodeURIComponent(query)}`);
        const {items} = await resp.json();
        renderSearchResults(items);
    } catch (err) {
        console.error('Ошибка поиска:', err);
    }
}

function renderSearchResults(items) {
    const c = document.getElementById('search-results');
    c.innerHTML = items.length
        ? ''
        : '<p>Ничего не найдено</p>';
    items.forEach(i => {
        const el = document.createElement('div');
        const id = i.id;
        el.className = 'search-item';
        el.innerHTML = `<a href="/catalog/` +
            id.toString() + `" class="catalog-item-link">
                <img src="${i.image_url}" width="250" height="250"
                     style="object-fit:cover;object-position:center" alt="${i.title}" />
                <h3>${i.title}</h3>
                <p>${i.category}</p>
            </a>`;
        c.appendChild(el);
    });
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
    else cart.push({...item, qty: 1});
    saveCart(cart);
    updateCartBadge();
}

function updateCartBadge() {
    const badge = document.getElementById('cart-badge');
    if (!badge) return;
    const total = loadCart().reduce((sum, i) => sum + i.qty, 0);
    badge.textContent = total;
}

const category_map = {
    'bracelets': 'Браслет',
    'earrings': 'Серьги',
    'pendants': 'Кулон',
    'necklaces': 'Ожерелье',
    'rings': 'Кольцо',
};

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

    // Сборка HTML
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
            <div class="cart-text">`

        console.log(i?.sizes)
        if (i.category === "rings" && i.sizes) {
            html += `<div class="underline">ПО ЕВРОПЕЙСКОЙ СИСТЕМЕ РАЗМЕРОВ</div>
              <div class="inline-size">
              ВВЕДИТЕ РАЗМЕР: 
              <select class="size-input" >
                <option value="" disabled selected hidden></option>`

            for (const size of i.sizes) {
                html += `<option value=${size} > ${size} </option>`
            }

            html += `</select></div>`
        }
        html += `<p><strong>`
        if (i.category) {
            const categoryName = category_map[i.category]
            html += `${categoryName}: `;
        }
        html += `${i.title}</strong></p>
                </div>
            </div>
        </div>
        <div class="cart-sum">${itemSum} р.</div>
      </li>`;
    });

    html += `</ul>`;
    container.innerHTML = html;

    // Навешиваем удаление для каждой кнопки
    container.querySelectorAll('.delete-item-btn').forEach(btn => {
        btn.addEventListener('click', e => {
            const li = e.target.closest('.cart-item');
            const id = parseInt(li.dataset.id, 10);
            removeFromCart(id);
        });
    });
}

// Удаляем один элемент из корзины по id
function removeFromCart(itemId) {
    const cart = loadCart().filter(i => i.id !== itemId);
    saveCart(cart);
    updateCartBadge();
    renderCartOverlay();
}

document.addEventListener('DOMContentLoaded', () => {
    const container = document.querySelector('.collection-card-images');
    const overlay = document.getElementById('collection-overlay');
    const collectionInfo = document.getElementById('collection-info');

    if (!container || !overlay) return;

    container.addEventListener('wheel', function (event) {
        if (30 < container.scrollLeft) {
            setTimeout(() => {
                overlay.classList.add('active')
            }, 50)
        } else {
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 50)
        }
        if (event.deltaY !== 0) {
            event.preventDefault();
            container.scrollLeft += Number(event.deltaY) * 4;
            // Включаем активный режим, если пользователь начал прокручивать
            if (container.scrollLeft > 0) {
                setTimeout(() => {
                    console.log('info width:', collectionInfo.style.width, 'window:', self.innerWidth)

                    if (container.scrollLeft < self.innerWidth / 6) {
                        container.style.width = `calc(50vw + ${container.scrollLeft}px)`;
                        collectionInfo.style.width = `calc(50vw - ${container.scrollLeft}px)`;
                        collectionInfo.style.display = 'flex'
                    } else {
                        container.style.width = `100vw`;
                        collectionInfo.style.display = 'none'
                    }
                }, 50)
            }
        }
    }, {passive: false});

    container.addEventListener('scroll', function () {
        if (container.scrollLeft === 0) {
            container.classList.remove('scroll-active');
            overlay.classList.remove('active');
        }
    });
});


