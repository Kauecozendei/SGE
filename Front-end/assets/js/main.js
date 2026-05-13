
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

});


//   SIDEBAR

/* Inicializa a sidebar com overlay mobile e botão de toggle.
 * Chamada automaticamente no DOMContentLoaded. */
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

/* Marca o link ativo na sidebar com base no nome do arquivo atual */
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


// (Notificações)
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

    container.insertAdjacentHTML('beforeend', `
        <div id="${id}" class="toast align-items-center text-white ${bg} border-0 shadow" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center gap-2">
                    <i class="bi ${icon}" style="font-size:1.1rem;"></i>
                    <span style="font-weight:700;font-size:0.88rem;">${message}</span>
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

/**
 * Oculta o overlay de carregamento global
 */
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

/**
 * Máscara simples para CPF: 000.000.000-00
 * @param {HTMLInputElement} input
 */
function mascaraCpf(input) {
    input.addEventListener('input', () => {
        let v = input.value.replace(/\D/g, '').slice(0, 11);
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d)/, '$1.$2');
        v = v.replace(/(\d{3})(\d{1,2})$/, '$1-$2');
        input.value = v;
    });
}

/**
 * Máscara simples para Telefone: (00) 00000-0000
 * @param {HTMLInputElement} input
 */
function mascaraTelefone(input) {
    input.addEventListener('input', () => {
        let v = input.value.replace(/\D/g, '').slice(0, 11);
        v = v.replace(/(\d{2})(\d)/, '($1) $2');
        v = v.replace(/(\d{5})(\d{1,4})$/, '$1-$2');
        input.value = v;
    });
}
