
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
    document.getElementById('formAluno')?.addEventListener('submit', e => {
        e.preventDefault();
        if (!validarFormAluno()) return;
        simularSalvar('Aluno cadastrado com sucesso!', 'modalAluno');
    });

    document.getElementById('btnSalvarAluno')?.addEventListener('click', () => {
        document.getElementById('formAluno')?.requestSubmit();
    });

    // Resetar modal ao fechar 
    document.getElementById('modalAluno')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('formAluno')?.reset();
        document.getElementById('modalAlunoTitle').innerHTML =
            '<i class="bi bi-person-plus-fill me-2"></i>Formulário — Novo / Editar aluno';
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
 * Simula gravação e fecha modal
 * @param {string} msg
 * @param {string} modalId
 */
function simularSalvar(msg, modalId) {
    const btn = document.getElementById('btnSalvarAluno');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    }

    setTimeout(() => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR CADASTRO';
        }
        toggleModal(modalId, 'hide');
        showToast(msg, 'success');
    }, 1200);
}

/**
 * Abre modal de edição preenchendo dados fake do aluno
 * @param {number} id
 */
function editarAluno(id) {
    const dados = {
        1: { nome:'Maria Eduarda Silva',      cpf:'123.456.789-00', nasc:'2018-03-15', turma:'Turma A - Manhã',    periodo:'Manhã',    resp:'Ana Paula Silva',   tel:'(11) 98765-4321', email:'ana@gmail.com', parentesco:'Mãe' },
        2: { nome:'Pedro Henrique Costa',     cpf:'987.654.321-00', nasc:'2017-07-22', turma:'Turma B - Tarde',    periodo:'Tarde',    resp:'Fernanda Costa',    tel:'(11) 91234-5678', email:'fer@gmail.com', parentesco:'Mãe' },
        3: { nome:'Lucas Gabriel Oliveira',   cpf:'456.789.123-00', nasc:'2016-11-01', turma:'Turma C - Integral', periodo:'Integral', resp:'Mariana Oliveira',  tel:'(11) 99988-7766', email:'mari@gmail.com', parentesco:'Mãe' },
        4: { nome:'Isabela Santos Ferreira',  cpf:'321.654.987-00', nasc:'2018-05-30', turma:'Turma A - Manhã',    periodo:'Manhã',    resp:'Roberto Ferreira',  tel:'(11) 97777-3333', email:'rob@gmail.com',  parentesco:'Pai' },
        5: { nome:'João Miguel Almeida',      cpf:'654.321.987-00', nasc:'2017-09-12', turma:'Turma B - Tarde',    periodo:'Tarde',    resp:'Carla Almeida',     tel:'(11) 96666-1111', email:'car@gmail.com',  parentesco:'Mãe' },
    };

    const d = dados[id];
    if (!d) return;

    document.getElementById('inputNomeAluno').value   = d.nome;
    document.getElementById('inputCpfAluno').value    = d.cpf;
    document.getElementById('inputDataNasc').value    = d.nasc;
    document.getElementById('selectTurmaAluno').value = d.turma;
    document.getElementById('selectPeriodo').value    = d.periodo;
    document.getElementById('inputNomeResp').value    = d.resp;
    document.getElementById('inputTelResp').value     = d.tel;
    document.getElementById('inputEmailResp').value   = d.email;
    document.getElementById('selectParentesco').value = d.parentesco;

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
function excluirAluno(id) {
    if (!confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) return;

    showLoading();
    setTimeout(() => {
        hideLoading();
        // Remove a linha correspondente da tabela (simulação)
        const rows = document.querySelectorAll('#tbodyAlunos tr');
        if (rows[id - 1]) rows[id - 1].remove();
        showToast('Aluno removido com sucesso.', 'danger');
        filtrarAlunos();
    }, 800);
}
