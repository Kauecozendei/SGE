
document.addEventListener('DOMContentLoaded', () => {

    setDataAtualFin();

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair?')) return;
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    // Animação contadora dos cards
    animarCardsFinanceiro();

    // Busca e filtros
    document.getElementById('searchFin')?.addEventListener('input', filtrarFinanceiro);
    document.getElementById('filterMesFin')?.addEventListener('change', filtrarFinanceiro);
    document.getElementById('filterStatusFin')?.addEventListener('change', filtrarFinanceiro);

    // Paginação fake
    document.querySelectorAll('#paginationFin button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.querySelector('i')) return;
            document.querySelectorAll('#paginationFin button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Salvar cobrança
    document.getElementById('btnSalvarCobranca')?.addEventListener('click', () => {
        const aluno = document.getElementById('selectAlunoFin')?.value;
        const tipo  = document.getElementById('selectTipoCobranca')?.value;
        const valor = document.getElementById('inputValorCobranca')?.value;
        const venc  = document.getElementById('inputVencimentoCobranca')?.value;

        if (!aluno || !tipo || !valor || !venc) {
            showToast('Preencha todos os campos obrigatórios.', 'warning');
            return;
        }

        const btn = document.getElementById('btnSalvarCobranca');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Cobrança';
            toggleModal('modalCobranca', 'hide');
            document.getElementById('formCobranca')?.reset();
            showToast('Cobrança registrada com sucesso!', 'success');
        }, 1200);
    });

});

function setDataAtualFin() {
    const dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje  = new Date();
    const el    = document.getElementById('dataAtual');
    if (el) el.textContent = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;
}

/* Anima os valores dos cards financeiros com formato R$ */
function animarCardsFinanceiro() {
    document.querySelectorAll('.fin-card-valor').forEach(el => {
        const target   = parseInt(el.dataset.target) || 0;
        const duration = 1500;
        const start    = performance.now();

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3);
            const valor    = Math.floor(target * eased);
            el.textContent = `R$ ${valor.toLocaleString('pt-BR')}`;
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = `R$ ${target.toLocaleString('pt-BR')}`;
        }

        setTimeout(() => requestAnimationFrame(tick), 400);
    });
}

/* Filtra a tabela financeira por texto, mês e status */
function filtrarFinanceiro() {
    const q      = (document.getElementById('searchFin')?.value       || '').toLowerCase().trim();
    const mes    = (document.getElementById('filterMesFin')?.value    || '');
    const status = (document.getElementById('filterStatusFin')?.value || '').toLowerCase();
    let vis = 0;

    document.querySelectorAll('#tbodyFin tr').forEach(row => {
        const txt = row.textContent.toLowerCase();
        const okQ  = !q || txt.includes(q);
        const okM  = !mes || txt.includes(`/${mes}/`);
        const okS  = !status || txt.includes(status);
        const show = okQ && okM && okS;
        row.style.display = show ? '' : 'none';
        if (show) vis++;
    });

    const info = document.querySelector('.fin-pagination .pagination-info');
    if (info) info.textContent = `Exibindo ${vis} cobrança${vis !== 1 ? 's' : ''}`;
}

/**
 * Confirma pagamento e atualiza a linha
 * @param {string} nome
 */
function confirmarPagamento(nome) {
    if (!confirm(`Confirmar pagamento de ${nome}?`)) return;
    showLoading();
    setTimeout(() => {
        hideLoading();
        showToast(`Pagamento de ${nome} confirmado!`, 'success');
    }, 800);
}

/**
 * Visualiza recibo (simulação)
 * @param {number} id
 */
function verRecibo(id) {
    showToast(`Exibindo recibo #${id}...`, 'info');
}
