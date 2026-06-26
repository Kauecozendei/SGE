/**
 * registro-diario.js
 * Módulo de Registro Diário — Alimentação e Banho
 * Sistema Mundo Encantado
 */

'use strict';

/* ══════════════════════════════════════════
   INICIALIZAÇÃO
══════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', () => {
    preencherDataHoraAtual();
    inicializarTogglesBanho();
    inicializarTooltips();
});

/** Preenche os campos de data/hora com o valor atual */
function preencherDataHoraAtual() {
    const agora  = new Date();
    const data   = agora.toISOString().split('T')[0];
    const hora   = agora.toTimeString().slice(0, 5);

    const campos = ['rdDataAlim', 'rdHoraAlim', 'rdDataBanho', 'rdHoraBanho', 'alimData', 'alimHora', 'banhoData', 'banhoHora', 'histDataInicio', 'histDataFim'];
    campos.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.type === 'date') el.value = data;
        if (el.type === 'time') el.value = hora;
    });
}

function inicializarTooltips() {
    const tooltipEls = document.querySelectorAll('[title]');
    tooltipEls.forEach(el => {
        try { new bootstrap.Tooltip(el, { trigger: 'hover', placement: 'top' }); } catch(e) {}
    });
}


/* ══════════════════════════════════════════
   TROCA DE ABAS PRINCIPAIS
══════════════════════════════════════════ */
function trocarAba(btn) {
    // Desativar todos os botões de aba
    document.querySelectorAll('.rd-tab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    // Esconder todos os painéis
    document.querySelectorAll('.rd-painel').forEach(p => p.style.display = 'none');

    // Mostrar painel correspondente
    const targetId = btn.getAttribute('data-target');
    const target = document.getElementById(targetId);
    if (target) target.style.display = 'block';
}

/* ══════════════════════════════════════════
   SUB-ABAS DE REFEIÇÃO (Café da Manhã, Almoço...)
══════════════════════════════════════════ */
function trocarSubAba(btn) {
    document.querySelectorAll('.rd-subtab-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    // Futura integração: filtrar a lista pelo tipo de refeição
    const refeicao = btn.getAttribute('data-refeicao');
    filtrarListaPorRefeicao(refeicao);
}

function filtrarListaPorRefeicao(refeicao) {
    // Placeholder para integração futura com PHP/banco
    // Por enquanto, nenhum card é filtrado pois é mock estático
    console.info('[Registro Diário] Sub-aba selecionada:', refeicao);
}


/* ══════════════════════════════════════════
   FILTROS – ALIMENTAÇÃO
══════════════════════════════════════════ */
function filtrarAlim(status, btn) {
    document.querySelectorAll('#painel-alimentacao .rd-quick-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('#listaAlim .rd-aluno-card').forEach(card => {
        if (status === 'todos') {
            card.style.display = '';
            return;
        }
        const cardStatus = card.getAttribute('data-status');
        card.style.display = (cardStatus === status) ? '' : 'none';
    });
}

function filtrarTurmaAlim(turma) {
    document.querySelectorAll('#listaAlim .rd-aluno-card').forEach(card => {
        if (!turma) { card.style.display = ''; return; }
        card.style.display = (card.getAttribute('data-turma') === turma) ? '' : 'none';
    });
}

function buscarAluno(tipo, query) {
    const listaId = tipo === 'alim' ? 'listaAlim' : 'listaBanho';
    const q = query.toLowerCase().trim();
    document.querySelectorAll(`#${listaId} .rd-aluno-card`).forEach(card => {
        const nome = card.querySelector('.rd-aluno-nome')?.textContent.toLowerCase() || '';
        card.style.display = (!q || nome.includes(q)) ? '' : 'none';
    });
}

function marcarTodosAlim() {
    const checkboxes = document.querySelectorAll('#listaAlim .rd-checkbox-custom');
    const todosChecados = [...checkboxes].every(c => c.checked);
    checkboxes.forEach(c => { c.checked = !todosChecados; });
    atualizarContadoresAlim();
}

function atualizarContadoresAlim() {
    const total    = document.querySelectorAll('#listaAlim .rd-aluno-card').length;
    const marcados = document.querySelectorAll('#listaAlim .rd-checkbox-custom:checked').length;
    const el_fin   = document.getElementById('cntAlimFinalizados');
    const el_pend  = document.getElementById('cntAlimPendentes');
    if (el_fin)  el_fin.textContent  = marcados;
    if (el_pend) el_pend.textContent = total - marcados;
}

// Atualiza contadores ao interagir com checkboxes
document.addEventListener('change', e => {
    if (e.target.matches('#listaAlim .rd-checkbox-custom')) atualizarContadoresAlim();
    if (e.target.matches('#listaBanho .rd-checkbox-custom')) atualizarContadoresBanho();
});


/* ══════════════════════════════════════════
   FILTROS – BANHO
══════════════════════════════════════════ */
function filtrarBanho(status, btn) {
    document.querySelectorAll('#painel-banho .rd-quick-filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    document.querySelectorAll('#listaBanho .rd-aluno-card').forEach(card => {
        if (status === 'todos') { card.style.display = ''; return; }
        const cardStatus = card.getAttribute('data-status');
        card.style.display = (cardStatus === status) ? '' : 'none';
    });
}

