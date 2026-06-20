
let listCobrancas = [];

document.addEventListener('DOMContentLoaded', () => {

    setDataAtualFin();

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair?')) return;
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    // Carregar dados e popular dropdown de alunos
    carregarDadosFinanceiros();
    carregarAlunosDropdown();

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
    document.getElementById('btnSalvarCobranca')?.addEventListener('click', async () => {
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
        
        try {
            const form = document.getElementById('formCobranca');
            const formData = new FormData(form);

            const response = await fetch('../../Back-End/api/save_cobranca.php', {
                method: 'POST',
                body: formData
            });
            const data = await response.json();

            if (data.status === 'success' || data.status === 'warning') {
                toggleModal('modalCobranca', 'hide');
                form.reset();
                showToast(data.message, data.status === 'warning' ? 'warning' : 'success');
                carregarDadosFinanceiros();
            } else {
                showToast(data.message, 'danger');
            }
        } catch (error) {
            console.error("Erro ao salvar cobrança:", error);
            showToast('Erro de conexão ao salvar cobrança.', 'danger');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Cobrança';
        }
    });

});

function setDataAtualFin() {
    const dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje  = new Date();
    const el    = document.getElementById('dataAtual');
    if (el) el.textContent = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;
}

/* Carrega dados do backend */
async function carregarDadosFinanceiros() {
    showLoading();
    try {
        const response = await fetch('../../Back-End/api/get_financeiro.php');
        const res = await response.json();
        hideLoading();

        if (res.status === 'success' || res.status === 'warning') {
            listCobrancas = res.data;

            // Atualizar valores nos cards
            const cardPrevisto = document.querySelector('.fin-card.azul .fin-card-valor');
            const cardRecebido = document.querySelector('.fin-card.verde .fin-card-valor');
            const cardPendente = document.querySelector('.fin-card.laranja .fin-card-valor');
            const cardAtrasado = document.querySelector('.fin-card.vermelho .fin-card-valor');

            if (cardPrevisto) cardPrevisto.dataset.target = res.total_previsto;
            if (cardRecebido) cardRecebido.dataset.target = res.recebido;
            if (cardPendente) cardPendente.dataset.target = res.pendente;
            if (cardAtrasado) cardAtrasado.dataset.target = res.atrasado;

            animarCardsFinanceiro();

            // Atualizar subtextos
            const subPrevisto = document.querySelector('.fin-card.azul .fin-card-sub');
            const subRecebido = document.querySelector('.fin-card.verde .fin-card-sub');
            const subPendente = document.querySelector('.fin-card.laranja .fin-card-sub');
            const subAtrasado = document.querySelector('.fin-card.vermelho .fin-card-sub');

            if (subPrevisto) subPrevisto.textContent = `${res.counts.total} cobrança${res.counts.total !== 1 ? 's' : ''} registrada${res.counts.total !== 1 ? 's' : ''}`;
            if (subRecebido) subRecebido.textContent = `${res.counts.pago} pagamento${res.counts.pago !== 1 ? 's' : ''} confirmado${res.counts.pago !== 1 ? 's' : ''}`;
            if (subPendente) subPendente.textContent = `${res.counts.pendente} em aberto`;
            if (subAtrasado) subAtrasado.textContent = `${res.counts.atrasado} vencida${res.counts.atrasado !== 1 ? 's' : ''}`;

            // Renderizar tabela
            renderizarTabelaFinanceira();
        } else {
            showToast('Erro ao carregar dados financeiros: ' + res.message, 'danger');
        }
    } catch (error) {
        hideLoading();
        console.error("Erro de conexão financeiro:", error);
        showToast('Erro de conexão ao buscar dados financeiros.', 'danger');
    }
}

/* Popula a tabela financeira */
function renderizarTabelaFinanceira() {
    const tbody = document.getElementById('tbodyFin');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (listCobrancas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Nenhuma cobrança registrada.</td></tr>';
        const info = document.querySelector('.pagination-info');
        if (info) info.textContent = 'Exibindo 0 cobranças';
        return;
    }

    listCobrancas.forEach(c => {
        const tr = document.createElement('tr');
        
        let rowClass = '';
        let statusBadge = '';
        let valorClass = 'fin-valor-pendente';

        if (c.status === 'pago') {
            statusBadge = '<span class="fin-status pago"><i class="bi bi-check-circle-fill"></i>Pago</span>';
            valorClass = 'fin-valor-pago';
        } else if (c.status === 'atrasado') {
            statusBadge = '<span class="fin-status atrasado"><i class="bi bi-exclamation-circle-fill"></i>Atrasado</span>';
            rowClass = 'row-atrasado';
            valorClass = 'fin-valor-atrasado';
        } else {
            statusBadge = '<span class="fin-status pendente"><i class="bi bi-clock-fill"></i>Pendente</span>';
        }

        tr.className = rowClass;

        // format date YYYY-MM-DD to DD/MM/YYYY
        let dataVencFmt = c.data_vencimento;
        if (c.data_vencimento) {
            const partes = c.data_vencimento.split('-');
            if (partes.length === 3) {
                dataVencFmt = `${partes[2]}/${partes[1]}/${partes[0]}`;
            }
        }

        let acoes = `<div class="fin-actions d-flex gap-2">`;
        if (c.status === 'pago') {
            acoes += `<button class="btn-action-sm" title="Ver recibo" onclick="verRecibo(${c.id})"><i class="bi bi-receipt"></i></button>`;
        } else {
            acoes += `<button class="btn-action-sm success" title="Confirmar pagamento" onclick="confirmarPagamento(${c.id}, '${escapeQuote(c.aluno)}')"><i class="bi bi-check2-circle"></i></button>`;
        }
        acoes += `<button class="btn-action-sm danger" title="Cancelar cobrança" onclick="cancelarCobranca(${c.id})"><i class="bi bi-x-circle"></i></button>`;
        acoes += `</div>`;

        tr.innerHTML = `
            <td>${escapeHtml(c.aluno)}</td>
            <td>${escapeHtml(c.turma || 'Sem Turma')}</td>
            <td>${escapeHtml(c.tipo)}</td>
            <td>${escapeHtml(dataVencFmt)}</td>
            <td class="${valorClass}">R$ ${parseFloat(c.valor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
            <td>${statusBadge}</td>
            <td>${acoes}</td>
        `;
        tbody.appendChild(tr);
    });

    filtrarFinanceiro();
}

