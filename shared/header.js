// ===== Шапка: логика авторизации =====

async function initHeader() {
    const mount = document.getElementById('headerAuth');
    const rubliBlock = document.querySelector('.rubli');   // блок баланса
    if (!mount) return;

    // ждём, пока auth-state.js узнает, кто мы
    const user = await window.currentUserReady;

    // ===== Баланс показываем только залогиненным =====
    if (rubliBlock) {
        rubliBlock.style.display = user ? '' : 'none';
    }

    // ===== Кнопка «Крутить колесо» в баннере =====
    const openWheel = document.getElementById('openWheel');
    if (openWheel) {
        if (!user) {
            openWheel.disabled = true;
            openWheel.style.opacity = '0.5';
            openWheel.style.cursor = 'not-allowed';
            openWheel.title = 'Войдите, чтобы играть';
        } else {
            openWheel.disabled = false;
            openWheel.style.opacity = '';
            openWheel.style.cursor = '';
            openWheel.title = '';
        }
    }

    if (user) {
        mount.innerHTML = `
            <div class="profile profile--menu" id="profileMenu">
                <a href="#!" class="avatarka">
                    <img src="/img/Аватар.png" alt="">
                </a>
                <span class="profile__name">${escapeHtml(user.username)}</span>

                <div class="profile__dropdown">
                    <a href="./profile.html" class="profile__item">Профиль</a>
                    <button class="profile__item profile__item--danger" id="logoutBtn">Выйти из аккаунта</button>
                </div>
            </div>
        `;

        const profileMenu = document.getElementById('profileMenu');
        const logoutBtn = document.getElementById('logoutBtn');

        profileMenu.addEventListener('click', (e) => {
            if (e.target.closest('#logoutBtn')) return;
            profileMenu.classList.toggle('is-open');
        });

        document.addEventListener('click', (e) => {
            if (!profileMenu.contains(e.target)) {
                profileMenu.classList.remove('is-open');
            }
        });

        logoutBtn.addEventListener('click', async (e) => {
            e.stopPropagation();
            await fetch('/api/logout', { method: 'POST' });
            location.reload();
        });
    } else {
        mount.innerHTML = `
            <a href="/auth.html" class="header__login">Войти</a>
        `;
    }
}

function escapeHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

document.addEventListener('DOMContentLoaded', initHeader);