const tg = window.Telegram.WebApp;
tg.expand();

const ADMIN_ID = 6965294597;
const SELLER_USERNAME = 'ZloyXSanta';

const isAdmin = tg.initDataUnsafe?.user?.id === ADMIN_ID;

// Переменные для продажи
let currentAccount = null;
let currentPhotoBase64 = null;
let allAccounts = [];
let sortDirection = 'none';

// Переменные для услуг
let currentService = null;
let currentServicePhotoBase64 = null;
let allServices = [];
let currentTab = 'sale';

// Показываем админ-панели, если это админ
if (isAdmin) {
    document.getElementById('adminPanel').style.display = 'block';
    document.getElementById('adminPanelServices').style.display = 'block';
}

// ================= УПРАВЛЕНИЕ ТАБАМИ =================
function switchTab(tab) {
    currentTab = tab;
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelector(`.tab[data-tab="${tab}"]`).classList.add('active');
    
    // Скрываем все разделы
    document.getElementById('saleSection').style.display = 'none';
    document.getElementById('servicesSection').style.display = 'none';
    document.getElementById('faqSection').style.display = 'none';
    
    // Показываем нужный
    if (tab === 'sale') {
        document.getElementById('saleSection').style.display = 'block';
    } else if (tab === 'services') {
        document.getElementById('servicesSection').style.display = 'block';
    } else if (tab === 'faq') {
        document.getElementById('faqSection').style.display = 'block';
    }
}

// ================= ПРОДАЖА АККАУНТОВ =================

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
        sortDirection = 'none';
        updateSortButton();
        renderAccounts(accounts);
    } catch (error) {
        console.error('Ошибка загрузки:', error);
    }
}

function toggleSort() {
    if (sortDirection === 'none') sortDirection = 'asc';
    else if (sortDirection === 'asc') sortDirection = 'desc';
    else sortDirection = 'none';
    
    updateSortButton();
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const filtered = searchTerm === '' 
        ? allAccounts 
        : allAccounts.filter(acc => {
            const text = ((acc.description || '') + ' ' + (acc.name || '') + ' ' + acc.rank).toLowerCase();
            return text.includes(searchTerm);
        });
    renderAccounts(filtered);
}

function updateSortButton() {
    const btn = document.getElementById('sortBtn');
    if (!btn) return;
    const text = document.getElementById('sortText');
    const icon = document.getElementById('sortIcon');
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

    let displayAccounts = [...accounts];
    if (sortDirection === 'asc') displayAccounts.sort((a, b) => a.price - b.price);
    else if (sortDirection === 'desc') displayAccounts.sort((a, b) => b.price - a.price);

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
            ${account.photo ? `<img src="${account.photo}" class="buy-photo">` : ''}
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
    const message = `Привет! Хочу купить аккаунт за ${currentAccount.price.toLocaleString()} ₽`;
    tg.openTelegramLink(`https://t.me/${SELLER_USERNAME}?text=${encodeURIComponent(message)}`);
    closeBuyModal();
}

document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Добавить';
    if (submitBtn) { submitBtn.textContent = 'Загрузка...'; submitBtn.disabled = true; }

    try {
        let photoUrl = null;
        if (currentPhotoBase64) {
            const uploadResponse = await fetch('/api/upload-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo: currentPhotoBase64 })
            });
            const uploadData = await uploadResponse.json();
            if (!uploadResponse.ok) throw new Error(uploadData.error || 'Ошибка загрузки фото');
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
        if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
    }
});

async function deleteAccount(accountId, event) {
    event.stopPropagation();
    if (!confirm('Удалить этот аккаунт?')) return;
    try {
        const response = await fetch(`/api/accounts/${accountId}`, { method: 'DELETE' });
        if (response.ok) { await loadAccounts(); tg.HapticFeedback?.notificationOccurred('success'); }
    } catch (error) { console.error('Ошибка удаления:', error); }
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


// ================= УСЛУГИ =================

function previewServiceImage(event) {
    const file = event.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            currentServicePhotoBase64 = e.target.result;
            document.getElementById('servicePhotoPreview').innerHTML = 
                `<img src="${currentServicePhotoBase64}" alt="Preview">`;
        };
        reader.readAsDataURL(file);
    }
}

