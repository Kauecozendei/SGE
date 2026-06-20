
let todosOsHorarios = [];
let abaAtiva = 'hoje';

document.addEventListener('DOMContentLoaded', () => {

    // Data atual
    const dias = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje = new Date();
    const dataFmt = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;

    const elData = document.getElementById('dataAtual');
    const elEsData = document.getElementById('esDataHoje');
    if (elData)   elData.textContent = dataFmt;
    if (elEsData) elEsData.textContent = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`;

    // Carregar horários e estatísticas do banco de dados
    carregarHorarios();

    // Tabs de filtro
    document.querySelectorAll('.tab-filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            abaAtiva = btn.dataset.tab;
            renderizarTabelas();
            showToast(`Exibindo registros de: ${btn.textContent.trim()}`, 'info');
        });
    });

    // Busca dinâmica
    const searchInput = document.getElementById('searchAluno');
    if (searchInput) {
        searchInput.addEventListener('input', renderizarTabelas);
    }

    // Filtros de select
    ['filterTurma', 'filterStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', renderizarTabelas);
        }
    });

    // Paginação fake
    document.querySelectorAll('.es-pagination-btns button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.querySelector('i')) return; // setas
            document.querySelectorAll('.es-pagination-btns button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Botão confirmar saída
    const btnConfSaida = document.getElementById('btnConfirmarSaida');
    if (btnConfSaida) {
        btnConfSaida.addEventListener('click', async () => {
            const alunoId = document.getElementById('btnConfirmarSaida').dataset.id;
            const obs = document.getElementById('saidaObs')?.value || '';
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalSaida'));
            
            try {
                const formData = new FormData();
                formData.append('aluno_id', alunoId);
                formData.append('tipo', 'saida');
                formData.append('observacao', obs);

                const response = await fetch('../../Back-End/insercoes/registrar_horario.php', {
                    method: 'POST',
                    body: formData
                });

                const data = await response.json();

                if (data.status === 'success' || data.status === 'warning') {
                    if (modal) modal.hide();
                    showToast(data.message, 'success');
                    carregarHorarios();
                } else {
                    showToast(data.message, 'danger');
                }
            } catch (error) {
                showToast('Erro de conexão.', 'danger');
            }
        });
    }

});

/**
 * Faz fetch na API e carrega os horários, estatísticas e reincidentes
 */
async function carregarHorarios() {
    try {
        const response = await fetch('../../Back-End/api/listar_horarios.php');
        const res = await response.json();

        if (res.status === 'success') {
            todosOsHorarios = res.data || [];
            
            // 1. Atualizar cards de status e disparar animação
            if (res.stats) {
                const elAtrasados = document.querySelector('.status-card.azul .status-numero');
                const elExcedentes = document.querySelector('.status-card.verde .status-numero');
                const elManha = document.querySelector('.status-card.laranja .status-numero');
                const elDevolucoes = document.querySelector('.status-card.vermelho .status-numero');

                if (elAtrasados) elAtrasados.dataset.target = res.stats.atrasados_hoje;
                if (elExcedentes) elExcedentes.dataset.target = res.stats.excedentes_hoje;
                if (elManha) elManha.dataset.target = res.stats.alunos_manha;
                if (elDevolucoes) elDevolucoes.dataset.target = res.stats.devolucoes_hoje;

                animarCardsStatus();
            }

            // 2. Atualizar alertas de reincidentes
            renderizarReincidentes(res.reincidentes);

            // 3. Renderizar as tabelas
            renderizarTabelas();
        } else {
            showToast('Erro ao carregar horários do banco.', 'danger');
        }
    } catch (error) {
        console.error('Erro de conexão ao carregar horários.', error);
        showToast('Erro de conexão ao carregar dados.', 'danger');
    }
}

/**
 * Anima os números dos cards de status
 */
function animarCardsStatus() {
    document.querySelectorAll('.status-card .status-numero').forEach(el => {
        const target = parseInt(el.dataset.target || el.textContent) || 0;
        el.textContent = '0';
        const dur = 1000;
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        }
        setTimeout(() => requestAnimationFrame(tick), 100);
    });
}

/**
 * Renderiza alertas de reincidentes dinamicamente
 */
function renderizarReincidentes(reincidentes) {
    const alertSec = document.getElementById('alertaReincidentes');
    if (!alertSec) return;

    if (reincidentes && reincidentes.length > 0) {
        alertSec.style.display = 'block';
        let html = `
            <div class="es-alert-title">
                <i class="bi bi-exclamation-triangle-fill"></i>
                ALERTA — REINCIDENTES EM ATRASO (ÚLTIMOS 30 DIAS)
            </div>
        `;
        reincidentes.forEach(r => {
            html += `
            <div class="d-flex align-items-center justify-content-between flex-wrap gap-2 mt-2 pb-2 border-bottom border-secondary border-opacity-10">
                <div class="d-flex align-items-center gap-2">
                    <div class="aluno-avatar" style="width:32px;height:32px;font-size:0.7rem;display:flex;align-items:center;justify-content:center;background:var(--cor-destaque-laranja);color:#fff;border-radius:50%;font-weight:700;">${escapeHtml(r.avatar)}</div>
                    <div>
                        <strong style="font-size:0.82rem;display:block;">${escapeHtml(r.aluno)}</strong>
                        <span style="font-size:0.72rem;color:var(--cor-texto-secundario);display:block;">${escapeHtml(r.detalhes)}</span>
                    </div>
                </div>
                <button class="btn-quick verde" style="margin:0;padding:0.4rem 0.8rem;font-size:0.75rem;" onclick="notificarResponsavel('${escapeHtml(r.aluno)}', '${escapeHtml(r.responsavel)}')">
                    <i class="bi bi-chat-dots"></i> Notificar Responsável
                </button>
            </div>
            `;
        });
        alertSec.innerHTML = html;
    } else {
        alertSec.style.display = 'none';
    }
}

/**
 * Renderiza os dados filtrados nas tabelas de entradas e saídas
 */
function renderizarTabelas() {
    const tbodyE = document.querySelector('#tbodyEntradas') || document.querySelector('#tabelaEntradas tbody');
    const tbodyS = document.querySelector('#tabelaSaidas tbody');
    
    if (tbodyE) tbodyE.innerHTML = '';
    if (tbodyS) tbodyS.innerHTML = '';

    // 1. Filtro de Aba
    let filtrados = todosOsHorarios;
    if (abaAtiva === 'hoje') {
        filtrados = todosOsHorarios.filter(h => eDataHoje(h.data));
    } else if (abaAtiva === 'semana') {
        filtrados = todosOsHorarios.filter(h => dataNaSemanaAtual(h.data));
    }

    // 2. Filtro de Busca Dinâmica (Input)
    const busca = (document.getElementById('searchAluno')?.value || '').toLowerCase().trim();
    if (busca) {
        filtrados = filtrados.filter(h => 
            h.aluno.toLowerCase().includes(busca) || 
            (h.turma && h.turma.toLowerCase().includes(busca)) ||
            (h.responsavel && h.responsavel.toLowerCase().includes(busca))
        );
    }

    // 3. Filtro de Select de Turma
    const filtroTurma = document.getElementById('filterTurma')?.value || '';
    if (filtroTurma) {
        let termo = '';
        if (filtroTurma === 'turma-a') termo = 'turma a';
        else if (filtroTurma === 'turma-b') termo = 'turma b';
        else if (filtroTurma === 'turma-c') termo = 'turma c';
        
        if (termo) {
            filtrados = filtrados.filter(h => h.turma && h.turma.toLowerCase().includes(termo));
        }
    }

    // 4. Filtro de Select de Status
    const filtroStatus = document.getElementById('filterStatus')?.value || '';
    if (filtroStatus) {
        filtrados = filtrados.filter(h => h.status_presenca === filtroStatus || (filtroStatus === 'saiu' && h.status_presenca === 'excedente'));
    }

    let countEntradas = 0;
    let countSaidas = 0;

    filtrados.forEach(h => {
        if (h.tipo === 'entrada') {
            countEntradas++;
            const tr = document.createElement('tr');
            
            // Colunas de Entrada (7 colunas):
            // 1. Aluno
            // 2. Turma
            // 3. Horário previsto
            // 4. Entrada real
            // 5. Atraso
            // 6. Monitorar
            // 7. Ações
            
            const atrasoTexto = h.atraso ? `<span class="badge bg-danger">${h.atraso}</span>` : '<span class="badge bg-success">No horário</span>';
            const monitorarHtml = h.atraso ? `
                <button class="btn-quick vermelho" style="margin:0;padding:0.25rem 0.5rem;font-size:0.7rem;border-radius:4px;" onclick="notificarResponsavel('${escapeHtml(h.aluno)}', '${escapeHtml(h.responsavel)}')">
                    <i class="bi bi-chat-dots"></i> Notificar
                </button>
            ` : '<span class="text-success" style="font-size:0.8rem;"><i class="bi bi-check2-all"></i> Ok</span>';
            
            tr.innerHTML = `
                <td><strong>${escapeHtml(h.aluno)}</strong></td>
                <td>${escapeHtml(h.turma || 'Sem Turma')} <small class="text-muted">(${escapeHtml(h.periodo)})</small></td>
                <td>${escapeHtml(h.horario_prev)}</td>
                <td>${escapeHtml(h.horario)}</td>
                <td>${atrasoTexto}</td>
                <td>${monitorarHtml}</td>
                <td>
                    <button class="btn-action-sm info" title="Detalhes" onclick="abrirDetalhesRegistro(${h.id})"><i class="bi bi-info-circle"></i></button>
                    ${!h.possui_saida ? `<button class="btn-action-sm warning" title="Registrar Saída" onclick="registrarSaida(${h.alunos_id}, '${escapeHtml(h.aluno)}')"><i class="bi bi-box-arrow-right"></i></button>` : ''}
                </td>
            `;
            if (tbodyE) tbodyE.appendChild(tr);
        } else if (h.tipo === 'saida') {
            countSaidas++;
            const tr = document.createElement('tr');
            
            // Colunas de Saída (5 colunas):
            // 1. Aluno
            // 2. Turma
            // 3. Saída prevista
            // 4. Saída real
            // 5. Tempo excedido
            
            const excedidoTexto = h.excedido ? `<span class="badge bg-warning text-dark">${h.excedido}</span>` : '<span class="text-success">—</span>';
            
            tr.innerHTML = `
                <td><strong>${escapeHtml(h.aluno)}</strong></td>
                <td>${escapeHtml(h.turma || 'Sem Turma')} <small class="text-muted">(${escapeHtml(h.periodo)})</small></td>
                <td>${escapeHtml(h.horario_prev)}</td>
                <td>${escapeHtml(h.horario)}</td>
                <td>${excedidoTexto}</td>
            `;
            if (tbodyS) tbodyS.appendChild(tr);
        }
    });

    if (countEntradas === 0 && tbodyE) {
        tbodyE.innerHTML = `<tr><td colspan="7" class="text-center text-muted py-3">Nenhum registro de entrada encontrado para os filtros selecionados.</td></tr>`;
    }
    if (countSaidas === 0 && tbodyS) {
        tbodyS.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">Nenhum registro de saída encontrado para os filtros selecionados.</td></tr>`;
    }

    // Atualiza info de paginação
    const paginationInfo = document.querySelector('.es-pagination-info');
    if (paginationInfo) {
        paginationInfo.textContent = `Exibindo ${filtrados.length} registros`;
    }
}