function filtrarTurmaBanho(turma) {
    document.querySelectorAll('#listaBanho .rd-aluno-card').forEach(card => {
        if (!turma) { card.style.display = ''; return; }
        card.style.display = (card.getAttribute('data-turma') === turma) ? '' : 'none';
    });
}

function marcarTodosBanho() {
    const checkboxes = document.querySelectorAll('#listaBanho .rd-checkbox-custom');
    const todosChecados = [...checkboxes].every(c => c.checked);
    checkboxes.forEach(c => { c.checked = !todosChecados; });
    atualizarContadoresBanho();
}

function atualizarContadoresBanho() {
    const total    = document.querySelectorAll('#listaBanho .rd-aluno-card').length;
    const marcados = document.querySelectorAll('#listaBanho .rd-checkbox-custom:checked').length;
    const el_fin   = document.getElementById('cntBanhoFinalizados');
    const el_pend  = document.getElementById('cntBanhoPendentes');
    if (el_fin)  el_fin.textContent  = marcados;
    if (el_pend) el_pend.textContent = total - marcados;
}


/* ══════════════════════════════════════════
   TOGGLES SIM/NÃO (Modal Banho)
══════════════════════════════════════════ */
function inicializarTogglesBanho() {
    // Mapeamento: grupo → campo hidden
    const grupos = [
        { grupoId: 'banhoBanhoRealizado', hiddenId: 'inputBanhoRealizado' },
        { grupoId: 'banhoTrocaRoupa',     hiddenId: 'inputTrocaRoupa'     },
        { grupoId: 'banhoTrocaFralda',    hiddenId: 'inputTrocaFralda'    },
    ];
    grupos.forEach(({ grupoId, hiddenId }) => {
        const grupo = document.getElementById(grupoId);
        if (!grupo) return;
        grupo.querySelectorAll('.rd-toggle-btn').forEach(btn => {
            btn.setAttribute('data-hidden', hiddenId);
        });
    });
}

function ativarToggle(btn, campo) {
    const grupo = btn.closest('.rd-toggle-group');
    if (!grupo) return;
    grupo.querySelectorAll('.rd-toggle-btn').forEach(b => {
        b.classList.remove('active');
    });
    btn.classList.add('active');

    // Atualizar hidden input
    const hiddenId = `input${campo.split('_').map(w => w[0].toUpperCase() + w.slice(1)).join('')}`;
    const hidden = document.getElementById(hiddenId) || document.querySelector(`[name="${campo}"]`);
    if (hidden) hidden.value = btn.getAttribute('data-value');
}


