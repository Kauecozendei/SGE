
document.addEventListener('DOMContentLoaded', () => {

    // Bootstrap Tooltips 
    const tooltipEls = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (typeof bootstrap !== 'undefined' && tooltipEls.length > 0) {
        [...tooltipEls].map(el => new bootstrap.Tooltip(el));
    }

    // Sidebar global (funciona em todas as páginas com #sidebar) 
    initSidebarGlobal();

    // Definir link ativo na sidebar com base na URL atual
    marcarLinkAtivo();

    // Máscaras em todos os formulário
    setupMascarasGlobais();

    document.addEventListener('show.bs.modal', e => {
        e.target?.querySelectorAll('input').forEach(aplicarMascara);
    });

    // Verificar sessão do usuário (exceto em login.html e 404.html)
    const paginaAtual = window.location.pathname.split('/').pop();
    if (paginaAtual !== 'login.html' && paginaAtual !== '404.html' && paginaAtual !== '') {
        verificarSessaoUsuario();
    }

    // Configurar botão de Sair globalmente
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        e.stopImmediatePropagation(); // Impede outros listeners locais duplicados de rodarem nas páginas
        if (!confirm('Deseja realmente sair do sistema?')) return;
        
        showToast('Saindo do sistema...', 'warning');
        showLoading();
        
        fetch('../../Back-End/api/logout.php')
            .then(() => {
                setTimeout(() => {
                    window.location.href = 'login.html';
                }, 1000);
            })
            .catch(err => {
                console.error('Erro ao efetuar logout:', err);
                window.location.href = 'login.html';
            });
    });

});

//   SIDEBAR
/**
 * Inicializa a sidebar com overlay mobile e botão de toggle.
 * Chamada automaticamente no DOMContentLoaded.
 */
function initSidebarGlobal() {
    const sidebar = document.getElementById('sidebar');
    if (!sidebar) return;

    // Criar overlay de fundo (mobile)
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    // Fechar sidebar ao clicar no overlay
    overlay.addEventListener('click', () => {
        sidebar.classList.remove('collapsed');
        overlay.classList.remove('active');
    });

    // Observar mudança de classe na sidebar para mostrar/ocultar overlay
    const observer = new MutationObserver(() => {
        const isMobile = window.innerWidth <= 991;
        if (isMobile && sidebar.classList.contains('collapsed')) {
            overlay.classList.add('active');
        } else {
            overlay.classList.remove('active');
        }
    });
    observer.observe(sidebar, { attributes: true, attributeFilter: ['class'] });

    // Ajustar comportamento ao redimensionar janela
    window.addEventListener('resize', () => {
        if (window.innerWidth > 991) {
            overlay.classList.remove('active');
        }
    });
}

/* Abre ou fecha a sidebar (chamado pelo botão hamburger) */
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    if (sidebar) sidebar.classList.toggle('collapsed');
}

/* Marca o link ativo na sidebar com base no nome do arquivo atual*/
function marcarLinkAtivo() {
    const paginaAtual = window.location.pathname.split('/').pop();
    document.querySelectorAll('.sidebar-link').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href === paginaAtual) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

//   TOAST (Notificações)
/**
 * Exibe uma notificação toast na tela
 * @param {string} message  - Texto da notificação
 * @param {string} type     - 'success' | 'danger' | 'warning' | 'info'
 */
function showToast(message, type = 'success') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container position-fixed top-0 end-0 p-3';
        container.style.zIndex = '1090';
        document.body.appendChild(container);
    }

    const map = {
        success: { bg: 'bg-success', icon: 'bi-check-circle-fill' },
        danger:  { bg: 'bg-danger',  icon: 'bi-exclamation-circle-fill' },
        warning: { bg: 'bg-warning text-dark', icon: 'bi-exclamation-triangle-fill' },
        info:    { bg: 'bg-primary', icon: 'bi-info-circle-fill' },
    };
    const { bg, icon } = map[type] || map.info;
    const id = 'toast-' + Date.now();

    // Sanitizar mensagem para prevenir XSS
    const safeMessage = escapeHtml(message);
    container.insertAdjacentHTML('beforeend', `
        <div id="${id}" class="toast align-items-center text-white ${bg} border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="bi ${icon}" style="font-size:1.1rem;"></i>
                    <span style="font-weight:700;font-size:0.88rem;">${safeMessage}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Fechar"></button>
            </div>
        </div>
    `);

    const toastEl = document.getElementById(id);
    if (typeof bootstrap !== 'undefined') {
        const bsToast = new bootstrap.Toast(toastEl, { delay: 3500 });
        bsToast.show();
        toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove());
    }
}

