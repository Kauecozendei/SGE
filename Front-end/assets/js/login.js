
document.addEventListener('DOMContentLoaded', () => {
    const form = document.getElementById('loginForm');
    const email = document.getElementById('email');
    const password = document.getElementById('password');
    const btnLogin = document.getElementById('btnLogin');
    const alertBox = document.getElementById('loginAlert');
    const card = document.querySelector('.login-card');
    const togglePassword = document.getElementById('togglePassword');

    // Mostrar/Ocultar senha
    togglePassword.addEventListener('click', () => {
        const isPassword = password.type === 'password';
        password.type = isPassword ? 'text' : 'password';

        const icon = togglePassword.querySelector('i');
        icon.classList.toggle('bi-eye', !isPassword);
        icon.classList.toggle('bi-eye-slash', isPassword);
    });

    // Esconder alerta ao digitar
    [email, password].forEach(input => {
        input.addEventListener('input', () => alertBox.classList.add('d-none'));
    });

    // Exibir erro
    function showError(message) {
        alertBox.textContent = message;
        alertBox.classList.remove('d-none');

        card.classList.remove('shake-animation');
        void card.offsetWidth;
        card.classList.add('shake-animation');
    }

    // Submit
    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailValue = email.value.trim();
        const passwordValue = password.value.trim();

        if (!emailValue || !passwordValue) {
            showError('Preencha todos os campos.');
            return;
        }

        btnLogin.disabled = true;
        btnLogin.innerHTML = `
            <span class="spinner-border spinner-border-sm me-2"></span>
            Entrando...
        `;

        setTimeout(async () => {
            try {
                const formData = new FormData();
                formData.append('email', emailValue);
                formData.append('senha', passwordValue);

                const response = await fetch('../../Back-End/login_funcionario.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.status === 'success') {
                    showToast(data.message, 'success');
                    showLoading();

                    setTimeout(() => {
                        window.location.href = 'dashboard.html';
                    }, 1200);
                } else {
                    showError(data.message || 'E-mail ou senha inválidos.');
                    btnLogin.disabled = false;
                    btnLogin.innerHTML = 'Entrar no Sistema';
                }
            } catch (error) {
                console.error("Erro no login:", error);
                showError('Erro de conexão. Tente novamente mais tarde.');
                btnLogin.disabled = false;
                btnLogin.innerHTML = 'Entrar no Sistema';
            }
        }, 1500);
    });
});
