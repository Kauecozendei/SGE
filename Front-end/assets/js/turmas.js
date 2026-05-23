
document.addEventListener('DOMContentLoaded', () => {

    setDataAtualTurmas();

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair?')) return;
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    carregarTurmas();

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
    document.getElementById('btnSalvarTurma')?.addEventListener('click', async () => {
        const nome = document.getElementById('inputNomeTurma')?.value.trim();
        const periodo = document.getElementById('inputSerieTurma')?.value;
        if (!nome || !periodo) {
            showToast('Preencha nome e período da turma.', 'warning');
            return;
        }
        await salvarTurma();
    });

    // Resetar modal ao fechar
    document.getElementById('modalTurma')?.addEventListener('hidden.bs.modal', () => {
        const form = document.getElementById('formTurma');
        if (form) {
            form.reset();
            delete form.dataset.editId;
        }
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

async function excluirTurma(id) {
    if (!confirm('Tem certeza que deseja excluir esta turma?')) return;
    
    try {
        const formData = new FormData();
        formData.append('tabela', 'turmas');
        formData.append('id', id);

        const response = await fetch('../../Back-End/exclusao.php', {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success' || data.status === 'warning') {
            showToast('Turma removida com sucesso.', 'success');
            carregarTurmas();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        showToast('Erro de conexão.', 'danger');
    }
}

async function salvarTurma() {
    const btn = document.getElementById('btnSalvarTurma');
    if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
    }

    try {
        const form = document.getElementById('formTurma');
        const formData = new FormData();
        const isEdit = form && form.dataset.editId ? true : false;
        
        let url = '../../Back-End/insercoes/insercao_turma.php';
        
        formData.append('nome_turma', document.getElementById('inputNomeTurma').value);
        formData.append('periodo', document.getElementById('inputSerieTurma').value);

        if (isEdit) {
            url = '../../Back-End/edicao.php';
            formData.append('tabela', 'turmas');
            formData.append('id', form.dataset.editId);
        }

        const response = await fetch(url, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();

        if (data.status === 'success' || data.status === 'warning') {
            showToast(data.message, 'success');
            toggleModal('modalTurma', 'hide');
            if(form) form.reset();
            carregarTurmas();
        } else {
            showToast(data.message, 'danger');
        }
    } catch (error) {
        showToast('Erro de conexão.', 'danger');
    } finally {
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>SALVAR TURMA';
        }
    }
}

let turmasListCache = [];

function editarTurma(id) {
    const t = turmasListCache.find(x => parseInt(x.id) === parseInt(id));
    if (!t) return;
    
    document.getElementById('inputNomeTurma').value = t.nome;
    document.getElementById('inputSerieTurma').value = t.periodo;
    
    const form = document.getElementById('formTurma');
    if(form) form.dataset.editId = id;
    
    toggleModal('modalTurma', 'show');
}

async function carregarTurmas() {
    // Usando .row ou o container que engloba as turmas (o id exato pode variar, vamos buscar pelo botão novo)
    // O container original no HTML tem classe .row, vou buscar o elemento pai dos turma-card e preservar o botão de adicionar
    const cardsAntigos = document.querySelectorAll('.turma-card');
    cardsAntigos.forEach(c => c.remove()); // limpa as turmas existentes

    const container = document.querySelector('.row.g-4') || document.querySelector('#contentWrapper .row');
    if (!container) return;

    try {
        const response = await fetch('../../Back-End/api/listar_turmas.php');
        const res = await response.json();

        if (res.status === 'success') {
            turmasListCache = res.data;
            res.data.forEach(t => {
                const card = document.createElement('div');
                card.className = 'col-md-6 col-lg-3 turma-card';
                card.dataset.id = t.id;
                
                card.innerHTML = `
                    <div class="card border-0 shadow-sm h-100 position-relative">
                        <div class="dropdown position-absolute top-0 end-0 m-3">
                            <button class="btn btn-link text-muted p-0" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                                <i class="bi bi-three-dots-vertical"></i>
                            </button>
                            <ul class="dropdown-menu dropdown-menu-end border-0 shadow-sm">
                                <li><a class="dropdown-item" href="#" onclick="editarTurma(${t.id}); return false;"><i class="bi bi-pencil me-2 text-primary"></i>Editar Turma</a></li>
                                <li><a class="dropdown-item" href="#" onclick="gerenciarTurma('${t.nome}'); return false;"><i class="bi bi-people me-2 text-primary"></i>Gerenciar Alunos</a></li>
                                <li><hr class="dropdown-divider"></li>
                                <li><a class="dropdown-item text-danger" href="#" onclick="excluirTurma(${t.id}); return false;"><i class="bi bi-trash me-2"></i>Excluir Turma</a></li>
                            </ul>
                        </div>
                        <div class="card-body p-4 text-center">
                            <div class="mb-3">
                                <span class="badge-turma-cor badge-azul"><i class="bi bi-book-fill"></i></span>
                            </div>
                            <h5 class="fw-bold mb-1">${t.nome}</h5>
                            <p class="text-muted small mb-3">${t.periodo || ''}</p>
                            
                            <div class="d-flex justify-content-between align-items-center mb-3">
                                <div class="text-start">
                                    <small class="text-muted d-block">Alunos</small>
                                    <span class="fw-bold text-dark fs-5">${t.qtd_alunos || 0}</span>
                                </div>
                                <div class="text-end">
                                    <small class="text-muted d-block">Professores</small>
                                    <span class="fw-bold text-dark fs-5">${t.qtd_professores || 0}</span>
                                </div>
                            </div>
                            
                            <button class="btn btn-light w-100 fw-medium" onclick="gerenciarTurma('${t.nome}')">
                                Detalhes da Turma
                            </button>
                        </div>
                    </div>
                `;
                // Inserir antes da última DIV (que normalmente é o botão "Nova Turma")
                container.insertBefore(card, container.lastElementChild);
            });
            filtrarTurmas();
        } else {
            console.error('Erro:', res.message);
        }
    } catch (error) {
        console.error('Erro de conexão', error);
    }
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
