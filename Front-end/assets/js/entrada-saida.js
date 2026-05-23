
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

    // Botão sair
    const btnSair = document.getElementById('btnSair');
    if (btnSair) {
        btnSair.addEventListener('click', e => {
            e.preventDefault();
            if (!confirm('Deseja realmente sair do sistema?')) return;
            showToast('Saindo...', 'warning');
            showLoading();
            setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        });
    }

    carregarHorarios();

    // Animação dos cards de status
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
        setTimeout(() => requestAnimationFrame(tick), 300);
    });

    // Tabs de filtro
    document.querySelectorAll('.tab-filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Aqui se conectaria com backend para filtrar por tab
            showToast(`Exibindo: ${btn.textContent.trim()}`, 'info');
        });
    });

    // Busca dinâmica 
    const searchInput = document.getElementById('searchAluno');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase().trim();
            filtrarTabela('tabelaEntradas', q);
            filtrarTabela('tabelaSaidas', q);
        });
    }

    // Filtros de select 
    ['filterTurma', 'filterStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', aplicarFiltros);
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
 * Filtra linhas de uma tabela pelo texto de busca
 * @param {string} tableId
 * @param {string} query
 */
function filtrarTabela(tableId, query) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(row => {
        const texto = row.textContent.toLowerCase();
        row.style.display = texto.includes(query) ? '' : 'none';
    });
}

/* Aplica filtros combinados de turma e status */
function aplicarFiltros() {
    const turma  = (document.getElementById('filterTurma')?.value  || '').toLowerCase();
    const status = (document.getElementById('filterStatus')?.value || '').toLowerCase();

    ['tabelaEntradas', 'tabelaSaidas'].forEach(id => {
        const tbody = document.querySelector(`#${id} tbody`);
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(row => {
            const txt = row.textContent.toLowerCase();
            const okTurma  = !turma  || txt.includes(turma);
            const okStatus = !status || txt.includes(status);
            row.style.display = (okTurma && okStatus) ? '' : 'none';
        });
    });
}

/**
 * Abre modal de detalhes do aluno
 */
function abrirDetalhes(nome) {
    document.getElementById('detNome').textContent = nome;
    document.getElementById('detTurma').textContent = '—';
    document.getElementById('detHoraPrev').textContent = '—';
    document.getElementById('detEntrada').textContent = '—';
    document.getElementById('detStatus').innerHTML = '—';
    document.getElementById('detResponsavel').textContent = '—';
    document.getElementById('detObs').textContent = '—';

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

async function carregarHorarios() {
    try {
        const response = await fetch('../../Back-End/api/listar_horarios.php');
        const res = await response.json();

        if (res.status === 'success') {
            const tbodyE = document.querySelector('#tabelaEntradas tbody');
            const tbodyS = document.querySelector('#tabelaSaidas tbody');
            
            if(tbodyE) tbodyE.innerHTML = '';
            if(tbodyS) tbodyS.innerHTML = '';

            res.data.forEach(h => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${h.aluno || 'Desconhecido'}</td>
                    <td>${h.turma || 'Sem Turma'} - ${h.periodo || ''}</td>
                    <td>${h.horario || 'N/A'}</td>
                    <td><span class="es-status no-horario">${h.tipo}</span></td>
                    <td>${h.responsavel || 'N/A'}</td>
                    <td>
                        <button class="btn-action-sm info" title="Detalhes" onclick="abrirDetalhes('${h.aluno}')"><i class="bi bi-info-circle"></i></button>
                        ${h.tipo === 'entrada' ? `<button class="btn-action-sm warning" title="Registrar Saída" onclick="registrarSaida(${h.alunos_id}, '${h.aluno}')"><i class="bi bi-box-arrow-right"></i></button>` : ''}
                    </td>
                `;

                if (h.tipo === 'entrada' && tbodyE) {
                    tbodyE.appendChild(tr);
                } else if (h.tipo === 'saida' && tbodyS) {
                    tbodyS.appendChild(tr);
                }
            });
        }
    } catch (error) {
        console.error('Erro de conexão ao carregar horários.', error);
    }
}