//   LOADING SPINNER

/* Exibe o overlay de carregamento global */
function showLoading() {
    let overlay = document.getElementById('global-loading');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'global-loading';
        overlay.className = 'loading-overlay';
        overlay.innerHTML = `
            <div class="spinner-border spinner-custom" role="status">
                <span class="visually-hidden">Carregando...</span>
            </div>
        `;
        document.body.appendChild(overlay);
    }
    void overlay.offsetWidth; // forçar reflow
    overlay.classList.add('active');
}

/* Oculta o overlay de carregamento global */
function hideLoading() {
    const overlay = document.getElementById('global-loading');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300);
    }
}

//   MODAIS
/**
 * Abre ou fecha um modal Bootstrap via JavaScript
 * @param {string} modalId - ID do elemento modal
 * @param {'show'|'hide'} action
 */
function toggleModal(modalId, action = 'show') {
    if (typeof bootstrap === 'undefined') return;
    const el = document.getElementById(modalId);
    if (!el) return;
    const instance = bootstrap.Modal.getInstance(el) || new bootstrap.Modal(el);
    action === 'show' ? instance.show() : instance.hide();
}

//   UTILITÁRIOS
/**
 * Formata uma data para o padrão brasileiro DD/MM/AAAA
 * @param {Date} date
 * @returns {string}
 */
function formatarData(date = new Date()) {
    return `${String(date.getDate()).padStart(2,'0')}/${String(date.getMonth()+1).padStart(2,'0')}/${date.getFullYear()}`;
}

/**
 * Formata hora para HH:MM
 * @param {Date} date
 * @returns {string}
 */
function formatarHora(date = new Date()) {
    return `${String(date.getHours()).padStart(2,'0')}:${String(date.getMinutes()).padStart(2,'0')}`;
}

//   MÁSCARAS

