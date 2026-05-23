document.addEventListener('DOMContentLoaded', () => {

    setDataAtualTurmas();
    carregarProfessoresSelect();
    carregarTurmas();

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair?')) return;
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    // Busca dinâmica nos cards
    document.getElementById('searchTurmas')?.addEventListener('input', filtrarTurmas);

    // Salvar turma
    document.getElementById('btnSalvarTurma')?.addEventListener('click', async () => {
        const nome = document.getElementById('inputNomeTurma')?.value.trim();
        const serie = document.getElementById('inputSerieTurma')?.value;
        const periodo = document.getElementById('selectPeriodoTurma')?.value;
        
        if (!nome || !serie || !periodo) {
            showToast('Preencha nome, série e período da turma.', 'warning');
            return;
        }
        await salvarTurma();
    });

    // Resetar modal ao fechar
    document.getElementById('modalTurma')?.addEventListener('hidden.bs.modal', () => {
        const form = document.getElementById('formTurma');
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }
    });

});

function setDataAtualTurmas() {
    const dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje  = new Date();
    const el    = document.getElementById('dataAtual');
    if (el) el.textContent = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;
}

/* Filtra os cards de turma por texto */
function filtrarTurmas() {
    const q = (document.getElementById('searchTurmas')?.value || '').toLowerCase().trim();
    document.querySelectorAll('.turma-card').forEach(card => {
        const txt = card.textContent.toLowerCase();
        card.style.display = (!q || txt.includes(q)) ? '' : 'none';
    });
}