/**
 * Auxiliares de filtro de datas
 */
function eDataHoje(dataStr) {
    const hoje = new Date();
    const hojeStr = `${hoje.getFullYear()}-${String(hoje.getMonth()+1).padStart(2,'0')}-${String(hoje.getDate()).padStart(2,'0')}`;
    return dataStr === hojeStr;
}

function dataNaSemanaAtual(dataStr) {
    const dataReg = new Date(dataStr + 'T00:00:00');
    const hoje = new Date();
    hoje.setHours(0,0,0,0);
    
    // Diferença em milissegundos
    const diffTime = Math.abs(hoje - dataReg);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
}

/**
 * Abre modal de detalhes do aluno
 */
function abrirDetalhesRegistro(id) {
    const h = todosOsHorarios.find(item => item.id == id);
    if (!h) return;
    
    document.getElementById('detNome').textContent = h.aluno;
    document.getElementById('detTurma').textContent = `${h.turma || 'Sem Turma'} (${h.periodo})`;
    document.getElementById('detHoraPrev').textContent = h.horario_prev || 'N/A';
    document.getElementById('detEntrada').textContent = `${h.horario} (${h.data})`;
    
    let statusBadge = '';
    if (h.status_presenca === 'atrasado') {
        statusBadge = `<span class="badge bg-danger">Atrasado (${h.atraso})</span>`;
    } else if (h.status_presenca === 'excedente') {
        statusBadge = `<span class="badge bg-warning text-dark">Saída Excedente (${h.excedido})</span>`;
    } else if (h.status_presenca === 'saiu') {
        statusBadge = '<span class="badge bg-secondary">Saída Normal</span>';
    } else {
        statusBadge = '<span class="badge bg-success">Presente / No horário</span>';
    }
    document.getElementById('detStatus').innerHTML = statusBadge;
    document.getElementById('detResponsavel').textContent = h.responsavel || 'Não cadastrado';
    document.getElementById('detObs').textContent = h.observacao || 'Nenhuma observação registrada.';
    
    toggleModal('modalDetalhes', 'show');
}

/**
 * Abre modal de registro de saída
 */
function registrarSaida(id, nome) {
    document.getElementById('saidaNome').textContent = nome;
    document.getElementById('saidaObs').value = '';
    document.getElementById('btnConfirmarSaida').dataset.id = id;
    toggleModal('modalSaida', 'show');
}

/**
 * Dispara uma notificação para o responsável
 */
function notificarResponsavel(aluno, responsavel) {
    if (responsavel && responsavel !== 'undefined' && responsavel !== 'null' && responsavel !== 'Responsável não cadastrado') {
        showToast(`Notificando responsável (${responsavel}) sobre o atraso de ${aluno}...`, 'info');
        setTimeout(() => {
            showToast(`Responsável ${responsavel} notificado com sucesso!`, 'success');
        }, 1200);
    } else {
        showToast(`Não há responsável cadastrado para notificar o atraso de ${aluno}.`, 'warning');
    }
}