const MASCARAS_BR = {
    cpf: {
        placeholder: '000.000.000-00',
        maxDigits: 11,
        maxLength: 14,
        inputMode: 'numeric',
        apenasNumeros: true,
        format(d) {
            if (d.length > 9) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9, 11)}`;
            if (d.length > 6) return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6)}`;
            if (d.length > 3) return `${d.slice(0, 3)}.${d.slice(3)}`;
            return d;
        },
        isComplete(v) { return v.length === 11; },
    },
    cnpj: {
        placeholder: '00.000.000/0000-00',
        maxDigits: 14,
        maxLength: 18,
        inputMode: 'numeric',
        apenasNumeros: true,
        format(d) {
            if (d.length > 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12, 14)}`;
            if (d.length > 8)  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
            if (d.length > 5)  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
            if (d.length > 2)  return `${d.slice(0, 2)}.${d.slice(2)}`;
            return d;
        },
        isComplete(v) { return v.length === 14; },
    },
    rg: {
        placeholder: '00.000.000-0',
        maxDigits: 9,
        maxLength: 12,
        inputMode: 'text',
        apenasNumeros: false,
        format(d) {
            const u = d.toUpperCase();
            if (u.length > 8) return `${u.slice(0, 2)}.${u.slice(2, 5)}.${u.slice(5, 8)}-${u.slice(8, 9)}`;
            if (u.length > 5) return `${u.slice(0, 2)}.${u.slice(2, 5)}.${u.slice(5)}`;
            if (u.length > 2) return `${u.slice(0, 2)}.${u.slice(2)}`;
            return u;
        },
        isComplete(v) { return v.length >= 8; },
    },
    telefone: {
        placeholder: '(00) 00000-0000',
        maxDigits: 11,
        maxLength: 15,
        inputMode: 'tel',
        apenasNumeros: true,
        format(d) {
            if (!d) return '';
            if (d.length === 1) return `(${d}`;
            if (d.length === 2) return `(${d})`;
            const ddd = d.slice(0, 2);
            const num = d.slice(2);
            const celular = num[0] === '9';
            const bloco = celular ? 5 : 4;
            if (num.length <= bloco) return `(${ddd}) ${num}`;
            return `(${ddd}) ${num.slice(0, bloco)}-${num.slice(bloco, bloco + 4)}`;
        },
        isComplete(v) { return v.length === 10 || v.length === 11; },
    },
    cep: {
        placeholder: '00000-000',
        maxDigits: 8,
        maxLength: 9,
        inputMode: 'numeric',
        apenasNumeros: true,
        format(d) {
            return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5, 8)}` : d;
        },
        isComplete(v) { return v.length === 8; },
    },
    data: {
        placeholder: 'DD/MM/AAAA',
        maxDigits: 8,
        maxLength: 10,
        inputMode: 'numeric',
        apenasNumeros: true,
        format(d) {
            if (d.length > 4) return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4, 8)}`;
            if (d.length > 2) return `${d.slice(0, 2)}/${d.slice(2)}`;
            return d;
        },
        isComplete(v) { return v.length === 8; },
    },
};

const TIPOS_MASCARA_IGNORAR = new Set([
    'hidden', 'file', 'checkbox', 'radio', 'submit', 'reset',
    'button', 'range', 'color', 'password', 'email', 'date',
]);

function extrairDigitos(valor, apenasNumeros) {
    return apenasNumeros
        ? valor.replace(/\D/g, '')
        : valor.replace(/[^a-zA-Z0-9]/g, '');
}

function charValido(c, apenasNumeros) {
    return apenasNumeros ? (c >= '0' && c <= '9') : /[a-zA-Z0-9]/.test(c);
}

/* Sanitiza, limita e formata o valor do input; reposiciona o cursor. */
function processarMascara(input, cfg, cursorPos = input.selectionStart) {
    const valorAntes = input.value;
    const strip = v => extrairDigitos(v, cfg.apenasNumeros);

    let raw = strip(valorAntes);
    if (raw.length > cfg.maxDigits) raw = raw.slice(0, cfg.maxDigits);

    const formatado = cfg.format(raw);
    if (input.value !== formatado) input.value = formatado;

    const validosAntes = strip(valorAntes.slice(0, cursorPos ?? 0)).length;
    let novaCursor = formatado.length;
    let conta = 0;
    for (let i = 0; i < formatado.length; i++) {
        if (charValido(formatado[i], cfg.apenasNumeros)) conta++;
        if (conta === validosAntes) { novaCursor = i + 1; break; }
    }
    if (validosAntes === 0) novaCursor = 0;

    try { input.setSelectionRange(novaCursor, novaCursor); } catch (_) { /* mobile */ }

    return raw;
}

function aplicarValidacaoVisual(input, isValid) {
    const raw = extrairDigitos(input.value, input.dataset.maskType !== 'rg');
    if (!raw.length) {
        input.classList.remove('is-valid', 'is-invalid');
        return;
    }
    input.classList.toggle('is-valid', isValid);
    input.classList.toggle('is-invalid', !isValid);
}

/* Detecta o tipo de máscara: data-mask > name/id > type. */
function detectarTipoMascara(input) {
    const attr = (input.dataset.mask || '').toLowerCase();
    if (attr && MASCARAS_BR[attr]) return attr;

    const tipo = (input.type || '').toLowerCase();
    const name = (input.name || '').toLowerCase();
    const id   = (input.id   || '').toLowerCase();

    if (TIPOS_MASCARA_IGNORAR.has(tipo)) return '';

    if (name.includes('cpf') || id.includes('cpf')) return 'cpf';
    if (name.includes('cnpj') || id.includes('cnpj')) return 'cnpj';
    if (name === 'rg' || id === 'rg') return 'rg';
    if (name.includes('tel') || id.includes('tel') || tipo === 'tel') return 'telefone';
    if (name.includes('celular') || id.includes('celular')) return 'telefone';
    if (name.includes('fone') || id.includes('fone')) return 'telefone';
    if (name.includes('cep') || id === 'cep' || id.includes('cep')) return 'cep';
    if (tipo === 'text' && (name.includes('data') || id.includes('data') ||
        name.includes('nasc') || id.includes('nasc'))) return 'data';
    if (tipo === 'number' || input.classList.contains('numeric')) return 'numerico';

    return '';
}

function vincularMascara(input, tipo) {
    if (input.dataset.maskBound === '1') return;

    const cfg = MASCARAS_BR[tipo];
    if (!cfg) return;

    input.dataset.maskBound = '1';
    input.dataset.maskType  = tipo;
    input.setAttribute('maxlength', String(cfg.maxLength));
    input.setAttribute('autocomplete', 'off');
    input.inputMode = cfg.inputMode;
    if (cfg.placeholder) input.placeholder = cfg.placeholder;

    const executar = (cursor) => {
        const raw = processarMascara(input, cfg, cursor);
        aplicarValidacaoVisual(input, cfg.isComplete(raw));
    };

    input.addEventListener('input', () => executar(input.selectionStart));
    input.addEventListener('paste', e => {
        e.preventDefault();
        const texto = (e.clipboardData || window.clipboardData).getData('text') || '';
        const selStart = input.selectionStart ?? 0;
        const selEnd   = input.selectionEnd ?? selStart;
        input.value = input.value.slice(0, selStart) + texto + input.value.slice(selEnd);
        executar(selStart + texto.length);
    });
    input.addEventListener('drop', e => {
        e.preventDefault();
        const texto = e.dataTransfer.getData('text') || '';
        const selStart = input.selectionStart ?? 0;
        const selEnd   = input.selectionEnd ?? selStart;
        input.value = input.value.slice(0, selStart) + texto + input.value.slice(selEnd);
        executar(selStart + texto.length);
    });
    input.addEventListener('beforeinput', e => {
        if (e.isComposing) return;
        if (e.inputType === 'insertFromPaste' || e.inputType === 'insertFromDrop') return;
        const deleteTypes = ['deleteContentBackward', 'deleteContentForward', 'deleteByCut', 'deleteByDrag'];
        if (deleteTypes.includes(e.inputType)) return;

        const inserido = e.data ?? '';
        if (cfg.apenasNumeros && inserido && /\D/.test(inserido)) {
            e.preventDefault();
            return;
        }
        if (!cfg.apenasNumeros && inserido && /[^a-zA-Z0-9]/i.test(inserido)) {
            e.preventDefault();
            return;
        }

        const selStart = input.selectionStart ?? 0;
        const selEnd   = input.selectionEnd ?? selStart;
        const antes = extrairDigitos(input.value.slice(0, selStart), cfg.apenasNumeros);
        const depois = extrairDigitos(input.value.slice(selEnd), cfg.apenasNumeros);
        const novo = extrairDigitos(inserido, cfg.apenasNumeros);

        if (antes.length + novo.length + depois.length > cfg.maxDigits) {
            e.preventDefault();
        }
    });
    input.addEventListener('blur', () => executar(input.value.length));
}

function aplicarMascara(input) {
    if (!input || input.tagName !== 'INPUT') return;

    const tipo = detectarTipoMascara(input);
    if (!tipo) return;

    if (tipo === 'numerico') {
        if (input.dataset.maskBound === '1') return;
        input.dataset.maskBound = '1';
        input.inputMode = 'numeric';
        input.addEventListener('input', () => {
            const maxlen = parseInt(input.getAttribute('maxlength') || '999', 10);
            const maxval = parseInt(input.getAttribute('max') || '999999999', 10);
            let v = input.value.replace(/\D/g, '').slice(0, maxlen);
            if (v && parseInt(v, 10) > maxval) v = String(maxval);
            input.value = v;
        });
        return;
    }

    vincularMascara(input, tipo);
}

function setupMascarasGlobais() {
    document.querySelectorAll('input').forEach(aplicarMascara);
}

/** Atalhos públicos */
function mascaraCpf(input)      { input.dataset.mask = 'cpf';      aplicarMascara(input); }
function mascaraCnpj(input)     { input.dataset.mask = 'cnpj';     aplicarMascara(input); }
function mascaraRg(input)       { input.dataset.mask = 'rg';       aplicarMascara(input); }
function mascaraTelefone(input) { input.dataset.mask = 'telefone'; aplicarMascara(input); }
function mascaraCep(input)      { input.dataset.mask = 'cep';      aplicarMascara(input); }
function mascaraData(input)     { input.dataset.mask = 'data';     aplicarMascara(input); }
function mascaraNumerica(input) { input.classList.add('numeric');  aplicarMascara(input); }

/*  Define valor já formatado ou bruto (aplica máscara e limite). */
function definirValorMascarado(input, valor) {
    if (!input) return;
    aplicarMascara(input);
    const cfg = MASCARAS_BR[input.dataset.maskType];
    if (!cfg) {
        input.value = valor ?? '';
        return;
    }
    let raw = extrairDigitos(String(valor ?? ''), cfg.apenasNumeros).slice(0, cfg.maxDigits);
    input.value = cfg.format(raw);
    aplicarValidacaoVisual(input, cfg.isComplete(raw));
}

/*  Retorna somente dígitos (ou alfanumérico no RG). */
function valorSemMascara(inputOrId) {
    const el = typeof inputOrId === 'string' ? document.getElementById(inputOrId) : inputOrId;
    if (!el) return '';
    const rg = el.dataset.maskType === 'rg';
    return extrairDigitos(el.value, !rg);
}

// Auxiliar global para evitar injeção de HTML na exibição de dados
function escapeHtml(text) {
    if (!text) return '';
    return text
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// ── CSRF TOKEN ──────────────────────────────────────────────────
// Armazenado em memória após login/verificação de sessão
let _csrfToken = '';

/**
 * Retorna o token CSRF armazenado.
 * @returns {string}
 */
function getCsrfToken() {
    return _csrfToken;
}

/**
 * Wrapper global para fetch com CSRF automático.
 * Use no lugar de fetch() para requisições POST ao backend.
 * @param {string} url
 * @param {Object} options - opções do fetch (body, method, etc.)
 * @returns {Promise<Response>}
 */
function sgeFetch(url, options = {}) {
    const method = (options.method || 'GET').toUpperCase();
    const headers = options.headers || {};

    // Adicionar CSRF token em requisições POST
    if (method === 'POST' && _csrfToken) {
        headers['X-CSRF-Token'] = _csrfToken;
    }

    return fetch(url, { ...options, method, headers });
}

/**
 * Verifica se a sessão do usuário está ativa no PHP.
 * Se sim, atualiza a saudação no topo. Se não, redireciona para a página de login.
 */
function verificarSessaoUsuario() {
    fetch('../../Back-End/api/get_usuario_logado.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                // Armazenar CSRF token retornado pelo servidor
                if (data.csrf_token) {
                    _csrfToken = data.csrf_token;
                }

                // Atualiza saudação na topbar
                const greetingEl = document.querySelector('.topbar-greeting');
                if (greetingEl) {
                    greetingEl.textContent = `Olá, ${data.nome} 👋`;
                }

                // Se estiver na tela de perfil, preenche os dados dinâmicos do usuário
                const perfilNomeDisplay = document.getElementById('perfilNomeDisplay');
                if (perfilNomeDisplay) {
                    perfilNomeDisplay.textContent = data.nome;
                    
                    const perfilCargoLabel = perfilNomeDisplay.nextElementSibling;
                    if (perfilCargoLabel && data.cargo) {
                        perfilCargoLabel.innerHTML = `<i class="bi bi-shield-check-fill me-1 text-primary"></i>${escapeHtml(data.cargo)}`;
                    }
                    
                    const perfilEmailLabel = perfilCargoLabel ? perfilCargoLabel.nextElementSibling : null;
                    if (perfilEmailLabel && data.email) {
                        perfilEmailLabel.innerHTML = `<i class="bi bi-envelope-fill me-1"></i>${escapeHtml(data.email)}`;
                    }
                }

                const inputNome = document.getElementById('inputPerfilNome');
                if (inputNome) inputNome.value = data.nome || '';

                const inputEmail = document.getElementById('inputPerfilEmail');
                if (inputEmail) inputEmail.value = data.email || '';

                const inputCargo = document.getElementById('inputPerfilCargo');
                if (inputCargo) {
                    inputCargo.value = data.cargo || '';
                    inputCargo.disabled = true; // Cargo não é editável pelo próprio usuário
                }

                const inputTel = document.getElementById('inputPerfilTel');
                if (inputTel && data.telefone) {
                    definirValorMascarado(inputTel, data.telefone);
                }

                const inputCpf = document.getElementById('inputPerfilCpf');
                if (inputCpf && data.cpf) {
                    definirValorMascarado(inputCpf, data.cpf);
                }

                const inputDataNasc = document.getElementById('inputPerfilDataNasc');
                if (inputDataNasc && data.data_nascimento) {
                    inputDataNasc.value = data.data_nascimento;
                }
            } else {
                window.location.href = 'login.html';
            }
        })
        .catch(err => {
            console.error('Erro ao validar sessão:', err);
        });
}
