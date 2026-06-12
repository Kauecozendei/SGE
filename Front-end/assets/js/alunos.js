let listAlunos = [];

document.addEventListener('DOMContentLoaded', () => {

    // Data atual 
    const dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje  = new Date();
    const el    = document.getElementById('dataAtual');
    if (el) el.textContent = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;

    // Carrega os alunos inicialmente
    carregarAlunos();

    // Carrega as turmas dinamicamente nos selects
    carregarTurmasSelects();

    // Atualiza o período correspondente quando a turma é selecionada
    document.getElementById('selectTurmaAluno')?.addEventListener('change', function () {
        const selectedOption = this.options[this.selectedIndex];
        const periodo = selectedOption?.getAttribute('data-periodo') || '';
        const selectPeriodo = document.getElementById('selectPeriodo');
        if (selectPeriodo) {
            selectPeriodo.value = periodo;
        }
    });

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair?')) return;
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    // Busca dinâmica 
    document.getElementById('searchAlunos')?.addEventListener('input', function () {
        filtrarAlunos();
    });

    // Filtros de select
    document.getElementById('filterTurmaAlunos')?.addEventListener('change', filtrarAlunos);
    document.getElementById('filterStatusAlunos')?.addEventListener('change', filtrarAlunos);

    // Paginação fake 
    document.querySelectorAll('#paginationAlunos button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.querySelector('i')) return;
            document.querySelectorAll('#paginationAlunos button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Salvar aluno (form submit) 
    document.getElementById('formAluno')?.addEventListener('submit', e => {
        e.preventDefault();
        if (!validarFormAluno()) return;
        salvarAluno();
    });

    document.getElementById('btnSalvarAluno')?.addEventListener('click', () => {
        document.getElementById('formAluno')?.requestSubmit();
    });

    // Resetar modal ao fechar
    document.getElementById('modalAluno')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('formAluno')?.reset();
        document.getElementById('inputIdAluno').value = '';
        // Re-habilita campos caso tenham sido bloqueados na visualização
        document.querySelectorAll('#formAluno input, #formAluno select, #formAluno textarea').forEach(el => {
            el.disabled = false;
        });
        const btnSalvar = document.getElementById('btnSalvarAluno');
        if (btnSalvar) btnSalvar.style.display = '';
        
        document.getElementById('modalAlunoTitle').innerHTML =
            '<i class="bi bi-person-plus-fill me-2"></i>Formulário — Novo / Editar aluno';
    });

});

// Função para buscar alunos do backend
function carregarAlunos() {
    showLoading();
    fetch('../../Back-End/api/get_alunos.php')
        .then(response => response.json())
        .then(data => {
            hideLoading();
            if (data.status === 'success' || data.status === 'warning') {
                listAlunos = data.data || [];
                renderizarTabelaAlunos();
            } else {
                showToast('Erro ao carregar alunos: ' + data.message, 'danger');
            }
        })
        .catch(err => {
            hideLoading();
            console.error('Erro de requisição:', err);
            showToast('Erro ao se conectar com o servidor.', 'danger');
        });
}

