
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

    carregarFuncionarios();

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
    document.getElementById('formFuncionario')?.addEventListener('submit', async e => {
        e.preventDefault();
        if (!validarFormFunc()) return;
        await salvarFuncionario();
    });

    document.getElementById('btnSalvarFuncionario')?.addEventListener('click', () => {
        document.getElementById('formFuncionario')?.requestSubmit();
    });

    // Resetar modal ao fechar
    document.getElementById('modalFuncionario')?.addEventListener('hidden.bs.modal', () => {
        const form = document.getElementById('formFuncionario');
        if(form) {
            form.reset();
            delete form.dataset.editId;
        }
        const preview = document.getElementById('avatarPreview');
        if (preview) preview.innerHTML = '<i class="bi bi-person-fill"></i>';
        document.getElementById('modalFuncTitle').innerHTML =
            '<i class="bi bi-person-plus-fill me-2"></i>Formulário — Novo / Editar funcionário';
    });

    // Confirmar exclusão
    document.getElementById('btnConfirmarExcluirFunc')?.addEventListener('click', async () => {
        const idPendente = parseInt(document.getElementById('btnConfirmarExcluirFunc').dataset.id);
        const modal = bootstrap.Modal.getInstance(document.getElementById('modalExcluirFunc'));
        if (modal) modal.hide();

        try {
            const formData = new FormData();
            formData.append('tabela', 'funcionarios');
            formData.append('id', idPendente);

            const response = await fetch('../../Back-End/exclusao.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.status === 'success' || data.status === 'warning') {
                showToast('Funcionário removido com sucesso.', 'success');
                carregarFuncionarios();
            } else {
                showToast(data.message, 'danger');
            }
        } catch (error) {
            showToast('Erro de conexão.', 'danger');
        }
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
async function salvarFuncionario() {
    const btn = document.getElementById('btnSalvarFuncionario');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    }

    try {
        const form = document.getElementById('formFuncionario');
        const formData = new FormData(form);
        const isEdit = form.dataset.editId ? true : false;
        
        let url = '../../Back-End/insercoes/insercao_funcionario.php';
        if (isEdit) {
            url = '../../Back-End/edicao.php';
            formData.append('tabela', 'funcionarios');
            formData.append('id', form.dataset.editId);
        }

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success' || data.status === 'warning') {
            showToast(data.message, 'success');
            toggleModal('modalFuncionario', 'hide');
            form.reset();
            carregarFuncionarios();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        showToast('Erro de conexão.', 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR CADASTRO';
        }
    }
}

let funcsListCache = [];

async function carregarFuncionarios() {
    const container = document.getElementById('listaFuncionarios');
    if (!container) return;
    
    // Limpar os cartões existentes que não sejam o título ou controles (presume-se que o HTML tenha os cards dentro de uma row, vamos limpar os .func-card originais)
    // Para simplificar, vou limpar o HTML dos cards
    const rowCards = container.querySelector('.row.g-3') || container;
    
    try {
        const response = await fetch('../../Back-End/api/listar_funcionarios.php');
        const res = await response.json();

        if (res.status === 'success') {
            rowCards.innerHTML = '';
            funcsListCache = res.data;
            
            if(res.data.length === 0) {
                rowCards.innerHTML = '<div class="col-12 text-center text-muted">Nenhum funcionário cadastrado.</div>';
                return;
            }

            res.data.forEach(f => {
                const badgeClass = 'badge-verde';
                const avatarInitials = f.nome.substring(0,2).toUpperCase();
                
                const card = document.createElement('div');
                card.className = 'col-md-6 col-lg-4 func-card';
                card.dataset.id = f.id;
                card.dataset.nome = f.nome;
                
                card.innerHTML = `
                    <div class="card-funcionario p-3 d-flex flex-column h-100 position-relative">
                        <div class="dropdown position-absolute top-0 end-0 m-3">
                            <button class="btn btn-link text-muted p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm">
                                <li><a class="dropdown-item" href="#" onclick="editarFuncionario(${f.id}); return false;"><i class="bi bi-pencil me-2 text-primary"></i>Editar</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="excluirFuncionario(${f.id}); return false;"><i class="bi bi-trash me-2"></i>Excluir</a></li>
                            </ul>
                        </div>
                        <div class="d-flex align-items-center gap-3 mb-3">
                            <div class="avatar-func">${avatarInitials}</div>
                            <div>
                                <h6 class="mb-0 fw-bold text-dark text-truncate" style="max-width: 180px;" title="${f.nome}">${f.nome}</h6>
                                <small class="text-muted">${f.cargo || 'Funcionário'}</small>
                            </div>
                        </div>
                        <div class="info-func mb-3 mt-auto">
                            <div class="mb-1"><i class="bi bi-envelope"></i> ${f.email || 'N/A'}</div>
                            <div class="mb-1"><i class="bi bi-telephone"></i> ${f.tel || 'N/A'}</div>
                            <div><i class="bi bi-card-text"></i> ${f.cpf || 'N/A'}</div>
                        </div>
                        <div class="d-flex justify-content-between align-items-center border-top pt-3 mt-2">
                            <span class="badge-status-func ${badgeClass}">Ativo</span>
                        </div>
                    </div>
                `;
                rowCards.appendChild(card);
            });
            filtrarFuncionarios();
        } else {
            rowCards.innerHTML = '<div class="col-12 text-center text-danger">Erro ao carregar dados.</div>';
        }
    } catch (error) {
        rowCards.innerHTML = '<div class="col-12 text-center text-danger">Erro de conexão.</div>';
    }
}

/**
 * Abre modal de edição com dados do funcionário
 * @param {number} id
 */
function editarFuncionario(id) {
    const d = funcsListCache.find(f => parseInt(f.id) === parseInt(id));
    if (!d) return;

    document.getElementById('inputNomeFunc').value    = d.nome;
    document.getElementById('inputCpfFunc').value     = d.cpf || '';
    document.getElementById('inputTelFunc').value     = d.tel || '';
    document.getElementById('inputEmailFunc').value   = d.email || '';
    document.getElementById('inputCargoFunc').value   = d.cargo || '';
    document.getElementById('inputSenhaFunc').value   = '';
    document.getElementById('inputConfSenhaFunc').value = '';
    
    const form = document.getElementById('formFuncionario');
    if (form) form.dataset.editId = id;

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
