let profsListCache = [];

document.addEventListener('DOMContentLoaded', () => {

    // Data atual
    setDataAtual();

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair?')) return;
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    // Carrega os professores inicialmente
    carregarProfessores();

    // Busca dinâmica
    document.getElementById('searchProf')?.addEventListener('input', filtrarProfessores);
    document.getElementById('filterDisciplina')?.addEventListener('change', filtrarProfessores);
    document.getElementById('filterStatusProf')?.addEventListener('change', filtrarProfessores);

    // Paginação fake
    document.querySelectorAll('#paginationProf button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.querySelector('i')) return;
            document.querySelectorAll('#paginationProf button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Salvar professor (form submit)
    document.getElementById('btnSalvarProfessor')?.addEventListener('click', () => {
        const form = document.getElementById('formProfessor');
        if (!validarFormProfessor()) return;
        salvarProfessor();
    });

    // Resetar modal ao fechar
    document.getElementById('modalProfessor')?.addEventListener('hidden.bs.modal', () => {
        const form = document.getElementById('formProfessor');
        if (form) {
            form.reset();
        }
        const inputId = document.getElementById('inputIdProfessor');
        if (inputId) inputId.value = '';

        // Re-habilita campos caso tenham sido bloqueados na visualização
        document.querySelectorAll('#formProfessor input, #formProfessor select').forEach(el => {
            el.disabled = false;
        });
        const btnSalvar = document.getElementById('btnSalvarProfessor');
        if (btnSalvar) btnSalvar.style.display = '';

        // Exige senha no cadastro novo
        const inputSenha = document.getElementById('inputSenhaProfessor');
        const inputConf = document.getElementById('inputConfSenhaProfessor');
        if (inputSenha) { inputSenha.required = true; inputSenha.placeholder = "Mín. 8 caracteres"; }
        if (inputConf) { inputConf.required = true; inputConf.placeholder = "Repita a senha"; }

        document.getElementById('modalProfTitle').innerHTML =
            '<i class="bi bi-person-video3 me-2"></i>Formulário — Novo / Editar professor';
    });

});

function setDataAtual() {
    const dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje  = new Date();
    const el    = document.getElementById('dataAtual');
    if (el) el.textContent = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;
}

// Filtra a tabela de professores combinando busca por texto, disciplina e status
function filtrarProfessores() {
    const q    = (document.getElementById('searchProf')?.value      || '').toLowerCase().trim();
    const disc = (document.getElementById('filterDisciplina')?.value || '').toLowerCase();
    const st   = (document.getElementById('filterStatusProf')?.value || '').toLowerCase();
    let vis = 0;

    document.querySelectorAll('#tbodyProf tr').forEach(row => {
        if (row.cells.length === 1 && row.cells[0].colSpan === 7) return;

        const txt = row.textContent.toLowerCase();
        const ok  = (!q || txt.includes(q)) && (!disc || txt.includes(disc)) && (!st || txt.includes(st));
        row.style.display = ok ? '' : 'none';
        if (ok) vis++;
    });

    const info = document.querySelector('.pagination-info');
    if (info) info.textContent = `Exibindo ${vis} professor${vis !== 1 ? 'es' : ''}`;
}

// Busca os professores do backend
async function carregarProfessores() {
    const tbody = document.getElementById('tbodyProf');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="7" class="text-center py-4 text-muted">Carregando professores...</td></tr>';

    try {
        const response = await fetch('../../Back-End/api/get_professores.php');
        const res = await response.json();

        if (res.status === 'success' || res.status === 'warning') {
            tbody.innerHTML = '';
            profsListCache = res.data || [];

            if (profsListCache.length === 0) {
                tbody.innerHTML = '<tr><td colspan="7" class="text-center text-muted py-4">Nenhum professor cadastrado no banco de dados.</td></tr>';
                const info = document.querySelector('.pagination-info');
                if (info) info.textContent = 'Exibindo 0 resultados';
                return;
            }

            profsListCache.forEach(p => {
                const tr = document.createElement('tr');
                
                const iniciais = p.nome ? p.nome.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : 'PR';
                const cpf = p.cpf ? p.cpf : 'Sem CPF';
                
                // Formatação das disciplinas
                const disciplinasTags = p.disc ? p.disc.split(',').map(d => `<span class="disciplina-tag">${escapeHtml(d.trim())}</span>`).join('') : '<span class="text-muted">Nenhuma</span>';
                
                // Formatação do status
                let statusClass = 'badge-cinza';
                let statusText = 'Inativo';
                if (p.status === 'ativo') {
                    statusClass = 'badge-verde';
                    statusText = 'Ativo';
                } else if (p.status === 'ferias') {
                    statusClass = 'badge-laranja';
                    statusText = 'Férias';
                }
                const statusBadge = `<span class="badge-status ${statusClass}">${statusText}</span>`;
                
                // Horários estáticos de demonstração premium
                const horariosHtml = '<span class="horario-chip">Seg 08h</span><span class="horario-chip">Qua 10h</span>';

                tr.innerHTML = `
                    <td>
                        <div class="prof-nome-cell d-flex align-items-center gap-2">
                            <div class="prof-avatar">${iniciais}</div>
                            ${escapeHtml(p.nome)}
                        </div>
                    </td>
                    <td>${escapeHtml(cpf)}</td>
                    <td>${disciplinasTags}</td>
                    <td>${escapeHtml(p.turmas)}</td>
                    <td>${horariosHtml}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <div class="prof-actions d-flex gap-2">
                            <button class="btn-action-sm" title="Editar" onclick="editarProf(${p.id})"><i class="bi bi-pencil"></i></button>
                            <button class="btn-action-sm" title="Visualizar" onclick="abrirDetalhesProf(${p.id})"><i class="bi bi-eye"></i></button>
                            <button class="btn-action-sm danger" title="Excluir" onclick="excluirProf(${p.id})"><i class="bi bi-trash"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            filtrarProfessores();
        } else {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Erro ao carregar dados do servidor.</td></tr>';
        }
    } catch (error) {
        console.error('Erro de conexão:', error);
        tbody.innerHTML = '<tr><td colspan="7" class="text-center text-danger py-4">Erro de conexão com o servidor.</td></tr>';
    }
}

// Preenche o formulário do modal para edição
function editarProf(id) {
    const d = profsListCache.find(p => parseInt(p.id) === parseInt(id));
    if (!d) return;

    // Remove campos desabilitados caso venha da visualização
    document.querySelectorAll('#formProfessor input, #formProfessor select').forEach(el => {
        el.disabled = false;
    });
    const btnSalvar = document.getElementById('btnSalvarProfessor');
    if (btnSalvar) btnSalvar.style.display = '';

    // Preenche os dados
    document.getElementById('inputIdProfessor').value = d.id;
    document.getElementById('inputNomeProf').value = d.nome || '';
    if (typeof definirValorMascarado === 'function') definirValorMascarado(document.getElementById('inputCpfProf'), d.cpf || '');
    if (typeof definirValorMascarado === 'function') definirValorMascarado(document.getElementById('inputTelProf'), d.tel || '');
    document.getElementById('inputEmailProf').value = d.email || '';
    document.getElementById('inputFormacaoProf').value = d.formacao !== 'Não informada' ? d.formacao : '';
    document.getElementById('selectStatusProf').value = d.status || 'ativo';
    document.getElementById('inputDisciplinas').value = d.disc || '';

    // Senha não é obrigatória na edição
    const inputSenha = document.getElementById('inputSenhaProfessor');
    const inputConf = document.getElementById('inputConfSenhaProfessor');
    if (inputSenha) { inputSenha.required = false; inputSenha.placeholder = "(Deixe em branco para manter a atual)"; }
    if (inputConf) { inputConf.required = false; inputConf.placeholder = "(Deixe em branco para manter a atual)"; }

    document.getElementById('modalProfTitle').innerHTML =
        '<i class="bi bi-pencil-fill me-2"></i>Editar Professor — ' + d.nome;
    
    toggleModal('modalProfessor', 'show');
}

// Abre o modal em modo de visualização apenas
function abrirDetalhesProf(id) {
    editarProf(id);

    // Desabilita os campos para leitura apenas
    document.querySelectorAll('#formProfessor input, #formProfessor select').forEach(el => {
        el.disabled = true;
    });
    const btnSalvar = document.getElementById('btnSalvarProfessor');
    if (btnSalvar) btnSalvar.style.display = 'none';

    document.getElementById('modalProfTitle').innerHTML =
        '<i class="bi bi-eye-fill me-2"></i>Visualizar Professor';
}

// Salva ou edita o professor enviando dados para save_professor.php
async function salvarProfessor() {
    const btn = document.getElementById('btnSalvarProfessor');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    }

    try {
        const form = document.getElementById('formProfessor');
        const formData = new FormData(form);

        const response = await fetch('../../Back-End/api/save_professor.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success' || data.status === 'warning') {
            showToast(data.message, 'success');
            toggleModal('modalProfessor', 'hide');
            carregarProfessores();
        } else {
            showToast('Erro ao salvar professor: ' + data.message, 'danger');
        }
    } catch (error) {
        console.error('Erro de requisição:', error);
        showToast('Erro ao se conectar com o servidor.', 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR CADASTRO';
        }
    }
}

// Exclui professor chamando delete_professor.php
async function excluirProf(id) {
    if (!confirm('Tem certeza que deseja excluir este professor? Esta ação não pode ser desfeita.')) return;

    showLoading();
    try {
        const formData = new FormData();
        formData.append('id', id);

        const response = await fetch('../../Back-End/api/delete_professor.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        hideLoading();

        if (data.status === 'success' || data.status === 'warning') {
            showToast(data.message, 'success');
            carregarProfessores();
        } else {
            showToast('Erro ao remover professor: ' + data.message, 'danger');
        }
    } catch (error) {
        hideLoading();
        console.error('Erro de requisição:', error);
        showToast('Erro ao se conectar com o servidor.', 'danger');
    }
}

// Valida campos obrigatórios no formulário
function validarFormProfessor() {
    const isEdit = !!document.getElementById('inputIdProfessor').value;
    const campos = ['inputNomeProf', 'inputCpfProf', 'inputEmailProf', 'selectStatusProf'];
    
    // Senha é obrigatória apenas no cadastro de novo professor
    if (!isEdit) {
        campos.push('inputSenhaProfessor', 'inputConfSenhaProfessor');
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

    // Valida coincidência de senha
    const s1 = document.getElementById('inputSenhaProfessor')?.value;
    const s2 = document.getElementById('inputConfSenhaProfessor')?.value;
    if (s1 !== s2) {
        showToast('As senhas não coincidem.', 'warning');
        if (document.getElementById('inputSenhaProfessor')) document.getElementById('inputSenhaProfessor').style.borderColor = 'var(--cor-erro)';
        if (document.getElementById('inputConfSenhaProfessor')) document.getElementById('inputConfSenhaProfessor').style.borderColor = 'var(--cor-erro)';
        return false;
    }

    return true;
}

// Auxiliar para evitar injeção de HTML na exibição de dados
function escapeHtml(text) {
    if (!text) return '';
    return text
        .toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
