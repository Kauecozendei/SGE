
document.addEventListener('DOMContentLoaded', () => {

    /* Elementos */
    const form        = document.getElementById('loginForm');
    const emailInput  = document.getElementById('email');
    const passInput   = document.getElementById('password');
    const btnLogin    = document.getElementById('btnLogin');
    const btnText     = document.getElementById('btnLoginText');
    const alertBox    = document.getElementById('loginAlert');
    const alertMsg    = document.getElementById('loginAlertMsg');
    const alertIcon   = document.getElementById('loginAlertIcon');
    const toggleBtn   = document.getElementById('togglePassword');
    const eyeIcon     = document.getElementById('eyeIcon');
    const card        = document.getElementById('loginCard');
    const linkEsqueci = document.getElementById('linkEsqueci');

    /* Toggle de Senha */
    toggleBtn.addEventListener('click', () => {
        const isPass = passInput.type === 'password';
        passInput.type       = isPass ? 'text'         : 'password';
        eyeIcon.className    = isPass ? 'bi bi-eye-slash' : 'bi bi-eye';
        toggleBtn.setAttribute('aria-label', isPass ? 'Ocultar senha' : 'Mostrar senha');
    });

    /* Limpar erros ao digitar */
    [emailInput, passInput].forEach(input => {
        input.addEventListener('input', () => {
            input.classList.remove('error');
            ocultarAlerta();
        });
    });

    /* Submit */
    form.addEventListener('submit', e => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const pass  = passInput.value.trim();

        /* Campos vazios */
        let temErro = false;
        if (!email)  { emailInput.classList.add('error'); temErro = true; }
        if (!pass)   { passInput.classList.add('error');  temErro = true; }
        if (temErro) {
            mostrarAlerta('Preencha todos os campos.');
            shakeCard();
            return;
        }

        /* Formato de e-mail */
        if (!email.includes('@') || !email.includes('.')) {
            emailInput.classList.add('error');
            mostrarAlerta('Informe um e-mail válido.');
            shakeCard();
            return;
        }

        /* Loading */
        btnLogin.disabled = true;
        btnText.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Verificando...
        `;

        /* Simula autenticação — substituir por fetch() ao backend PHP */
        setTimeout(() => {
            if (email === 'admin@gmail.com' && pass === '123456') {

                /* ── Sucesso ── */
                btnText.innerHTML = `<i class="bi bi-check-circle-fill me-2"></i>Acesso liberado!`;
                btnLogin.classList.add('sucesso');

                showToast('Bem-vindo ao Sistema! 👋', 'success');
                showLoading();

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1100);

            } else {

                /* ── Erro ── */
                emailInput.classList.add('error');
                passInput.classList.add('error');
                mostrarAlerta('E-mail ou senha inválidos.');
                shakeCard();

                btnLogin.disabled = false;
                btnLogin.classList.remove('sucesso');
                btnText.innerHTML = 'Entrar no Sistema';
            }
        }, 1500);
    });

    /* ── Esqueci minha senha ───────────────────────────────── */
    linkEsqueci.addEventListener('click', e => {
        e.preventDefault();
        mostrarAlerta('Entre em contato com o administrador do sistema.', true);
    });

    /* ── Helpers ───────────────────────────────────────────── */
    function mostrarAlerta(msg, info = false) {
        alertMsg.textContent = msg;
        alertBox.classList.remove('d-none', 'info');

        if (info) {
            alertBox.classList.add('info');
            alertIcon.className = 'bi bi-info-circle-fill me-1';
        } else {
            alertIcon.className = 'bi bi-exclamation-circle-fill me-1';
        }

        /* Força reflow para reiniciar animação */
        void alertBox.offsetWidth;
        alertBox.style.animation = 'none';
        requestAnimationFrame(() => {
            alertBox.style.animation = '';
        });
    }

    function ocultarAlerta() {
        alertBox.classList.add('d-none');
    }

    function shakeCard() {
        card.classList.remove('shake-animation');
        void card.offsetWidth;
        card.classList.add('shake-animation');
        card.addEventListener('animationend', () => {
            card.classList.remove('shake-animation');
        }, { once: true });
    }

});
