const tg = window.Telegram.WebApp;
tg.expand();

const ADMIN_ID = 6965294597;
const SELLER_USERNAME = 'ZloyXSanta';

const isAdmin = tg.initDataUnsafe?.user?.id === ADMIN_ID;
let currentAccount = null;
let currentPhotoBase64 = null;
let allAccounts = [];

// Переменная для состояния сортировки: 'none', 'asc' (возрастание), 'desc' (убывание)
let sortDirection = 'none';

if (isAdmin) {
    document.getElementById('adminPanel').style.display = 'block';
}

function previewImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentPhotoBase64 = e.target.result;
            document.getElementById('photoPreview').innerHTML = 
                `<img src="${currentPhotoBase64}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

async function loadAccounts() {
    try {
        const response = await fetch('/api/accounts');
        const accounts = await response.json();
        allAccounts = accounts;
        
        // Сбрасываем сортировку при новой загрузке данных
        sortDirection = 'none';
        updateSortButton();
        
        renderAccounts(accounts);
    } catch (error) {
        console.error('Ошибка загрузки:', error);
    }
}

// Функция переключения сортировки
function toggleSort() {
    if (sortDirection === 'none') {
        sortDirection = 'asc';
    } else if (sortDirection === 'asc') {
        sortDirection = 'desc';
    } else {
        sortDirection = 'none';
    }
    
    updateSortButton();
    
    // Перерисовываем список с учётом текущего поиска и новой сортировки
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = searchTerm === '' 
        ? allAccounts 
        : allAccounts.filter(acc => {
            const text = ((acc.description || '') + ' ' + (acc.name || '') + ' ' + acc.rank).toLowerCase();
            return text.includes(searchTerm);
        });
        
    renderAccounts(filtered);
}

// Функция обновления внешнего вида кнопки сортировки
function updateSortButton() {
    const btn = document.getElementById('sortBtn');
    if (!btn) return; // Защита, если кнопки ещё нет в DOM
    
    const text = document.getElementById('sortText');
    const icon = document.getElementById('sortIcon');

    // Сбрасываем классы
    btn.className = 'sort-btn';

    if (sortDirection === 'asc') {
        btn.classList.add('active-asc');
        text.textContent = 'Сначала дешёвые';
        icon.textContent = '↑';
    } else if (sortDirection === 'desc') {
        btn.classList.add('active-desc');
        text.textContent = 'Сначала дорогие';
        icon.textContent = '↓';
    } else {
        text.textContent = 'Сортировка по цене';
        icon.textContent = '⇅';
    }
}

function renderAccounts(accounts) {
    const list = document.getElementById('accountsList');
    const emptyState = document.getElementById('emptyState');

    if (accounts.length === 0) {
        list.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    list.style.display = 'block';
    emptyState.style.display = 'none';

    // Создаем копию массива, чтобы не ломать исходный порядок allAccounts
    let displayAccounts = [...accounts];

    // Применяем сортировку по цене, если она включена
    if (sortDirection === 'asc') {
        displayAccounts.sort((a, b) => a.price - b.price);
    } else if (sortDirection === 'desc') {
        displayAccounts.sort((a, b) => b.price - a.price);
    }

    list.innerHTML = displayAccounts.map((account, index) => `
        <div class="account-card" onclick="openBuyModal('${account._id}')">
            ${index === 0 ? `
                <div class="top-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    ТОП АККАУНТ
                </div>
            ` : ''}
            ${isAdmin ? `<button class="delete-btn" onclick="deleteAccount('${account._id}', event)">УДАЛИТЬ</button>` : ''}
            
            ${account.photo 
                ? `<img src="${account.photo}" class="account-photo" alt="${account.name}" loading="lazy">`
                : `<div class="account-photo-placeholder">🎮</div>`
            }
            
            <div class="account-body">
                <div class="account-stats">
                    <div class="stat-item">
                        <div class="stat-icon">⚔️</div>
                        <div class="stat-info">
                            <div class="stat-label">Герои</div>
                            <div class="stat-value">${account.heroes}</div>
                        </div>
                    </div>
                    <div class="stat-item">
                        <div class="stat-icon">🎨</div>
                        <div class="stat-info">
                            <div class="stat-label">Скины</div>
                            <div class="stat-value">${account.skins}</div>
                        </div>
                    </div>
                    <div class="rank-badge">
                        💎 ${account.rank.toUpperCase()}
                    </div>
                </div>
                
                <div class="account-description">${account.description || account.name}</div>
                
                <div class="account-badges">
                    <div class="badge">🛡️ Безопасная сделка</div>
                    <div class="badge">⚡ Быстрая выдача</div>
                    <div class="badge">💬 Поддержка 24/7</div>
                </div>
                
                <div class="account-footer">
                    <div class="account-price">${account.price.toLocaleString()} ₽</div>
                    <button class="btn-details">Подробнее ›</button>
                </div>
            </div>
        </div>
    `).join('');
}

function openAddModal() {
    currentPhotoBase64 = null;
    document.getElementById('addModal').classList.add('active');
}

function closeAddModal() {
    document.getElementById('addModal').classList.remove('active');
    document.getElementById('addForm').reset();
    document.getElementById('photoPreview').innerHTML = '';
    currentPhotoBase64 = null;
}

function openBuyModal(accountId) {
    const account = allAccounts.find(acc => String(acc._id) === String(accountId));
    if (account) {
        currentAccount = account;
        document.getElementById('buyDetails').innerHTML = `
            ${account.photo 
                ? `<img src="${account.photo}" class="buy-photo">`
                : ''
            }
            <div class="buy-title">${account.description || account.name}</div>
            <div class="buy-desc">
                <strong>Ранг:</strong> ${account.rank}<br>
                <strong>Герои:</strong> ${account.heroes}<br>
                <strong>Скины:</strong> ${account.skins}
            </div>
            <div class="buy-price">${account.price.toLocaleString()} ₽</div>
        `;
        document.getElementById('buyModal').classList.add('active');
    }
}

function closeBuyModal() {
    document.getElementById('buyModal').classList.remove('active');
    currentAccount = null;
}

function contactSeller() {
    if (!currentAccount) return;
    const message = `Привет! Хочу купить аккаунт за ${currentAccount.price} ₽`;
    tg.openTelegramLink(`https://t.me/${SELLER_USERNAME}?text=${encodeURIComponent(message)}`);
    closeBuyModal();
}

