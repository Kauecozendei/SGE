
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

    // Salvar professor
    document.getElementById('btnSalvarProfessor')?.addEventListener('click', async () => {
        const nome  = document.getElementById('inputNomeProf')?.value.trim();
        const email = document.getElementById('inputEmailProf')?.value.trim();
        if (!nome || !email) { showToast('Preencha nome e e-mail.', 'warning'); return; }

        const s1 = document.getElementById('inputSenhaProfessor')?.value;
        const s2 = document.getElementById('inputConfSenhaProfessor')?.value;
        if (s1 !== s2) { showToast('As senhas não coincidem.', 'warning'); return; }

        await salvarProfessor();
    });

    // Resetar modal ao fechar
    document.getElementById('modalProfessor')?.addEventListener('hidden.bs.modal', () => {
        const form = document.getElementById('formProfessor');
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }
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

function filtrarProfessores() {
    const q    = (document.getElementById('searchProf')?.value      || '').toLowerCase().trim();
    const disc = (document.getElementById('filterDisciplina')?.value || '').toLowerCase();
    const st   = (document.getElementById('filterStatusProf')?.value || '').toLowerCase();
    let vis = 0;

    document.querySelectorAll('#tbodyProf tr').forEach(row => {
        const txt = row.textContent.toLowerCase();
        const ok  = (!q || txt.includes(q)) && (!disc || txt.includes(disc)) && (!st || txt.includes(st));
        row.style.display = ok ? '' : 'none';
        if (ok) vis++;
    });

    const info = document.querySelector('.prof-pagination .pagination-info');
    if (info) info.textContent = `Exibindo ${vis} professor${vis !== 1 ? 'es' : ''}`;
}

function editarProf(id) {
    const d = profsListCache.find(p => parseInt(p.id) === parseInt(id));
    if (!d) return;

    document.getElementById('inputNomeProf').value      = d.nome;
    document.getElementById('inputCpfProf').value       = d.cpf || '';
    document.getElementById('inputTelProf').value       = d.tel || '';
    document.getElementById('inputEmailProf').value     = d.email || '';
    document.getElementById('inputFormacaoProf').value  = d.formacao || '';
    
    const form = document.getElementById('formProfessor');
    if (form) form.dataset.editId = id;

    document.getElementById('modalProfTitle').innerHTML =
        '<i class="bi bi-pencil-fill me-2"></i>Editar Professor — ' + d.nome;
    toggleModal('modalProfessor', 'show');
}

async function excluirProf(id) {
    if (!confirm('Tem certeza que deseja excluir este professor?')) return;
    
    try {
        const formData = new FormData();
        formData.append('tabela', 'funcionarios');
        formData.append('id', id);

        const response = await fetch('../../Back-End/exclusao.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success' || data.status === 'warning') {
            showToast('Professor removido com sucesso.', 'success');
            carregarProfessores();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        showToast('Erro de conexão.', 'danger');
    }
}

async function salvarProfessor() {
    const btn = document.getElementById('btnSalvarProfessor');
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...'; }
    
    try {
        const form = document.getElementById('formProfessor');
        const formData = new FormData(form);
        const isEdit = form.dataset.editId ? true : false;
        
        let url = '../../Back-End/insercoes/insercao_funcionario.php';
        formData.append('cargo', 'Professor');

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
            toggleModal('modalProfessor', 'hide');
            form.reset();
            carregarProfessores();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        showToast('Erro de conexão.', 'danger');
    } finally {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR CADASTRO'; }
    }
}

let profsListCache = [];

async function carregarProfessores() {
    const tbody = document.getElementById('tbodyProf');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="6" class="text-center">Carregando professores...</td></tr>';

    try {
        const response = await fetch('../../Back-End/api/listar_funcionarios.php?cargo=Professor');
        const res = await response.json();

        if (res.status === 'success') {
            tbody.innerHTML = '';
            profsListCache = res.data;
            
            if(res.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" class="text-center">Nenhum professor encontrado.</td></tr>';
                return;
            }

            res.data.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>
                        <div class="prof-nome-cell d-flex align-items-center gap-2">
                            <div class="prof-avatar">${p.nome.substring(0,2).toUpperCase()}</div>
                            ${p.nome}
                        </div>
                    </td>
                    <td>${p.email || 'N/A'}</td>
                    <td><span class="badge-formacao">Professor</span></td>
                    <td>${p.tel || 'N/A'}</td>
                    <td><span class="badge-status-prof badge-verde">Ativo</span></td>
                    <td>
                        <div class="prof-actions d-flex gap-2">
                            <button class="btn-action-sm" title="Editar" onclick="editarProf(${p.id})"><i class="bi bi-pencil"></i></button>
                            <button class="btn-action-sm danger" title="Excluir" onclick="excluirProf(${p.id})"><i class="bi bi-trash"></i></button>
                        </div>
                    </td>
                `;
                tbody.appendChild(tr);
            });
            filtrarProfessores();
        } else {
            tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro ao carregar dados.</td></tr>';
        }
    } catch (error) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-danger">Erro de conexão.</td></tr>';
    }
}
