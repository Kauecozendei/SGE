
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
    document.getElementById('btnSalvarProfessor')?.addEventListener('click', () => {
        const nome  = document.getElementById('inputNomeProf')?.value.trim();
        const email = document.getElementById('inputEmailProf')?.value.trim();
        if (!nome || !email) { showToast('Preencha nome e e-mail.', 'warning'); return; }

        const s1 = document.getElementById('inputSenhaProfessor')?.value;
        const s2 = document.getElementById('inputConfSenhaProfessor')?.value;
        if (s1 !== s2) { showToast('As senhas não coincidem.', 'warning'); return; }

        simularSalvar('Professor salvo com sucesso!', 'modalProfessor', 'btnSalvarProfessor');
    });

    // Resetar modal ao fechar
    document.getElementById('modalProfessor')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('formProfessor')?.reset();
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
    const dados = {
        1: { nome:'Carlos Magalhães', cpf:'111.222.333-44', tel:'(11) 91111-0001', email:'carlos.m@escola.com', formacao:'Lic. Matemática', status:'ativo',  disc:'Matemática, Física' },
        2: { nome:'Juliana Souza',    cpf:'555.666.777-88', tel:'(11) 91111-0002', email:'juliana.s@escola.com', formacao:'Lic. Letras',      status:'ativo',  disc:'Português, Literatura' },
        3: { nome:'Roberto Alves',    cpf:'999.888.777-66', tel:'(11) 91111-0003', email:'roberto.a@escola.com', formacao:'Lic. Ciências',    status:'ferias', disc:'Ciências, Biologia' },
        4: { nome:'Fernanda Melo',    cpf:'222.333.444-55', tel:'(11) 91111-0004', email:'fernanda.m@escola.com',formacao:'Lic. Ed. Física',  status:'ativo',  disc:'Artes, Ed. Física' },
    };
    const d = dados[id]; if (!d) return;
    document.getElementById('inputNomeProf').value      = d.nome;
    document.getElementById('inputCpfProf').value       = d.cpf;
    document.getElementById('inputTelProf').value       = d.tel;
    document.getElementById('inputEmailProf').value     = d.email;
    document.getElementById('inputFormacaoProf').value  = d.formacao;
    document.getElementById('selectStatusProf').value   = d.status;
    document.getElementById('inputDisciplinas').value   = d.disc;
    document.getElementById('modalProfTitle').innerHTML =
        '<i class="bi bi-pencil-fill me-2"></i>Editar Professor — ' + d.nome;
    toggleModal('modalProfessor', 'show');
}

function excluirProf(id) {
    if (!confirm('Tem certeza que deseja excluir este professor?')) return;
    showLoading();
    setTimeout(() => {
        hideLoading();
        const rows = document.querySelectorAll('#tbodyProf tr');
        if (rows[id - 1]) rows[id - 1].remove();
        showToast('Professor removido com sucesso.', 'danger');
        filtrarProfessores();
    }, 800);
}

function simularSalvar(msg, modalId, btnId) {
    const btn = document.getElementById(btnId);
    if (btn) { btn.disabled = true; btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...'; }
    setTimeout(() => {
        if (btn) { btn.disabled = false; btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR CADASTRO'; }
        toggleModal(modalId, 'hide');
        showToast(msg, 'success');
    }, 1200);
}
