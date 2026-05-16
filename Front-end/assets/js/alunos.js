
document.addEventListener('DOMContentLoaded', () => {

    // Data atual
    const dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje  = new Date();
    const el    = document.getElementById('dataAtual');
    if (el) el.textContent = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;


    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair?')) return;
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    carregarAlunos();

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

    // Salvar aluno
    document.getElementById('formAluno')?.addEventListener('submit', async e => {
        e.preventDefault();
        if (!validarFormAluno()) return;
        await salvarAluno();
    });

    document.getElementById('btnSalvarAluno')?.addEventListener('click', () => {
        document.getElementById('formAluno')?.requestSubmit();
    });

    // Resetar modal ao fechar 
    document.getElementById('modalAluno')?.addEventListener('hidden.bs.modal', () => {
        const form = document.getElementById('formAluno');
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }
        document.getElementById('modalAlunoTitle').innerHTML =
            '<i class="bi bi-person-plus-fill me-2"></i>Formulário — Novo / Editar aluno';
        // Reset abas (se existir navegação)
        document.querySelectorAll('.nav-link').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.nav-link[data-bs-target="#dados-aluno"]')?.classList.add('active');
        document.querySelectorAll('.tab-pane').forEach(tab => tab.classList.remove('show', 'active'));
        document.getElementById('dados-aluno')?.classList.add('show', 'active');
    });

});

// Funções auxiliares


/**
 * Filtra a tabela de alunos combinando busca + turma + status
 */
function filtrarAlunos() {
    const q      = (document.getElementById('searchAlunos')?.value      || '').toLowerCase().trim();
    const turma  = (document.getElementById('filterTurmaAlunos')?.value  || '').toLowerCase();
    const status = (document.getElementById('filterStatusAlunos')?.value || '').toLowerCase();

    const rows = document.querySelectorAll('#tbodyAlunos tr');
    let visiveis = 0;

    rows.forEach(row => {
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

/**
 * Valida campos obrigatórios do formulário de aluno
 * @returns {boolean}
 */
function validarFormAluno() {
    const campos = ['inputNomeAluno', 'inputDataNasc', 'selectTurmaAluno', 'selectPeriodo', 'inputNomeResp', 'inputTelResp'];
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

/**
 * Salva o aluno via fetch
 */
async function salvarAluno() {
    const btn = document.getElementById('btnSalvarAluno');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    }

    try {
        const form = document.getElementById('formAluno');
        const formData = new FormData(form);
        const isEdit = form.dataset.editId ? true : false;
        
        let url = '../../Back-End/insercoes/insercao_aluno.php';
        if (isEdit) {
            url = '../../Back-End/edicao.php';
            formData.append('tabela', 'alunos');
            formData.append('id', form.dataset.editId);
        }

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success' || data.status === 'warning') {
            showToast(data.message, 'success');
            toggleModal('modalAluno', 'hide');
            form.reset();
            carregarAlunos();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Erro de conexão com o servidor.', 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR CADASTRO';
        }
    }
}

let alunosListCache = [];

/**
 * Carrega a lista de alunos do banco
 */
async function carregarAlunos() {
    const tbody = document.getElementById('tbodyAlunos');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center">Carregando alunos...</td></tr>';

    try {
        const response = await fetch('../../Back-End/api/listar_alunos.php');
        const res = await response.json();

        if (res.status === 'success') {
            tbody.innerHTML = '';
            alunosListCache = res.data; // Cache para usar no editarAluno
            
            if(res.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center">Nenhum aluno encontrado.</td></tr>';
                return;
            }

            res.data.forEach(aluno => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="aluno-nome-cell d-flex align-items-center gap-2">
                            <div class="aluno-avatar">${aluno.nome.substring(0,2).toUpperCase()}</div>
                            ${aluno.nome}
                        </div>
                    </td>
                    <td>${aluno.cpf || 'N/A'}</td>
                    <td>${aluno.turma || 'Sem Turma'} - ${aluno.periodo || ''}</td>
                    <td>${aluno.resp || 'Sem Resp'}</td>
                    <td>${aluno.matricula}</td>
                    <td><span class="badge-status badge-verde">Ativo</span></td>
                    <td>
                        <div class="aluno-actions d-flex gap-2">
                            <button class="btn-action-sm" title="Editar" onclick="editarAluno(${aluno.id})"><i class="bi bi-pencil"></i></button>
                            <button class="btn-action-sm danger" title="Excluir" onclick="excluirAluno(${aluno.id})"><i class="bi bi-trash"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            filtrarAlunos(); // Atualiza a contagem visual
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro ao carregar dados.</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger">Erro de conexão.</td></tr>';
    }
}

/**
 * Abre modal de edição preenchendo dados fake do aluno
 * @param {number} id
 */
function editarAluno(id) {
    const d = alunosListCache.find(a => parseInt(a.id) === parseInt(id));
    if (!d) return;

    document.getElementById('inputNomeAluno').value   = d.nome;
    document.getElementById('inputCpfAluno').value    = d.cpf || '';
    document.getElementById('inputDataNasc').value    = d.data_nascimento || '';
    // As informações de responsável ou turma precisariam ser trazidas via backend com mais detalhes na listagem
    document.getElementById('inputNomeResp').value    = d.resp || '';
    
    const form = document.getElementById('formAluno');
    if(form) form.dataset.editId = id; // Marca como edição

    document.getElementById('modalAlunoTitle').innerHTML =
        '<i class="bi bi-pencil-fill me-2"></i>Editar Aluno — ' + d.nome;

    toggleModal('modalAluno', 'show');
}

/**
 * Abre modal de visualização do aluno (apenas leitura)
 * @param {number} id
 */
function abrirDetalhesAluno(id) {
    editarAluno(id); // Reutiliza modal (backend diferenciaria via flag)
    showToast('Modo visualização. Use editar para alterar.', 'info');
}

/**
 * Remove linha do aluno da tabela após confirmação
 * @param {number} id
 */
async function excluirAluno(id) {
    if (!confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) return;

    try {
        const formData = new FormData();
        formData.append('tabela', 'alunos');
        formData.append('id', id);

        const response = await fetch('../../Back-End/exclusao.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success' || data.status === 'warning') {
            showToast('Aluno removido com sucesso.', 'success');
            carregarAlunos();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        console.error(error);
        showToast('Erro de conexão.', 'danger');
    }
}
