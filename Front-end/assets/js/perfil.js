
document.addEventListener('DOMContentLoaded', () => {

    // Data atual
    const dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje  = new Date();
    const el    = document.getElementById('dataAtual');
    if (el) el.textContent = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;


    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair?')) return;
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    // Tabs de navegação 
    document.querySelectorAll('.perfil-tab').forEach(tab => {
        tab.addEventListener('click', () => {
            const secao = tab.dataset.section;

            // Atualizar tabs
            document.querySelectorAll('.perfil-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');

            // Exibir secção
            document.querySelectorAll('.perfil-section').forEach(s => s.classList.remove('active'));
            document.getElementById(`section-${secao}`)?.classList.add('active');
        });
    });

    // Upload de foto do perfil 
    document.getElementById('inputFotoPerfil')?.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            const avatar = document.getElementById('perfilAvatarDisplay');
            if (avatar) {
                avatar.innerHTML = `<img src="${e.target.result}" alt="Avatar" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            }
            showToast('Foto atualizada! Salve para confirmar.', 'info');
        };
        reader.readAsDataURL(file);
    });

    // Formulário de Dados Pessoais 
    document.getElementById('formPerfilDados')?.addEventListener('submit', e => {
        e.preventDefault();
        if (!validarFormDados()) return;
        salvarDados();
    });

    // Formulário de Senha 
    document.getElementById('formPerfilSenha')?.addEventListener('submit', e => {
        e.preventDefault();
        if (!validarFormSenha()) return;
        salvarSenha();
    });

    // Força da senha em tempo real  
    document.getElementById('inputNovaSenha')?.addEventListener('input', function () {
        avaliarForcaSenha(this.value);
    });

    // Carregar preferências salvas 
    carregarPreferencias();

});

// ── Funções auxiliares ────────────────────────────────────────────────────────


/**
 * Valida campos de dados pessoais
 * @returns {boolean}
 */
function validarFormDados() {
    const campos = ['inputPerfilNome', 'inputPerfilEmail'];
    let ok = true;

    campos.forEach(id => {
        const el = document.getElementById(id);
        if (!el || !el.value.trim()) {
            if (el) el.style.borderColor = 'var(--cor-erro)';
            ok = false;
        } else {
            el.style.borderColor = '';
        }
    });

    if (!ok) { showToast('Preencha os campos obrigatórios.', 'warning'); return false; }
    return true;
}

/**
 * Valida campos de senha
 * @returns {boolean}
 */
function validarFormSenha() {
    const atual  = document.getElementById('inputSenhaAtual')?.value;
    const nova   = document.getElementById('inputNovaSenha')?.value;
    const conf   = document.getElementById('inputConfNovaSenha')?.value;

    if (!atual || !nova || !conf) {
        showToast('Preencha todos os campos de senha.', 'warning');
        return false;
    }
    if (nova.length < 8) {
        showToast('A nova senha deve ter no mínimo 8 caracteres.', 'warning');
        document.getElementById('inputNovaSenha').style.borderColor = 'var(--cor-erro)';
        return false;
    }
    if (nova !== conf) {
        showToast('As senhas não coincidem.', 'warning');
        document.getElementById('inputConfNovaSenha').style.borderColor = 'var(--cor-erro)';
        return false;
    }

    if (atual !== '123456') {
        showToast('Senha atual incorreta.', 'danger');
        document.getElementById('inputSenhaAtual').style.borderColor = 'var(--cor-erro)';
        return false;
    }

    return true;
}

/* Simula salvar dados pessoais */
function salvarDados() {
    const btn = document.getElementById('btnSalvarDados');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    }

    setTimeout(() => {
        // Atualizar nome exibido no header do perfil
        const novoNome = document.getElementById('inputPerfilNome')?.value;
        if (novoNome) {
            const display = document.getElementById('perfilNomeDisplay');
            if (display) display.textContent = novoNome;
        }

        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Alterações';
        }
        showToast('Dados atualizados com sucesso!', 'success');
    }, 1000);
}

/* Simula salvar nova senha */
function salvarSenha() {
    const btn = document.getElementById('btnSalvarSenha');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Atualizando...';
    }

    setTimeout(() => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-lock-fill me-1"></i>Atualizar Senha';
        }
        document.getElementById('formPerfilSenha')?.reset();
        const bar  = document.getElementById('strengthBar');
        const text = document.getElementById('strengthText');
        if (bar)  { bar.className = 'senha-strength-bar'; bar.style.width = '0'; }
        if (text) text.textContent = '';
        showToast('Senha atualizada com sucesso!', 'success');
    }, 1200);
}

/**
 * Avalia a força da senha e atualiza a barra visual
 * @param {string} senha
 */
function avaliarForcaSenha(senha) {
    const bar  = document.getElementById('strengthBar');
    const text = document.getElementById('strengthText');
    if (!bar || !text) return;

    bar.className = 'senha-strength-bar';

    if (!senha) { text.textContent = ''; bar.style.width = '0'; return; }

    const forte = senha.length >= 10 && /[A-Z]/.test(senha) && /[0-9]/.test(senha) && /[^A-Za-z0-9]/.test(senha);
    const media = senha.length >= 8  && (/[A-Z]/.test(senha) || /[0-9]/.test(senha));

    if (forte) {
        bar.classList.add('forte');
        text.textContent  = '✅ Senha forte';
        text.style.color  = 'var(--cor-sucesso)';
    } else if (media) {
        bar.classList.add('media');
        text.textContent  = '⚠️ Senha média';
        text.style.color  = 'var(--cor-aviso)';
    } else {
        bar.classList.add('fraca');
        text.textContent  = '❌ Senha fraca';
        text.style.color  = 'var(--cor-erro)';
    }
}

/* Salva preferências no localStorage */
function salvarPreferencias() {
    const prefs = {
        emailNotif:    document.getElementById('prefEmailNotif')?.checked   ?? true,
        welcomeToast:  document.getElementById('prefWelcomeToast')?.checked ?? true,
        alertaReinc:   document.getElementById('prefAlertaReinc')?.checked  ?? true,
        sidebarFixed:  document.getElementById('prefSidebarFixed')?.checked ?? true,
    };
    localStorage.setItem('sge_prefs', JSON.stringify(prefs));
    showToast('Preferências salvas com sucesso!', 'success');
}

/* Carrega preferências do localStorage e aplica nos toggles */
function carregarPreferencias() {
    const raw = localStorage.getItem('sge_prefs');
    if (!raw) return;

    try {
        const prefs = JSON.parse(raw);
        if (prefs.emailNotif   !== undefined) { const el = document.getElementById('prefEmailNotif');   if (el) el.checked = prefs.emailNotif; }
        if (prefs.welcomeToast !== undefined) { const el = document.getElementById('prefWelcomeToast'); if (el) el.checked = prefs.welcomeToast; }
        if (prefs.alertaReinc  !== undefined) { const el = document.getElementById('prefAlertaReinc');  if (el) el.checked = prefs.alertaReinc; }
        if (prefs.sidebarFixed !== undefined) { const el = document.getElementById('prefSidebarFixed'); if (el) el.checked = prefs.sidebarFixed; }
    } catch (_) { /* JSON inválido, ignora */ }
}

/* Reseta o formulário de dados pessoais para os valores originais */
function resetFormPerfil() {
    document.getElementById('formPerfilDados')?.reset();
    document.querySelectorAll('#section-dados input').forEach(el => el.style.borderColor = '');
    showToast('Alterações descartadas.', 'info');
}