// Carrega a lista de professores dinamicamente da API para popular o select
async function carregarProfessoresSelect() {
    const select = document.getElementById('selectProfTurma');
    if (!select) return;

    try {
        const response = await fetch('../../Back-End/api/get_professores.php');
        const res = await response.json();

        if (res.status === 'success' || res.status === 'warning') {
            select.innerHTML = '<option value="">Selecionar professor</option>';
            res.data.forEach(p => {
                const opt = document.createElement('option');
                opt.value = p.id;
                opt.textContent = p.nome;
                select.appendChild(opt);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar professores no select:', error);
    }
}

async function excluirTurma(id) {
    if (!confirm('Tem certeza que deseja excluir esta turma?')) return;
    
    try {
        const formData = new FormData();
        formData.append('id', id);

        const response = await fetch('../../Back-End/exclusoes/exclusao_turma.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            showToast('Turma removida com sucesso.', 'success');
            carregarTurmas();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        showToast('Erro de conexão.', 'danger');
    }
}

async function salvarTurma() {
    const btn = document.getElementById('btnSalvarTurma');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    }

    try {
        const form = document.getElementById('formTurma');
        const formData = new FormData();
        const isEdit = form && form.dataset.editId ? true : false;
        
        let url = '../../Back-End/insercoes/insercao_turma.php';
        
        formData.append('nome_turma', document.getElementById('inputNomeTurma').value);
        formData.append('serie', document.getElementById('inputSerieTurma').value);
        formData.append('sala', document.getElementById('inputSalaTurma').value);
        formData.append('capacidade', document.getElementById('inputCapacidade').value);
        formData.append('periodo', document.getElementById('selectPeriodoTurma').value);
        formData.append('professor_id', document.getElementById('selectProfTurma').value);
        formData.append('horario', document.getElementById('inputHorarioTurma').value);

        if (isEdit) {
            url = '../../Back-End/edicoes/edicao_turma.php';
            formData.append('id', form.dataset.editId);
        }

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            showToast(data.message, 'success');
            toggleModal('modalTurma', 'hide');
            if(form) form.reset();
            carregarTurmas();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        showToast('Erro de conexão.', 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR TURMA';
        }
    }
}

let turmasListCache = [];

function editarTurma(id) {
    const t = turmasListCache.find(x => parseInt(x.id) === parseInt(id));
    if (!t) return;
    
    document.getElementById('inputNomeTurma').value = t.nome || '';
    document.getElementById('inputSerieTurma').value = t.serie || '';
    document.getElementById('inputSalaTurma').value = t.sala || '';
    document.getElementById('inputCapacidade').value = t.capacidade || '';
    document.getElementById('selectPeriodoTurma').value = t.periodo || 'Manhã';
    document.getElementById('inputHorarioTurma').value = t.horario || '';
    
    // Seleciona o professor
    const selectProf = document.getElementById('selectProfTurma');
    if (selectProf) {
        if (t.professor_ids) {
            // Pega o primeiro ID da lista
            const firstProfId = t.professor_ids.split(',')[0];
            selectProf.value = firstProfId;
        } else {
            selectProf.value = '';
        }
    }
    
    const form = document.getElementById('formTurma');
    if(form) form.dataset.editId = id;
    
    toggleModal('modalTurma', 'show');
}

async function carregarTurmas() {
    const container = document.getElementById('turmasGrid');
    if (!container) return;

    // Limpa cards de turmas existentes
    container.innerHTML = '';

    try {
        const response = await fetch('../../Back-End/api/listar_turmas.php');
        const res = await response.json();

        if (res.status === 'success') {
            turmasListCache = res.data;
            
            if (res.data.length === 0) {
                container.innerHTML = '<div class="col-12 text-center text-muted py-4">Nenhuma turma cadastrada.</div>';
                return;
            }

            res.data.forEach((t, i) => {
                const card = document.createElement('div');
                
                // Determina classe de cor com base no período da turma
                let corClass = 'azul'; // Padrão Manhã
                if (t.periodo === 'Tarde') corClass = 'verde';
                else if (t.periodo === 'Integral') corClass = 'amarela';
                else if (t.periodo === 'Noite') corClass = 'roxa';

                card.className = `turma-card ${corClass}`;
                card.dataset.nome = `${t.nome} - ${t.periodo}`;
                card.dataset.id = t.id;

                // Animação de entrada dos cards
                card.style.opacity = '0';
                card.style.transform = 'translateY(20px)';
                
                const qtdAlunos = parseInt(t.qtd_alunos) || 0;
                const capacidade = parseInt(t.capacidade) || 25;
                const ocupacaoPct = Math.round((qtdAlunos / capacidade) * 100);
                const vagas = Math.max(0, capacidade - qtdAlunos);
                
                // Status badge
                let statusBadge = '<span class="badge-status badge-verde">Ativa</span>';
                if (ocupacaoPct >= 95) {
                    statusBadge = '<span class="badge-status badge-vermelho">Cheia</span>';
                } else if (ocupacaoPct >= 80) {
                    statusBadge = '<span class="badge-status badge-laranja">Quase cheia</span>';
                }

                card.innerHTML = `
                    <div class="turma-card-header d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <div class="turma-nome">${t.nome}</div>
                            <div class="turma-serie">${t.serie || 'Série não informada'} — ${t.periodo || ''}</div>
                        </div>
                        <span class="turma-badge">${t.sala || 'Sem Sala'}</span>
                    </div>
                    <div class="turma-info-grid">
                        <div class="turma-info-item">
                            <span class="turma-info-label">Professor(a)</span>
                            <span class="turma-info-value text-truncate" style="max-width: 130px;" title="${t.professores || 'Sem Professor'}">
                                ${t.professores || 'Sem Professor'}
                            </span>
                        </div>
                        <div class="turma-info-item">
                            <span class="turma-info-label">Alunos</span>
                            <span class="turma-info-value">${qtdAlunos} / ${capacidade}</span>
                        </div>
                        <div class="turma-info-item">
                            <span class="turma-info-label">Horário</span>
                            <span class="turma-info-value text-truncate" style="max-width: 130px;" title="${t.horario || 'Não definido'}">
                                ${t.horario || 'Não definido'}
                            </span>
                        </div>
                        <div class="turma-info-item">
                            <span class="turma-info-label">Status</span>
                            ${statusBadge}
                        </div>
                    </div>
                    <div class="turma-barra">
                        <div class="turma-barra-fill" style="width:${Math.min(100, ocupacaoPct)}%"></div>
                    </div>
                    <div class="turma-barra-info">
                        <span>Capacidade: ${ocupacaoPct}%</span>
                        <span>${vagas} vagas</span>
                    </div>
                    
                    <div class="d-flex gap-2">
                        <button class="btn-gerenciar flex-grow-1" onclick="gerenciarTurma(${t.id}, '${t.nome}')">
                            <i class="bi bi-people-fill"></i> Gerenciar Alunos
                        </button>
                        <button class="btn-gerenciar px-3" style="width: auto;" onclick="editarTurma(${t.id})" title="Editar Turma">
                            <i class="bi bi-pencil-fill"></i>
                        </button>
                        <button class="btn-gerenciar px-3 border-danger text-danger" style="width: auto;" onclick="excluirTurma(${t.id})" title="Excluir Turma">
                            <i class="bi bi-trash-fill"></i>
                        </button>
                    </div>
                `;

                container.appendChild(card);

                // Aplica animação
                setTimeout(() => {
                    card.style.transition = 'all 0.5s ease';
                    card.style.opacity = '1';
                    card.style.transform = 'translateY(0)';
                }, 150 * (i + 1));
            });
            
            filtrarTurmas();
        } else {
            console.error('Erro ao listar turmas:', res.message);
        }
    } catch (error) {
        console.error('Erro de conexão ao carregar turmas:', error);
    }
}

// Gerencia os alunos reais vinculados à turma
async function gerenciarTurma(turmaId, turmaNome) {
    const titleEl = document.getElementById('gerenciarTurmaTitle');
    if (titleEl) {
        titleEl.innerHTML = `<i class="bi bi-people-fill me-2"></i>Alunos — ${turmaNome}`;
    }

    const body = document.getElementById('gerenciarTurmaBody');
    if (!body) return;

    body.innerHTML = '<div class="text-center py-3"><span class="spinner-border spinner-border-sm text-primary me-2"></span>Carregando alunos...</div>';
    toggleModal('modalGerenciarTurma', 'show');

    try {
        const response = await fetch(`../../Back-End/api/get_alunos_turma.php?turma_id=${turmaId}`);
        const res = await response.json();

        if (res.status === 'success') {
            if (res.data.length === 0) {
                body.innerHTML = '<div class="text-center text-muted py-3">Nenhum aluno matriculado nesta turma.</div>';
                return;
            }

            body.innerHTML = res.data.map(a => {
                const iniciais = a.nome.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
                return `
                    <div class="turma-aluno-item d-flex align-items-center justify-content-between">
                        <div class="d-flex align-items-center gap-2">
                            <div class="turma-aluno-avatar">${iniciais}</div>
                            <div>
                                <span class="turma-aluno-nome d-block fw-bold">${a.nome}</span>
                                <small class="text-muted text-xs">Matrícula: ${a.matricula}</small>
                            </div>
                        </div>
                        <button class="btn-action-sm danger" title="Remover aluno da turma" onclick="removerAlunoDeTurma(${a.id}, ${turmaId}, '${a.nome}', '${turmaNome}')">
                            <i class="bi bi-x-lg"></i>
                        </button>
                    </div>
                `;
            }).join('');
        } else {
            body.innerHTML = `<div class="text-center text-danger py-3">Erro: ${res.message}</div>`;
        }
    } catch (error) {
        body.innerHTML = '<div class="text-center text-danger py-3">Erro de conexão ao carregar alunos.</div>';
    }
}

// Remove o aluno da turma de verdade
async function removerAlunoDeTurma(alunoId, turmaId, alunoNome, turmaNome) {
    if (!confirm(`Deseja realmente remover o aluno "${alunoNome}" da turma "${turmaNome}"?`)) return;

    try {
        const formData = new FormData();
        formData.append('aluno_id', alunoId);
        formData.append('turma_id', turmaId);

        const response = await fetch('../../Back-End/api/remover_aluno_turma.php', {
            method: 'POST',
            body: formData
        });

        const res = await response.json();

        if (res.status === 'success') {
            showToast('Aluno removido com sucesso.', 'success');
            // Recarrega o modal e atualiza a grid principal em background
            gerenciarTurma(turmaId, turmaNome);
            carregarTurmas();
        } else {
            showToast(res.message, 'danger');
        }
    } catch (error) {
        showToast('Erro ao remover aluno.', 'danger');
    }
}