document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Добавить';
    if (submitBtn) {
        submitBtn.textContent = 'Загрузка...';
        submitBtn.disabled = true;
    }

    try {
        let photoUrl = null;

        if (currentPhotoBase64) {
            const uploadResponse = await fetch('/api/upload-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo: currentPhotoBase64 })
            });
            const uploadData = await uploadResponse.json();
            
            if (!uploadResponse.ok) {
                throw new Error(uploadData.error || 'Ошибка загрузки фото');
            }
            
            photoUrl = uploadData.url;
        }

        const account = {
            name: document.getElementById('description').value,
            rank: document.getElementById('rank').value,
            heroes: parseInt(document.getElementById('heroes').value),
            skins: parseInt(document.getElementById('skins').value),
            price: parseInt(document.getElementById('price').value),
            description: document.getElementById('description').value,
            photo: photoUrl
        };

        const response = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(account)
        });

        if (response.ok) {
            closeAddModal();
            await loadAccounts();
            tg.HapticFeedback?.notificationOccurred('success');
        }
    } catch (error) {
        console.error('Ошибка добавления:', error);
    } finally {
        if (submitBtn) {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }
});

async function deleteAccount(accountId, event) {
    event.stopPropagation();
    if (!confirm('Удалить этот аккаунт?')) return;

    try {
        const response = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
        if (response.ok) {
            await loadAccounts();
            tg.HapticFeedback?.notificationOccurred('success');
        }
    } catch (error) {
        console.error('Ошибка удаления:', error);
    }
}

document.getElementById('addModal').addEventListener('click', (e) => {
    if (e.target.id === 'addModal') closeAddModal();
});

document.getElementById('buyModal').addEventListener('click', (e) => {
    if (e.target.id === 'buyModal') closeBuyModal();
});

document.getElementById('searchInput').addEventListener('input', () => {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = searchTerm === '' 
        ? allAccounts 
        : allAccounts.filter(acc => {
            const text = ((acc.description || '') + ' ' + (acc.name || '') + ' ' + acc.rank).toLowerCase();
            return text.includes(searchTerm);
        });
    renderAccounts(filtered);
});

// Запускаем загрузку при старте
loadAccounts();
// ================= ИНДИВИДУАЛЬНЫЙ ЗАКАЗ =================

function openCustomOrderModal() {
    document.getElementById('customOrderModal').classList.add('active');
}

function closeCustomOrderModal() {
    document.getElementById('customOrderModal').classList.remove('active');
    // Сброс формы при закрытии
    document.getElementById('customStars').value = '';
    document.getElementById('skinsContainer').innerHTML = `
        <div class="skin-input-row">
            <input type="text" class="form-input skin-input" placeholder="Название скина (например: Колл)">
            <button type="button" class="remove-skin-btn" onclick="removeSkinField(this)">✕</button>
        </div>
    `;
}

function addSkinField() {
    const container = document.getElementById('skinsContainer');
    const newRow = document.createElement('div');
    newRow.className = 'skin-input-row';
    newRow.innerHTML = `
        <input type="text" class="form-input skin-input" placeholder="Название скина">
        <button type="button" class="remove-skin-btn" onclick="removeSkinField(this)">✕</button>
    `;
    container.appendChild(newRow);
}

function removeSkinField(btn) {
    const container = document.getElementById('skinsContainer');
    // Не удаляем последнее поле, чтобы всегда было хотя бы одно
    if (container.children.length > 1) {
        btn.parentElement.remove();
    } else {
        // Если поле последнее, просто очищаем его
        btn.previousElementSibling.value = '';
    }
}

function submitCustomOrder() {
    // 1. Собираем данные
    const accType = document.querySelector('input[name="accType"]:checked').value;
    const stars = document.getElementById('customStars').value || 'Не указано';
    
    // Собираем все непустые названия скинов
    const skinInputs = document.querySelectorAll('.skin-input');
    const skins = [];
    skinInputs.forEach(input => {
        if (input.value.trim() !== '') {
            skins.push(input.value.trim());
        }
    });

    const skinsText = skins.length > 0 ? skins.join(', ') : 'Не указаны';

    // 2. Формируем красивое сообщение
    const message = `🛠️ *НОВАЯ ЗАЯВКА НА ИНДИВИДУАЛЬНЫЙ ЗАКАЗ!*

👤 *Тип аккаунта:* ${accType}
⭐ *Звезд в максе:* ${stars}
🎨 *Желаемые скины:* ${skinsText}

Жду ответа по стоимости и срокам!`;

    // 3. Отправляем тебе в Telegram
    tg.openTelegramLink(`https://t.me/${SELLER_USERNAME}?text=${encodeURIComponent(message)}`);
    
    // 4. Закрываем модалку и показываем вибрацию
    closeCustomOrderModal();
    tg.HapticFeedback?.notificationOccurred('success');
}

// Закрытие модалки при клике вне её области
document.getElementById('customOrderModal').addEventListener('click', (e) => {
    if (e.target.id === 'customOrderModal') {
        closeCustomOrderModal();
    }
});
