
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
    document.getElementById('searchFuncionarios')?.addEventListener('input', function () {
        filtrarFuncionarios();
    });

    // Filtros 
    document.getElementById('filterCargoFunc')?.addEventListener('change', filtrarFuncionarios);
    document.getElementById('filterStatusFunc')?.addEventListener('change', filtrarFuncionarios);

    // Upload de foto 
    document.getElementById('inputFotoFunc')?.addEventListener('change', function () {
        const file = this.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = e => {
            const preview = document.getElementById('avatarPreview');
            if (preview) {
                preview.innerHTML = `<img src="${e.target.result}" alt="Foto" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">`;
            }
        };
        reader.readAsDataURL(file);
    });

    // Salvar funcionário
    document.getElementById('formFuncionario')?.addEventListener('submit', e => {
        e.preventDefault();
        if (!validarFormFunc()) return;
        salvarFuncionario();
    });

    document.getElementById('btnSalvarFuncionario')?.addEventListener('click', () => {
        document.getElementById('formFuncionario')?.requestSubmit();
    });

    // Resetar modal ao fechar
    document.getElementById('modalFuncionario')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('formFuncionario')?.reset();
        const preview = document.getElementById('avatarPreview');
        if (preview) preview.innerHTML = '<i class="bi bi-person-fill"></i>';
        document.getElementById('modalFuncTitle').innerHTML =
            '<i class="bi bi-person-plus-fill me-2"></i>Formulário — Novo / Editar funcionário';
    });

    // Confirmar exclusão
    document.getElementById('btnConfirmarExcluirFunc')?.addEventListener('click', () => {
        const idPendente = parseInt(document.getElementById('btnConfirmarExcluirFunc').dataset.id);
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalExcluirFunc'));
        if (modal) modal.hide();

        showLoading();
        setTimeout(() => {
            hideLoading();
            const card = document.querySelector(`.func-card[data-id="${idPendente}"]`);
            if (card) card.remove();
            showToast('Funcionário removido com sucesso.', 'danger');
            filtrarFuncionarios();
        }, 800);
    });

});

/* Filtra os cards de funcionários por texto, cargo e status */
function filtrarFuncionarios() {
    const q      = (document.getElementById('searchFuncionarios')?.value  || '').toLowerCase().trim();
    const cargo  = (document.getElementById('filterCargoFunc')?.value     || '').toLowerCase();
    const status = (document.getElementById('filterStatusFunc')?.value    || '').toLowerCase();

    let visiveis = 0;
    document.querySelectorAll('.func-card').forEach(card => {
        const txt = card.textContent.toLowerCase();
        const ok  = (!q      || txt.includes(q))
                 && (!cargo  || txt.includes(cargo))
                 && (!status || txt.includes(status));
        card.style.display = ok ? '' : 'none';
        if (ok) visiveis++;
    });

    const info = document.querySelector('#listaFuncionarios .pagination-info');
    if (info) info.textContent = `Exibindo ${visiveis} funcionário${visiveis !== 1 ? 's' : ''}`;
}

/**
 * Valida campos obrigatórios do formulário de funcionário
 * @returns {boolean}
 */
function validarFormFunc() {
    const campos = ['inputNomeFunc','inputCpfFunc','inputTelFunc','inputEmailFunc','inputCargoFunc','selectStatusFunc','inputSenhaFunc','inputConfSenhaFunc'];
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

    if (!ok) { showToast('Preencha todos os campos obrigatórios.', 'warning'); return false; }

    const s1 = document.getElementById('inputSenhaFunc')?.value;
    const s2 = document.getElementById('inputConfSenhaFunc')?.value;
    if (s1 !== s2) {
        document.getElementById('inputConfSenhaFunc').style.borderColor = 'var(--cor-erro)';
        showToast('As senhas não coincidem.', 'warning');
        return false;
    }

    if (s1 && s1.length < 8) {
        document.getElementById('inputSenhaFunc').style.borderColor = 'var(--cor-erro)';
        showToast('A senha deve ter no mínimo 8 caracteres.', 'warning');
        return false;
    }

    return true;
}

/* Simula salvamento do funcionário */
function salvarFuncionario() {
    const btn = document.getElementById('btnSalvarFuncionario');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    }
    setTimeout(() => {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR CADASTRO';
        }
        toggleModal('modalFuncionario', 'hide');
        showToast('Funcionário salvo com sucesso!', 'success');
    }, 1200);
}

/**
 * Abre modal de edição com dados do funcionário
 * @param {number} id
 */
function editarFuncionario(id) {
    const dados = {
        1: { nome:'Ana Paula Souza',     cpf:'111.222.333-44', tel:'(11) 98000-1111', email:'ana.paula@escola.com',  cargo:'Diretora',                 status:'ativo'  },
        2: { nome:'Marcos Figueiredo',   cpf:'555.666.777-88', tel:'(11) 97000-2222', email:'marcos.f@escola.com',   cargo:'Coordenador Pedagógico',   status:'ativo'  },
        3: { nome:'Juliana Ramos',       cpf:'999.888.777-66', tel:'(11) 96000-3333', email:'juliana.r@escola.com',  cargo:'Professora - Turma A',     status:'ferias' },
        4: { nome:'Carlos Mendes',       cpf:'444.333.222-11', tel:'(11) 95000-4444', email:'carlos.m@escola.com',   cargo:'Auxiliar de Classe',       status:'ativo'  },
        5: { nome:'Patrícia Lima',       cpf:'222.111.999-00', tel:'(11) 94000-5555', email:'patricia.l@escola.com', cargo:'Secretária',               status:'inativo'},
    };

    const d = dados[id];
    if (!d) return;

    document.getElementById('inputNomeFunc').value    = d.nome;
    document.getElementById('inputCpfFunc').value     = d.cpf;
    document.getElementById('inputTelFunc').value     = d.tel;
    document.getElementById('inputEmailFunc').value   = d.email;
    document.getElementById('inputCargoFunc').value   = d.cargo;
    document.getElementById('selectStatusFunc').value = d.status;
    document.getElementById('inputSenhaFunc').value   = '';
    document.getElementById('inputConfSenhaFunc').value = '';

    document.getElementById('modalFuncTitle').innerHTML =
        '<i class="bi bi-pencil-fill me-2"></i>Editar Funcionário — ' + d.nome;

    toggleModal('modalFuncionario', 'show');
}

/**
 * Abre modal de confirmação de exclusão
 * @param {number} id
 */
function excluirFuncionario(id) {
    const card = document.querySelector(`.func-card[data-id="${id}"]`);
    const nome = card?.dataset.nome || 'este funcionário';

    document.getElementById('msgExcluirFunc').textContent = `Tem certeza que deseja excluir "${nome}"?`;
    document.getElementById('btnConfirmarExcluirFunc').dataset.id = id;

    toggleModal('modalExcluirFunc', 'show');
}