async function loadServices() {
    try {
        const response = await fetch('/api/services');
        const services = await response.json();
        allServices = services;
        renderServices(services);
    } catch (error) {
        console.error('Ошибка загрузки услуг:', error);
    }
}

function renderServices(services) {
    const list = document.getElementById('servicesList');
    const emptyState = document.getElementById('servicesEmptyState');

    if (services.length === 0) {
        list.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    list.style.display = 'block';
    emptyState.style.display = 'none';

    list.innerHTML = services.map((service, index) => `
        <div class="account-card service-card" onclick="openServiceModal('${service._id}')">
            ${index === 0 ? `
                <div class="top-badge service-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    ТОП УСЛУГА
                </div>
            ` : ''}
            ${isAdmin ? `<button class="delete-btn" onclick="deleteService('${service._id}', event)">УДАЛИТЬ</button>` : ''}
            
            ${service.photo 
                ? `<img src="${service.photo}" class="account-photo" alt="Услуга" loading="lazy">`
                : `<div class="account-photo-placeholder">🎯</div>`
            }
            
            <div class="account-body">
                <div class="account-description">${service.description}</div>
                
                <div class="account-footer">
                    <div class="account-price">${service.price.toLocaleString()} ₽</div>
                    <button class="btn-details service-btn">Заказать ›</button>
                </div>
            </div>
        </div>
    `).join('');
}

function openAddServiceModal() {
    currentServicePhotoBase64 = null;
    document.getElementById('addServiceModal').classList.add('active');
}

function closeAddServiceModal() {
    document.getElementById('addServiceModal').classList.remove('active');
    document.getElementById('addServiceForm').reset();
    document.getElementById('servicePhotoPreview').innerHTML = '';
    currentServicePhotoBase64 = null;
}

function openServiceModal(serviceId) {
    const service = allServices.find(s => String(s._id) === String(serviceId));
    if (service) {
        currentService = service;
        document.getElementById('serviceDetails').innerHTML = `
            ${service.photo ? `<img src="${service.photo}" class="buy-photo">` : ''}
            <div class="buy-title">${service.description}</div>
            <div class="buy-price">${service.price.toLocaleString()} ₽</div>
        `;
        document.getElementById('serviceModal').classList.add('active');
    }
}

function closeServiceModal() {
    document.getElementById('serviceModal').classList.remove('active');
    currentService = null;
}

function contactSellerService() {
    if (!currentService) return;
    const message = `Привет! Хочу заказать услугу: "${currentService.description}" за ${currentService.price.toLocaleString()} ₽. Расскажите подробнее!`;
    tg.openTelegramLink(`https://t.me/${SELLER_USERNAME}?text=${encodeURIComponent(message)}`);
    closeServiceModal();
}

document.getElementById('addServiceForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn ? submitBtn.textContent : 'Добавить';
    if (submitBtn) { submitBtn.textContent = 'Загрузка...'; submitBtn.disabled = true; }

    try {
        let photoUrl = null;
        if (currentServicePhotoBase64) {
            const uploadResponse = await fetch('/api/upload-service-photo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ photo: currentServicePhotoBase64 })
            });
            const uploadData = await uploadResponse.json();
            if (!uploadResponse.ok) throw new Error(uploadData.error || 'Ошибка загрузки фото');
            photoUrl = uploadData.url;
        }

        const service = {
            description: document.getElementById('serviceDescription').value,
            price: parseInt(document.getElementById('servicePrice').value),
            photo: photoUrl
        };

        const response = await fetch('/api/services', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(service)
        });

        if (response.ok) {
            closeAddServiceModal();
            await loadServices();
            tg.HapticFeedback?.notificationOccurred('success');
        }
    } catch (error) {
        console.error('Ошибка добавления услуги:', error);
    } finally {
        if (submitBtn) { submitBtn.textContent = originalText; submitBtn.disabled = false; }
    }
});

