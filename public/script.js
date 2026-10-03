const tg = window.Telegram.WebApp;
tg.expand();

const ADMIN_ID = 6965294597; // ЗАМЕНИ НА СВОЙ TELEGRAM ID
const SELLER_USERNAME = 'ZloyXSanta'; // ЗАМЕНИ НА СВОЙ USERNAME БЕЗ @

const isAdmin = tg.initDataUnsafe?.user?.id === ADMIN_ID;
let currentAccount = null;
let currentPhotoBase64 = null;

if (isAdmin) {
    document.getElementById('adminPanel').style.display = 'block';
}

// Превью фото при выборе файла
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
        console.error('Ошибка загрузки:', error);
    }
}

function renderAccounts(accounts) {
    const grid = document.getElementById('accountsGrid');
    const emptyState = document.getElementById('emptyState');

    if (accounts.length === 0) {
        grid.style.display = 'none';
        emptyState.style.display = 'block';
        return;
    }

    grid.style.display = 'grid';
    emptyState.style.display = 'none';

    grid.innerHTML = accounts.map(account => `
        <div class="account-card" onclick="openBuyModal(${account.id})">
            ${isAdmin ? `<button class="btn btn-delete" onclick="deleteAccount(${account.id}, event)">Удалить</button>` : ''}
            ${account.photo 
                ? `<img src="${account.photo}" class="account-photo" alt="${account.name}">`
                : `<div class="account-photo-placeholder">🎮</div>`
            }
            <div class="account-info">
                <div class="account-name">${account.name}</div>
                <div class="account-rank">⭐ ${account.rank}</div>
                <div class="account-stats">
                    <div class="stat">
                        <div class="stat-label">Герои</div>
                        <div class="stat-value">${account.heroes}</div>
                    </div>
                    <div class="stat">
                        <div class="stat-label">Скины</div>
                        <div class="stat-value">${account.skins}</div>
                    </div>
                </div>
                <div class="account-price">${account.price} ₽</div>
                ${account.description ? `<div class="account-description">${account.description}</div>` : ''}
                <button class="btn btn-buy">КУПИТЬ</button>
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
                        ? `<img src="${currentAccount.photo}" class="buy-photo" alt="${currentAccount.name}">`
                        : ''
                    }
                    <div style="margin-bottom: 20px;">
                        <h3 style="margin-bottom: 10px;">${currentAccount.name}</h3>
                        <p style="margin-bottom: 5px;"><strong>Ранг:</strong> ${currentAccount.rank}</p>
                        <p style="margin-bottom: 5px;"><strong>Герои:</strong> ${currentAccount.heroes}</p>
                        <p style="margin-bottom: 5px;"><strong>Скины:</strong> ${currentAccount.skins}</p>
                        <p style="margin-bottom: 15px; font-size: 1.3em; color: #4ade80;"><strong>Цена:</strong> ${currentAccount.price} ₽</p>
                        ${currentAccount.description ? `<p style="background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px;"><strong>Описание:</strong><br>${currentAccount.description}</p>` : ''}
                    </div>
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
    const message = `Привет! Хочу купить аккаунт "${currentAccount.name}" за ${currentAccount.price} ₽`;
    tg.openTelegramLink(`https://t.me/${SELLER_USERNAME}?text=${encodeURIComponent(message)}`);
    closeBuyModal();
}

document.getElementById('addForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const account = {
        name: document.getElementById('name').value,
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
            tg.HapticFeedback.notificationOccurred('success');
        }
    } catch (error) {
        console.error('Ошибка добавления:', error);
        tg.HapticFeedback.notificationOccurred('error');
    }
});

async function deleteAccount(id, event) {
    event.stopPropagation();
    if (!confirm('Удалить этот аккаунт?')) return;

    try {
        const response = await fetch(`/api/accounts/${id}`, { method: 'DELETE' });
        if (response.ok) {
            loadAccounts();
            tg.HapticFeedback.notificationOccurred('success');
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

loadAccounts();