/* ══════════════════════════════════════════
   EDITAR / EXCLUIR – ALIMENTAÇÃO
══════════════════════════════════════════ */
function editarRegistroAlim(id) {
    // Abre o modal com os dados pré-preenchidos (mock)
    document.getElementById('alimRegistroId').value = id;
    document.getElementById('modalAlimTitle').innerHTML =
        '<i class="bi bi-cup-straw me-2"></i>Editar Registro de Alimentação';

    const modal = new bootstrap.Modal(document.getElementById('modalAlimentacao'));
    modal.show();
}

let _callbackExclusao = null;

function excluirRegistroAlim(id) {
    _callbackExclusao = () => {
        const card = document.querySelector(`#listaAlim [data-id="${id}"]`);
        if (card) {
            card.style.transition = 'opacity 0.3s';
            card.style.opacity = '0';
            setTimeout(() => { card.remove(); atualizarContadoresAlim(); }, 300);
        }
        bootstrap.Modal.getInstance(document.getElementById('modalConfirmExclusao'))?.hide();
        showToast('Registro excluído com sucesso.', 'danger');
    };
    document.getElementById('msgConfirmExclusao').textContent =
        'Tem certeza que deseja excluir este registro de alimentação? Esta ação não pode ser desfeita.';
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmExclusao'));
    modal.show();
    document.getElementById('btnConfirmExclusao').onclick = _callbackExclusao;
}


/* ══════════════════════════════════════════
   EDITAR / EXCLUIR – BANHO
══════════════════════════════════════════ */
function editarRegistroBanho(id) {
    document.getElementById('banhoRegistroId').value = id;
    document.getElementById('modalBanhoTitle').innerHTML =
        '<i class="bi bi-droplet-fill me-2"></i>Editar Registro de Banho';
    const modal = new bootstrap.Modal(document.getElementById('modalBanho'));
    modal.show();
}

function excluirRegistroBanho(id) {
    _callbackExclusao = () => {
        const card = document.querySelector(`#listaBanho [data-id="${id}"]`);
        if (card) {
            card.style.transition = 'opacity 0.3s';
            card.style.opacity = '0';
            setTimeout(() => { card.remove(); atualizarContadoresBanho(); }, 300);
        }
        bootstrap.Modal.getInstance(document.getElementById('modalConfirmExclusao'))?.hide();
        showToast('Registro excluído com sucesso.', 'danger');
    };
    document.getElementById('msgConfirmExclusao').textContent =
        'Tem certeza que deseja excluir este registro de banho? Esta ação não pode ser desfeita.';
    const modal = new bootstrap.Modal(document.getElementById('modalConfirmExclusao'));
    modal.show();
    document.getElementById('btnConfirmExclusao').onclick = _callbackExclusao;
}


/* ══════════════════════════════════════════
   VALIDAÇÃO E SALVAMENTO – ALIMENTAÇÃO
══════════════════════════════════════════ */
function salvarFormAlimentacao() {
    const form = document.getElementById('formAlimentacao');
    if (!form) return;

    // Validação básica HTML5
    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    // Validar seleção de radio buttons
    const tipoSelecionado = form.querySelector('input[name="tipo_refeicao"]:checked');
    const quantSelecionada = form.querySelector('input[name="quantidade"]:checked');
    if (!tipoSelecionado) {
        showToast('Selecione o tipo de refeição.', 'warning'); return;
    }
    if (!quantSelecionada) {
        showToast('Selecione a quantidade consumida.', 'warning'); return;
    }

    // Sucesso (mock — integração com PHP fica aqui)
    const modalEl = document.getElementById('modalAlimentacao');
    bootstrap.Modal.getInstance(modalEl)?.hide();
    form.classList.remove('was-validated');
    form.reset();
    showToast('Registro de alimentação salvo com sucesso!', 'success');
}

function salvarRegistrosAlim() {
    // Salva todos os registros marcados (integração futura com PHP)
    const marcados = document.querySelectorAll('#listaAlim .rd-checkbox-custom:checked').length;
    showToast(`${marcados} registro(s) de alimentação salvos!`, 'success');
}