/* Popula select com lista de alunos reais */
async function carregarAlunosDropdown() {
    try {
        const response = await fetch('../../Back-End/api/get_alunos.php');
        const res = await response.json();

        if (res.status === 'success') {
            const select = document.getElementById('selectAlunoFin');
            if (select) {
                select.innerHTML = '<option value="">Selecionar aluno</option>';
                res.data.forEach(a => {
                    const option = document.createElement('option');
                    option.value = a.id;
                    option.textContent = a.nome;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error("Erro ao buscar alunos para dropdown:", error);
    }
}

/* Anima os valores dos cards financeiros com formato R$ */
function animarCardsFinanceiro() {
    document.querySelectorAll('.fin-card-valor').forEach(el => {
        const target   = parseFloat(el.dataset.target) || 0;
        const duration = 1200;
        const start    = performance.now();

        function tick(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3);
            const valor    = target * eased;
            el.textContent = `R$ ${valor.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
            if (progress < 1) requestAnimationFrame(tick);
            else el.textContent = `R$ ${target.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}`;
        }

        requestAnimationFrame(tick);
    });
}

/* Filtra a tabela financeira por texto, mês e status */
function filtrarFinanceiro() {
    const q      = (document.getElementById('searchFin')?.value       || '').toLowerCase().trim();
    const mes    = (document.getElementById('filterMesFin')?.value    || '');
    const status = (document.getElementById('filterStatusFin')?.value || '').toLowerCase();
    let vis = 0;

    document.querySelectorAll('#tbodyFin tr').forEach(row => {
        // Ignora linha vazia
        if (row.cells.length === 1 && row.cells[0].colSpan === 7) return;

        const txt = row.textContent.toLowerCase();
        const okQ  = !q || txt.includes(q);
        
        // Mês no formato DD/MM/YYYY
        // O valor do filtro mes é 01, 02, etc. A data vencimento está na 4ª coluna (índice 3)
        const cellData = row.cells[3]?.textContent || '';
        const okM  = !mes || cellData.includes(`/${mes}/`);
        
        const okS  = !status || txt.includes(status);
        const show = okQ && okM && okS;
        
        row.style.setProperty('display', show ? '' : 'none', 'important');
        if (show) vis++;
    });

    const info = document.querySelector('.pagination-info');
    if (info) info.textContent = `Exibindo ${vis} de ${listCobrancas.length} cobrança${listCobrancas.length !== 1 ? 's' : ''}`;
}

/**
 * Confirma pagamento no banco de dados
 */
async function confirmarPagamento(id, nome) {
    if (!confirm(`Confirmar pagamento da cobrança de ${nome}?`)) return;
    
    showLoading();
    try {
        const formData = new FormData();
        formData.append('id', id);

        const response = await fetch('../../Back-End/api/confirmar_pagamento.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        hideLoading();

        if (data.status === 'success' || data.status === 'warning') {
            showToast(data.message, data.status === 'warning' ? 'warning' : 'success');
            carregarDadosFinanceiros();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        hideLoading();
        console.error("Erro ao confirmar pagamento:", error);
        showToast('Erro de conexão ao confirmar pagamento.', 'danger');
    }
}

/**
 * Cancela cobrança no banco de dados
 */
async function cancelarCobranca(id) {
    if (!confirm('Deseja realmente cancelar/excluir esta cobrança? Esta ação não pode ser desfeita.')) return;

    showLoading();
    try {
        const formData = new FormData();
        formData.append('id', id);

        const response = await fetch('../../Back-End/api/delete_cobranca.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        hideLoading();

        if (data.status === 'success' || data.status === 'warning') {
            showToast(data.message, data.status === 'warning' ? 'warning' : 'success');
            carregarDadosFinanceiros();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        hideLoading();
        console.error("Erro ao cancelar cobrança:", error);
        showToast('Erro de conexão ao cancelar cobrança.', 'danger');
    }
}

/**
 * Visualiza recibo (simulação)
 */
function verRecibo(id) {
    showToast(`Recibo #${id} gerado com sucesso! (Imprimir/Salvar PDF)`, 'info');
}

// Helpers para escapar caracteres
function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function escapeQuote(text) {
    if (!text) return '';
    return text.toString().replace(/'/g, "\\'");
}
