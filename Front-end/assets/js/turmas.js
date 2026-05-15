
document.addEventListener('DOMContentLoaded', () => {

    setDataAtualTurmas();

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair?')) return;
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    // Busca dinâmica nos cards
    document.getElementById('searchTurmas')?.addEventListener('input', filtrarTurmas);

    // Animação de entrada dos cards
    document.querySelectorAll('.turma-card').forEach((card, i) => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)';
        setTimeout(() => {
            card.style.transition = 'all 0.5s ease';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';
        }, 150 * (i + 1));
    });

    // Salvar turma
    document.getElementById('btnSalvarTurma')?.addEventListener('click', () => {
        const nome = document.getElementById('inputNomeTurma')?.value.trim();
        const serie = document.getElementById('inputSerieTurma')?.value;
        if (!nome || !serie) {
            showToast('Preencha nome e série da turma.', 'warning');
            return;
        }
        const btn = document.getElementById('btnSalvarTurma');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR TURMA';
            toggleModal('modalTurma', 'hide');
            showToast('Turma salva com sucesso!', 'success');
        }, 1200);
    });

    // Resetar modal ao fechar
    document.getElementById('modalTurma')?.addEventListener('hidden.bs.modal', () => {
        document.getElementById('formTurma')?.reset();
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

/**
 * Abre modal de gerenciamento com lista de alunos fake
 * @param {string} nome
 */
function gerenciarTurma(nome) {
    document.getElementById('gerenciarTurmaTitle').innerHTML =
        `<i class="bi bi-people-fill me-2"></i>Alunos — ${nome}`;

    const alunosFake = {
        'Turma A': ['Ana Clara Silva','Bruno Mendes','Carla Ferreira','Daniel Santos','Maria Oliveira','Lucas Almeida'],
        'Turma B': ['Pedro Costa','Isabela Ferreira','João Miguel','Larissa Lima','Matheus Souza','Fernanda Ramos','Gabriel Oliveira'],
        'Turma C': ['Sofia Pereira','Arthur Nascimento','Helena Duarte','Theo Carvalho','Laura Ribeiro'],
        'Turma D': ['Valentina Torres','Miguel Cunha','Alice Barros','Noah Martins','Julia Azevedo','Davi Correia','Enzo Cardoso','Manuela Rocha'],
    };

    const alunos = alunosFake[nome] || ['Nenhum aluno cadastrado'];
    const body = document.getElementById('gerenciarTurmaBody');

    body.innerHTML = alunos.map(a => {
        const iniciais = a.split(' ').map(n => n[0]).join('').slice(0,2).toUpperCase();
        return `
            <div class="turma-aluno-item">
                <div class="turma-aluno-avatar">${iniciais}</div>
                <span class="turma-aluno-nome">${a}</span>
                <button class="btn-action-sm danger" title="Remover" onclick="this.closest('.turma-aluno-item').remove();showToast('Aluno removido da turma.','danger');">
                    <i class="bi bi-x-lg"></i>
                </button>
            </div>
        `;
    }).join('');

    toggleModal('modalGerenciarTurma', 'show');
}
