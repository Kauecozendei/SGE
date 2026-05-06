
document.addEventListener('DOMContentLoaded', () => {
    // Inicialização de tooltips do Bootstrap (caso necessário futuramente)
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    if (typeof bootstrap !== 'undefined' && tooltipTriggerList.length > 0) {
        [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl));
    }
});

// Função para abrir/fechar a sidebar 
function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const content = document.querySelector('.content-area');
    
    if (sidebar) {
        sidebar.classList.toggle('collapsed');
    }
    if (content) {
        content.classList.toggle('expanded');
    }
}

/**
   Utilitário de Toast (Notificações)
   Cria um toast dinâmico na tela
  @param {string} message  A mensagem a ser exibida
  @param {string} type  Tipo do toast ('success', 'danger', 'warning', 'info')
 */
function showToast(message, type = 'success') {
    // Verificar se container de toasts existe, senão criar
    let toastContainer = document.getElementById('toast-container');
    if (!toastContainer) {
        toastContainer = document.createElement('div');
        toastContainer.id = 'toast-container';
        toastContainer.className = 'toast-container position-fixed top-0 end-0 p-3';
        toastContainer.style.zIndex = '1055';
        document.body.appendChild(toastContainer);
    }

    // Configurar cor baseada no tipo
    let bgClass = 'bg-primary';
    let icon = 'bi-info-circle';
    
    switch(type) {
        case 'success': 
            bgClass = 'bg-success'; 
            icon = 'bi-check-circle';
            break;
        case 'danger': 
            bgClass = 'bg-danger'; 
            icon = 'bi-exclamation-circle';
            break;
        case 'warning': 
            bgClass = 'bg-warning text-dark'; 
            icon = 'bi-exclamation-triangle';
            break;
    }

    const toastId = 'toast-' + Date.now();
    
    const toastHtml = `
        <div id="${toastId}" class="toast align-items-center text-white ${bgClass} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body d-flex align-items-center">
                    <i class="bi ${icon} me-2" style="font-size: 1.2rem;"></i>
                    <span>${message}</span>
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    `;

    toastContainer.insertAdjacentHTML('beforeend', toastHtml);
    
    const toastElement = document.getElementById(toastId);
    
    if (typeof bootstrap !== 'undefined') {
        const bsToast = new bootstrap.Toast(toastElement, { delay: 3000 });
        bsToast.show();
        
        // Remover do DOM após esconder
        toastElement.addEventListener('hidden.bs.toast', () => {
            toastElement.remove();
        });
    }
}

// Funções de Loading Spinner
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
    
    // Forçar reflow
    void overlay.offsetWidth;
    overlay.classList.add('active');
}

function hideLoading() {
    const overlay = document.getElementById('global-loading');
    if (overlay) {
        overlay.classList.remove('active');
        setTimeout(() => overlay.remove(), 300); // Aguarda transição CSS
    }
}

/**
 * Função para fechar/abrir modais de forma programática
 * @param {string} modalId - ID do modal a ser operado
 * @param {string} action - 'show' ou 'hide'
 */
function toggleModal(modalId, action = 'show') {
    if (typeof bootstrap === 'undefined') return;
    
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
        // Pega instância existente ou cria nova
        const bsModal = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
        if (action === 'show') {
            bsModal.show();
        } else {
            bsModal.hide();
        }
    }
}