// Renderiza a tabela dinamicamente
function renderizarTabelaAlunos() {
    const tbody = document.getElementById('tbodyAlunos');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (listAlunos.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Nenhum aluno cadastrado no banco de dados.</td></tr>';
        const info = document.querySelector('.pagination-info');
        if (info) info.textContent = 'Exibindo 0 resultados';
        return;
    }

    listAlunos.forEach(aluno => {
        const tr = document.createElement('tr');
        
        // Obtém as iniciais para o avatar
        const iniciais = aluno.nome ? aluno.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'AL';
        
        const cpf = aluno.cpf ? aluno.cpf : 'Sem CPF';
        const turma = aluno.turma ? aluno.turma : 'Sem Turma';
        const periodo = aluno.periodo ? ` - ${aluno.periodo}` : '';
        const resp = aluno.resp ? aluno.resp : 'Sem Responsável';
        const matricula = aluno.matricula ? aluno.matricula : 'Não gerada';
        
        // Status pode ser Ativo (padrão)
        const statusBadge = `<span class="badge-status badge-verde">Ativo</span>`;

        tr.innerHTML = `
            <td>
                <div class="aluno-nome-cell d-flex align-items-center gap-2">
                    <div class="aluno-avatar">${iniciais}</div>
                    ${escapeHtml(aluno.nome)}
                </div>
            </td>
            <td>${escapeHtml(cpf)}</td>
            <td>${escapeHtml(turma)}${escapeHtml(periodo)}</td>
            <td>${escapeHtml(resp)}</td>
            <td>${escapeHtml(matricula)}</td>
            <td>${statusBadge}</td>
            <td>
                <div class="aluno-actions d-flex gap-2">
                    <button class="btn-action-sm" title="Editar" onclick="editarAluno(${aluno.id})"><i class="bi bi-pencil"></i></button>
                    <button class="btn-action-sm" title="Visualizar" onclick="abrirDetalhesAluno(${aluno.id})"><i class="bi bi-eye"></i></button>
                    <button class="btn-action-sm danger" title="Excluir" onclick="excluirAluno(${aluno.id})"><i class="bi bi-trash"></i></button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });

    filtrarAlunos();
}

// Salva ou atualiza um aluno enviando os dados via Fetch
function salvarAluno() {
    const btn = document.getElementById('btnSalvarAluno');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    }

    const form = document.getElementById('formAluno');
    const formData = new FormData(form);

    fetch('../../Back-End/api/save_aluno.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR CADASTRO';
        }

        if (data.status === 'success' || data.status === 'warning') {
            toggleModal('modalAluno', 'hide');
            showToast(data.message, 'success');
            carregarAlunos();
        } else {
            showToast('Erro ao salvar aluno: ' + data.message, 'danger');
        }
    })
    .catch(err => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR CADASTRO';
        }
        console.error('Erro ao salvar:', err);
        showToast('Erro ao se conectar com o servidor.', 'danger');
    });
}

// Abre modal e preenche dados do aluno para edição
function editarAluno(id) {
    const aluno = listAlunos.find(a => parseInt(a.id) === id);
    if (!aluno) return;

    // Remove campos desabilitados se estiverem de um modo visualização anterior
    document.querySelectorAll('#formAluno input, #formAluno select, #formAluno textarea').forEach(el => {
        el.disabled = false;
    });
    const btnSalvar = document.getElementById('btnSalvarAluno');
    if (btnSalvar) btnSalvar.style.display = '';

    // Preenche os campos
    document.getElementById('inputIdAluno').value = aluno.id;
    document.getElementById('inputNomeAluno').value = aluno.nome || '';
    if (typeof definirValorMascarado === 'function') definirValorMascarado(document.getElementById('inputCpfAluno'), aluno.cpf || '');
    document.getElementById('inputDataNasc').value = aluno.nasc || '';
    
    // Resolve a turma selecionando o nome correspondente
    const selectTurma = document.getElementById('selectTurmaAluno');
    const turmaCompleta = aluno.turma ? `${aluno.turma}${aluno.periodo ? ' - ' + aluno.periodo : ''}` : '';
    selectTurma.value = '';
    
    // Tenta encontrar uma opção correspondente exata
    for (let option of selectTurma.options) {
        if (option.text === turmaCompleta || option.text.includes(aluno.turma)) {
            selectTurma.value = option.value;
            break;
        }
    }
    
    document.getElementById('selectPeriodo').value = aluno.periodo || '';
    document.getElementById('inputNomeResp').value = aluno.resp || '';
    if (typeof definirValorMascarado === 'function') definirValorMascarado(document.getElementById('inputTelResp'), aluno.tel || '');
    document.getElementById('inputEmailResp').value = aluno.email || '';
    document.getElementById('selectParentesco').value = aluno.parentesco || '';

    document.getElementById('modalAlunoTitle').innerHTML =
        '<i class="bi bi-pencil-fill me-2"></i>Editar Aluno — ' + aluno.nome;

    toggleModal('modalAluno', 'show');
}

// Abre modal de detalhes (apenas leitura)
function abrirDetalhesAluno(id) {
    editarAluno(id);
    
    // Desabilita os campos para visualização apenas
    document.querySelectorAll('#formAluno input, #formAluno select, #formAluno textarea').forEach(el => {
        el.disabled = true;
    });
    const btnSalvar = document.getElementById('btnSalvarAluno');
    if (btnSalvar) btnSalvar.style.display = 'none';
    
    document.getElementById('modalAlunoTitle').innerHTML =
        '<i class="bi bi-eye-fill me-2"></i>Visualizar Aluno';
}

// Exclui aluno chamando API real
function excluirAluno(id) {
    if (!confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) return;

    showLoading();
    const formData = new FormData();
    formData.append('id', id);

    fetch('../../Back-End/api/delete_aluno.php', {
        method: 'POST',
        body: formData
    })
    .then(response => response.json())
    .then(data => {
        hideLoading();
        if (data.status === 'success' || data.status === 'warning') {
            showToast(data.message, 'success');
            carregarAlunos();
        } else {
            showToast('Erro ao remover aluno: ' + data.message, 'danger');
        }
    })
    .catch(err => {
        hideLoading();
        console.error('Erro ao excluir:', err);
        showToast('Erro ao se conectar com o servidor.', 'danger');
    });
}

// Filtra a tabela combinando busca + turma + status
function filtrarAlunos() {
    const q      = (document.getElementById('searchAlunos')?.value      || '').toLowerCase().trim();
    const turma  = (document.getElementById('filterTurmaAlunos')?.value  || '').toLowerCase();
    const status = (document.getElementById('filterStatusAlunos')?.value || '').toLowerCase();

    const rows = document.querySelectorAll('#tbodyAlunos tr');
    let visiveis = 0;

    rows.forEach(row => {
        // Ignora linha de "nenhum registro encontrado"
        if (row.cells.length === 1 && row.cells[0].colSpan === 7) return;

        const txt = row.textContent.toLowerCase();
        const ok  = (!q || txt.includes(q))
                 && (!turma  || txt.includes(turma))
                 && (!status || txt.includes(status));
        row.style.display = ok ? '' : 'none';
        if (ok) visiveis++;
    });

    const info = document.querySelector('.pagination-info');
    if (info) info.textContent = `Exibindo ${visiveis} resultado${visiveis !== 1 ? 's' : ''}`;
}

function validarFormAluno() {
    const campos = ['inputNomeAluno', 'inputCpfAluno', 'inputDataNasc', 'selectTurmaAluno', 'selectPeriodo', 'inputNomeResp', 'inputCpfResp', 'inputTelResp'];
    let ok = true;

    campos.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        if (!el.value.trim()) {
            el.style.borderColor = 'var(--cor-erro)';
            ok = false;
        } else {
            el.style.borderColor = '';
        }
    });

    if (!ok) showToast('Preencha todos os campos obrigatórios.', 'warning');
    return ok;
}

// Carrega as turmas cadastradas do banco e popula os selects do formulário e filtro
function carregarTurmasSelects() {
    fetch('../../Back-End/api/listar_turmas.php')
        .then(response => response.json())
        .then(res => {
            if (res.status === 'success') {
                const selectTurma = document.getElementById('selectTurmaAluno');
                const filterTurma = document.getElementById('filterTurmaAlunos');
                
                if (selectTurma) {
                    selectTurma.innerHTML = '<option value="">Selecionar turma</option>';
                    res.data.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.id;
                        opt.textContent = `${t.nome} - ${t.periodo}`;
                        opt.setAttribute('data-periodo', t.periodo);
                        selectTurma.appendChild(opt);
                    });
                }
                
                if (filterTurma) {
                    filterTurma.innerHTML = '<option value="">Todas as Turmas</option>';
                    res.data.forEach(t => {
                        const opt = document.createElement('option');
                        opt.value = t.nome.toLowerCase();
                        opt.textContent = `${t.nome} - ${t.periodo}`;
                        filterTurma.appendChild(opt);
                    });
                }
            } else {
                console.error('Erro ao listar turmas:', res.message);
            }
        })
        .catch(err => {
            console.error('Erro de requisição ao buscar turmas:', err);
        });
}
