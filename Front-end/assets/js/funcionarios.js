document.addEventListener('DOMContentLoaded', () => {

    // Data atual
    const dias = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
    const meses = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
    const hoje = new Date();
    const el = document.getElementById('dataAtual');
    if (el) el.textContent = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2, '0')} de ${meses[hoje.getMonth()]}`;

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
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }
        const inputId = document.getElementById('inputIdFuncionario');
        if (inputId) inputId.value = '';

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
            showLoading();
            const formData = new FormData();
            formData.append('id', idPendente);

            const response = await fetch('../../Back-End/api/delete_funcionario.php', {
                method: 'POST',
                body: formData
            });

            const data = await response.json();

            if (data.status === 'success') {
                showToast(data.message, 'success');
                carregarFuncionarios();
            } else {
                showToast(data.message, 'danger');
            }
        } catch (error) {
            showToast('Erro de conexão ao excluir funcionário.', 'danger');
        } finally {
            hideLoading();
        }
    });

});

/* Filtra os cards de funcionários por texto, cargo e status */
function filtrarFuncionarios() {
    const q = (document.getElementById('searchFuncionarios')?.value || '').toLowerCase().trim();
    const cargo = (document.getElementById('filterCargoFunc')?.value || '').toLowerCase();
    const status = (document.getElementById('filterStatusFunc')?.value || '').toLowerCase();

    let visiveis = 0;
    document.querySelectorAll('.func-card-item').forEach(item => {
        const txt = item.textContent.toLowerCase();
        const ok = (!q || txt.includes(q))
            && (!cargo || txt.includes(cargo))
            && (!status || txt.includes(status));
        item.style.setProperty('display', ok ? '' : 'none', 'important');
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
    const isEdit = document.getElementById('formFuncionario')?.dataset.editId ? true : false;
    const campos = ['inputNomeFunc', 'inputCpfFunc', 'inputTelFunc', 'inputEmailFunc', 'inputCargoFunc', 'selectStatusFunc'];
    
    // Senha só é obrigatória no cadastro novo
    if (!isEdit) {
        campos.push('inputSenhaFunc', 'inputConfSenhaFunc');
    }

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

    if (!ok) { 
        showToast('Preencha todos os campos obrigatórios.', 'warning'); 
        return false; 
    }

    const s1 = document.getElementById('inputSenhaFunc')?.value;
    const s2 = document.getElementById('inputConfSenhaFunc')?.value;

    if (s1 || s2) {
        if (s1 !== s2) {
            document.getElementById('inputConfSenhaFunc').style.borderColor = 'var(--cor-erro)';
            showToast('As senhas não coincidem.', 'warning');
            return false;
        } else {
            document.getElementById('inputConfSenhaFunc').style.borderColor = '';
        }

        if (s1.length < 8) {
            document.getElementById('inputSenhaFunc').style.borderColor = 'var(--cor-erro)';
            showToast('A senha deve ter no mínimo 8 caracteres.', 'warning');
            return false;
        } else {
            document.getElementById('inputSenhaFunc').style.borderColor = '';
        }
    }

    return true;
}

/* Salva o funcionário (Inserção ou Edição) */
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

        // Se for edição, garante que o ID é enviado
        if (isEdit) {
            formData.append('id', form.dataset.editId);
        }

        const response = await fetch('../../Back-End/api/save_funcionario.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success') {
            showToast(data.message, 'success');
            toggleModal('modalFuncionario', 'hide');
            form.reset();
            carregarFuncionarios();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        showToast('Erro de conexão ao salvar funcionário.', 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR CADASTRO';
        }
    }
}

let funcsListCache = [];

/* Carrega todos os funcionários dinamicamente do banco de dados */
async function carregarFuncionarios() {
    const container = document.getElementById('listaFuncionarios');
    if (!container) return;

    const rowCards = container.querySelector('.row.g-3') || container;

    try {
        const response = await fetch('../../Back-End/api/get_funcionarios.php');
        const res = await response.json();

        if (res.status === 'success') {
            rowCards.innerHTML = '';
            funcsListCache = res.data;

            if (res.data.length === 0) {
                rowCards.innerHTML = '<div class="col-12 text-center text-muted">Nenhum funcionário cadastrado.</div>';
                const info = document.querySelector('#listaFuncionarios .pagination-info');
                if (info) info.textContent = 'Exibindo 0 funcionários';
                return;
            }

            res.data.forEach(f => {
                let badgeClass = 'badge-verde';
                let statusLabel = 'Ativo';
                if (f.status === 'inativo') {
                    badgeClass = 'badge-vermelho';
                    statusLabel = 'Inativo';
                } else if (f.status === 'ferias') {
                    badgeClass = 'badge-laranja';
                    statusLabel = 'Férias';
                }

                const card = document.createElement('div');
                card.className = 'col-xl-4 col-md-6 func-card-item';
                card.dataset.id = f.id;
                card.dataset.nome = f.nome;

                const avatarContent = f.url_foto 
                    ? `<img src="${f.url_foto}" alt="${f.nome}">` 
                    : `<i class="bi bi-person-fill" style="font-size:1.4rem;"></i>`;

                card.innerHTML = `
                    <div class="func-card d-flex align-items-center gap-3" data-id="${f.id}" data-nome="${f.nome}" data-cargo="${f.cargo}">
                        <div class="func-avatar">
                            ${avatarContent}
                        </div>
                        <div class="func-info flex-grow-1">
                            <div class="func-nome">${f.nome}</div>
                            <div class="func-cargo">${f.cargo} • <span style="font-size:0.72rem; word-break: break-all;">${f.email || ''}</span></div>
                        </div>
                        <div class="d-flex flex-column align-items-end gap-2 flex-shrink-0">
                            <span class="badge-status ${badgeClass}">${statusLabel}</span>
                            <div class="d-flex gap-1">
                                <button class="btn-func-action editar" onclick="editarFuncionario(${f.id})"><i class="bi bi-pencil me-1"></i>Editar</button>
                                <button class="btn-func-action excluir" onclick="excluirFuncionario(${f.id})"><i class="bi bi-trash me-1"></i>Excluir</button>
                            </div>
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
        rowCards.innerHTML = '<div class="col-12 text-center text-danger">Erro de conexão com o banco de dados.</div>';
    }
}

