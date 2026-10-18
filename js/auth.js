// ===== Логика страницы входа/регистрации =====

// переключение вкладок
const tabs = document.querySelectorAll('.auth-tab');
const forms = document.querySelectorAll('.auth-form');

tabs.forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;

        tabs.forEach(t => t.classList.toggle('is-active', t === tab));
        forms.forEach(f => f.classList.toggle('is-active', f.dataset.form === target));
    });
});

// ===== Форма входа =====
const loginForm = document.getElementById('loginForm');
const loginError = document.getElementById('loginError');

if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        loginError.textContent = '';

        const email = loginForm.email.value.trim();
        const password = loginForm.password.value;

        const btn = loginForm.querySelector('.auth-submit');
        btn.disabled = true;

        try {
            const res = await fetch('/api/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });
            const data = await res.json();

            if (!res.ok) {
                loginError.textContent = data.error || 'Не удалось войти';
                return;
            }

            window.location.href = './index.html';
        } catch (err) {
            loginError.textContent = 'Ошибка сети';
            console.error(err);
        } finally {
            btn.disabled = false;
        }
    });
}

// ===== Форма регистрации =====
const registerForm = document.getElementById('registerForm');
const registerError = document.getElementById('registerError');

if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        registerError.textContent = '';

        const username = registerForm.username.value.trim();
        const email = registerForm.email.value.trim();
        const password = registerForm.password.value;
        const passwordRepeat = registerForm.passwordRepeat.value;

        if (password !== passwordRepeat) {
            registerError.textContent = 'Пароли не совпадают';
            return;
        }

        const btn = registerForm.querySelector('.auth-submit');
        btn.disabled = true;

        try {
            const res = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, email, password })
            });
            const data = await res.json();

            if (!res.ok) {
                registerError.textContent = data.error || 'Не удалось зарегистрироваться';
                return;
            }

            window.location.href = './index.html';
        } catch (err) {
            registerError.textContent = 'Ошибка сети';
            console.error(err);
        } finally {
            btn.disabled = false;
        }
    });
}