/* ══════════════════════════════════════════
   VALIDAÇÃO E SALVAMENTO – BANHO
══════════════════════════════════════════ */
function salvarFormBanho() {
    const form = document.getElementById('formBanho');
    if (!form) return;

    if (!form.checkValidity()) {
        form.classList.add('was-validated');
        return;
    }

    const banhoRealizado = document.getElementById('inputBanhoRealizado')?.value;
    if (!banhoRealizado) {
        showToast('Informe se o banho foi realizado.', 'warning'); return;
    }

    const modalEl = document.getElementById('modalBanho');
    bootstrap.Modal.getInstance(modalEl)?.hide();
    form.classList.remove('was-validated');
    form.reset();
    // Resetar toggles
    document.querySelectorAll('.rd-toggle-btn').forEach(b => b.classList.remove('active'));
    showToast('Registro de banho salvo com sucesso!', 'success');
}

function salvarRegistrosBanho() {
    const marcados = document.querySelectorAll('#listaBanho .rd-checkbox-custom:checked').length;
    showToast(`${marcados} registro(s) de banho salvos!`, 'success');
}


/* ══════════════════════════════════════════
   HISTÓRICO – FILTROS
══════════════════════════════════════════ */
function filtrarHistorico() {
    const aluno     = document.getElementById('histAluno')?.value;
    const dataIni   = document.getElementById('histDataInicio')?.value;
    const dataFim   = document.getElementById('histDataFim')?.value;
    const tipo      = document.getElementById('histTipo')?.value;

    if (!aluno && !dataIni) {
        showToast('Selecione ao menos um aluno ou período para filtrar.', 'warning');
        return;
    }

    // Integração futura: AJAX/PHP → buscar dados do banco
    console.info('[Histórico] Filtros:', { aluno, dataIni, dataFim, tipo });
    showToast('Filtrando histórico... (integração com banco de dados pendente)', 'info');
}

function limparFiltroHistorico() {
    ['histAluno', 'histTipo'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    preencherDataHoraAtual();
}


/* ══════════════════════════════════════════
   TOAST (feedback visual)
══════════════════════════════════════════ */
function showToast(msg, tipo = 'success') {
    const toastEl  = document.getElementById('rdToast');
    const toastMsg = document.getElementById('rdToastMsg');
    if (!toastEl || !toastMsg) return;

    // Definir cor pelo tipo
    const cores = {
        success: 'bg-success',
        danger:  'bg-danger',
        warning: 'bg-warning text-dark',
        info:    'bg-primary',
    };
    toastEl.className = `toast align-items-center text-white border-0 ${cores[tipo] || 'bg-success'}`;
    if (tipo === 'warning') toastEl.classList.add('text-dark');
    toastMsg.textContent = msg;

    const toast = new bootstrap.Toast(toastEl, { delay: 3500 });
    toast.show();
}


/* ══════════════════════════════════════════
   RESET DO MODAL AO ABRIR COMO "NOVO"
══════════════════════════════════════════ */
document.getElementById('btnNovaAlimentacao')?.addEventListener('click', () => {
    const form = document.getElementById('formAlimentacao');
    if (form) { form.reset(); form.classList.remove('was-validated'); }
    document.getElementById('alimRegistroId').value = '';
    document.getElementById('modalAlimTitle').innerHTML =
        '<i class="bi bi-cup-straw me-2"></i>Registrar Alimentação';
    preencherDataHoraAtual();
});

document.getElementById('btnNovoBanho')?.addEventListener('click', () => {
    const form = document.getElementById('formBanho');
    if (form) { form.reset(); form.classList.remove('was-validated'); }
    document.getElementById('banhoRegistroId').value = '';
    document.getElementById('modalBanhoTitle').innerHTML =
        '<i class="bi bi-droplet-fill me-2"></i>Registrar Banho';
    document.querySelectorAll('.rd-toggle-btn').forEach(b => b.classList.remove('active'));
    ['inputBanhoRealizado', 'inputTrocaRoupa', 'inputTrocaFralda'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    preencherDataHoraAtual();
});
