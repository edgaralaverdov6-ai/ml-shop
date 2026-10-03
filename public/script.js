const tg = window.Telegram.WebApp;
tg.expand();

const ADMIN_ID = 6965294597; // ЗАМЕНИ НА СВОЙ ID
const SELLER_USERNAME = 'ZloyXSanta'; // ЗАМЕНИ НА СВОЙ USERNAME

const isAdmin = tg.initDataUnsafe?.user?.id === ADMIN_ID;
let currentAccount = null;
let currentPhotoBase64 = null;

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
        renderAccounts(accounts);
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

function renderAccounts(accounts) {
    const list = document.getElementById('accountsList');
    const emptyState = document.getElementById('emptyState');
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    // Фильтруем по поиску
    const filtered = accounts.filter(acc => {
        const text = ((acc.description || '') + ' ' + (acc.name || '') + ' ' + acc.rank).toLowerCase();
        return text.includes(searchTerm);
    });

    if (filtered.length === 0) {
        list.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    list.style.display = 'block';
    emptyState.style.display = 'none';

    list.innerHTML = filtered.map((account, index) => `
        <div class="account-card" onclick="openBuyModal(${account.id})">
            ${index === 0 ? `
                <div class="top-badge">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    ТОП АККАУНТ
                </div>
            ` : ''}
            ${isAdmin ? `<button class="delete-btn" onclick="deleteAccount(${account.id}, event)">УДАЛИТЬ</button>` : ''}
            
            ${account.photo 
                ? `<img src="${account.photo}" class="account-photo" alt="${account.name}">`
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
                    <div class="badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                        </svg>
                        Безопасная сделка
                    </div>
                    <div class="badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
                        </svg>
                        Быстрая выдача
                    </div>
                    <div class="badge">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
                        </svg>
                        Поддержка 24/7
                    </div>
                </div>
                
                <div class="account-footer">
                    <div class="account-price">${account.price.toLocaleString()} ₽</div>
                    <button class="btn-details">
                        Подробнее
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="9 18 15 12 9 6"/>
                        </svg>
                    </button>
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
    fetch('/api/accounts')
        .then(response => response.json())
        .then(accounts => {
            currentAccount = accounts.find(acc => acc.id === accountId);
            if (currentAccount) {
                document.getElementById('buyDetails').innerHTML = `
                    ${currentAccount.photo 
                        ? `<img src="${currentAccount.photo}" class="buy-photo">`
                        : ''
                    }
                    <div class="buy-title">${currentAccount.description || currentAccount.name}</div>
                    <div class="buy-desc">
                        <strong>Ранг:</strong> ${currentAccount.rank}<br>
                        <strong>Герои:</strong> ${currentAccount.heroes}<br>
                        <strong>Скины:</strong> ${currentAccount.skins}
                    </div>
                    <div class="buy-price">${currentAccount.price.toLocaleString()} ₽</div>
                `;
                document.getElementById('buyModal').classList.add('active');
            }
        });
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

    const account = {
        name: document.getElementById('description').value,
        rank: document.getElementById('rank').value,
        heroes: parseInt(document.getElementById('heroes').value),
        skins: parseInt(document.getElementById('skins').value),
        price: parseInt(document.getElementById('price').value),
        description: document.getElementById('description').value,
        photo: currentPhotoBase64
    };

    try {
        const response = await fetch('/api/accounts', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(account)
        });

        if (response.ok) {
            closeAddModal();
            loadAccounts();
            tg.HapticFeedback?.notificationOccurred('success');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
});

async function deleteAccount(id, event) {
    event.stopPropagation();
    if (!confirm('Удалить этот аккаунт?')) return;

    try {
        const response = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadAccounts();
            tg.HapticFeedback?.notificationOccurred('success');
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
}

document.getElementById('addModal').addEventListener('click', (e) => {
    if (e.target.id === 'addModal') closeAddModal();
});

document.getElementById('buyModal').addEventListener('click', (e) => {
    if (e.target.id === 'buyModal') closeBuyModal();
});

loadAccounts();