/**
 * Abre modal de edição com dados do funcionário
 * @param {number} id
 */
function editarFuncionario(id) {
    const d = funcsListCache.find(f => parseInt(f.id) === parseInt(id));
    if (!d) return;

    document.getElementById('inputNomeFunc').value = d.nome || '';
    
    // Preencher CPF formatado se possível
    const cpfInput = document.getElementById('inputCpfFunc');
    if (cpfInput) {
        if (typeof definirValorMascarado === 'function') {
            definirValorMascarado(cpfInput, d.cpf || '');
        } else {
            cpfInput.value = d.cpf || '';
        }
    }

    // Preencher telefone formatado se possível
    const telInput = document.getElementById('inputTelFunc');
    if (telInput) {
        if (typeof definirValorMascarado === 'function') {
            definirValorMascarado(telInput, d.tel || '');
        } else {
            telInput.value = d.tel || '';
        }
    }

    document.getElementById('inputEmailFunc').value = d.email || '';
    document.getElementById('inputCargoFunc').value = d.cargo || '';
    document.getElementById('selectStatusFunc').value = d.status || 'ativo';
    document.getElementById('inputSenhaFunc').value = '';
    document.getElementById('inputConfSenhaFunc').value = '';

    const form = document.getElementById('formFuncionario');
    if (form) form.dataset.editId = id;

    const inputId = document.getElementById('inputIdFuncionario');
    if (inputId) inputId.value = id;

    document.getElementById('modalFuncTitle').innerHTML =
        `<i class="bi bi-pencil-fill me-2"></i>Editar Funcionário — ${d.nome}`;

    toggleModal('modalFuncionario', 'show');
}

/**
 * Abre modal de confirmação de exclusão
 * @param {number} id
 */
function excluirFuncionario(id) {
    const d = funcsListCache.find(f => parseInt(f.id) === parseInt(id));
    const nome = d?.nome || 'este funcionário';

    document.getElementById('msgExcluirFunc').textContent = `Tem certeza que deseja excluir "${nome}"?`;
    document.getElementById('btnConfirmarExcluirFunc').dataset.id = id;

    toggleModal('modalExcluirFunc', 'show');
}