async function deleteService(serviceId, event) {
    event.stopPropagation();
    if (!confirm('Удалить эту услугу?')) return;
    try {
        const response = await fetch(`/api/services/${serviceId}`, { method: 'DELETE' });
        if (response.ok) { await loadServices(); tg.HapticFeedback?.notificationOccurred('success'); }
    } catch (error) { console.error('Ошибка удаления:', error); }
}

document.getElementById('addServiceModal').addEventListener('click', (e) => {
    if (e.target.id === 'addServiceModal') closeAddServiceModal();
});

document.getElementById('serviceModal').addEventListener('click', (e) => {
    if (e.target.id === 'serviceModal') closeServiceModal();
});

document.getElementById('servicesSearchInput').addEventListener('input', () => {
    const searchTerm = document.getElementById('servicesSearchInput').value.toLowerCase().trim();
    const filtered = searchTerm === '' 
        ? allServices 
        : allServices.filter(s => {
            const text = (s.description || '').toLowerCase();
            return text.includes(searchTerm);
        });
    renderServices(filtered);
});


// ================= ИНДИВИДУАЛЬНЫЙ ЗАКАЗ =================

function openCustomOrderModal() {
    document.getElementById('customOrderModal').classList.add('active');
}

function closeCustomOrderModal() {
    document.getElementById('customOrderModal').classList.remove('active');
    document.getElementById('customStars').value = '';
    document.getElementById('customWinRate').value = '';
    document.getElementById('customDescription').value = '';
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
    if (container.children.length > 1) {
        btn.parentElement.remove();
    } else {
        btn.previousElementSibling.value = '';
    }
}

function submitCustomOrder() {
    const accType = document.querySelector('input[name="accType"]:checked').value;
    const stars = document.getElementById('customStars').value || 'Не указано';
    const winRate = document.getElementById('customWinRate').value || 'Не указано';
    const description = document.getElementById('customDescription').value.trim() || 'Не указано';
    
    const skinInputs = document.querySelectorAll('.skin-input');
    const skins = [];
    skinInputs.forEach(input => {
        if (input.value.trim() !== '') skins.push(input.value.trim());
    });
    const skinsText = skins.length > 0 ? skins.join(', ') : 'Не указаны';

    const message = `🛠️ *НОВАЯ ЗАЯВКА НА ИНДИВИДУАЛЬНЫЙ ЗАКАЗ!*

👤 *Тип аккаунта:* ${accType}
⭐ *Звезд в максе:* ${stars}
📊 *Процент побед:* ${winRate}%
📝 *Описание:* ${description}
🎨 *Желаемые скины:* ${skinsText}

Жду ответа по стоимости и срокам!`;

    tg.openTelegramLink(`https://t.me/${SELLER_USERNAME}?text=${encodeURIComponent(message)}`);
    closeCustomOrderModal();
    tg.HapticFeedback?.notificationOccurred('success');
}

document.getElementById('customOrderModal').addEventListener('click', (e) => {
    if (e.target.id === 'customOrderModal') closeCustomOrderModal();
});


// ================= FAQ (ЧАСТЫЕ ВОПРОСЫ) =================

function toggleFaq(button) {
    const faqItem = button.parentElement;
    const answer = faqItem.querySelector('.faq-answer');
    const icon = button.querySelector('.faq-icon');
    
    // Закрываем все остальные открытые вопросы
    document.querySelectorAll('.faq-item').forEach(item => {
        if (item !== faqItem) {
            item.classList.remove('active');
            item.querySelector('.faq-answer').style.maxHeight = null;
            item.querySelector('.faq-icon').style.transform = 'rotate(0deg)';
        }
    });
    
    // Переключаем текущий вопрос
    faqItem.classList.toggle('active');
    
    if (faqItem.classList.contains('active')) {
        answer.style.maxHeight = answer.scrollHeight + 'px';
        icon.style.transform = 'rotate(180deg)';
    } else {
        answer.style.maxHeight = null;
        icon.style.transform = 'rotate(0deg)';
    }
}


// ================= ЗАПУСК ПРИ СТАРТЕ =================
loadAccounts();
loadServices();
