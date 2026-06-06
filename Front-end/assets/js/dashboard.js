
document.addEventListener('DOMContentLoaded', () => {

    // Data atual 
    const dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje  = new Date();
    const dataFmt = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;
    const elData = document.getElementById('dataAtual');
    if (elData) elData.textContent = dataFmt;

    // Toast boas-vindas 
    setTimeout(() => showToast('Bem-vindo ao Dashboard! 👋', 'success'), 600);

    // Animação fade-in dos cards
    document.querySelectorAll('.dash-card').forEach((card, i) => {
        setTimeout(() => card.classList.add('visible'), 150 * (i + 1));
    });

    // Função de animação de contador
    function animateCounter(el) {
        const target   = parseInt(el.dataset.target) || 0;
        const duration = 1200;
        const start    = performance.now();

        function update(now) {
            const progress = Math.min((now - start) / duration, 1);
            const eased    = 1 - Math.pow(1 - progress, 3); // easeOutCubic
            el.textContent = Math.floor(target * eased);
            if (progress < 1) requestAnimationFrame(update);
            else el.textContent = target;
        }

        setTimeout(() => requestAnimationFrame(update), 100);
    }

    // Helper para escapar HTML
    function escapeHtml(text) {
        if (!text) return '';
        return text.toString()
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    // Carregar estatísticas reais do banco de dados
    fetch('../../Back-End/api/get_dashboard_stats.php')
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success' || data.status === 'warning') {
                const totalAlunos = document.getElementById('cardTotalAlunos');
                const professoresAtivos = document.getElementById('cardProfessoresAtivos');
                const turmasAbertas = document.getElementById('cardTurmasAbertas');
                const mensalidadesPendentes = document.getElementById('cardMensalidadesPendentes');

                if (totalAlunos) totalAlunos.dataset.target = data.total_alunos;
                if (professoresAtivos) professoresAtivos.dataset.target = data.professores_ativos;
                if (turmasAbertas) turmasAbertas.dataset.target = data.turmas_abertas;
                if (mensalidadesPendentes) mensalidadesPendentes.dataset.target = data.mensalidades_pendentes;

                // Animar contadores
                [totalAlunos, professoresAtivos, turmasAbertas, mensalidadesPendentes].forEach(el => {
                    if (el) animateCounter(el);
                });

                // Preencher tabela de últimos alunos cadastrados
                const tbody = document.getElementById('tbodyUltimosAlunos');
                if (tbody && data.ultimos_alunos) {
                    tbody.innerHTML = '';
                    if (data.ultimos_alunos.length === 0) {
                        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-3">Nenhum aluno cadastrado no banco.</td></tr>';
                    } else {
                        data.ultimos_alunos.forEach(aluno => {
                            const tr = document.createElement('tr');
                            const turma = aluno.turma ? aluno.turma : 'Sem Turma';
                            const responsavel = aluno.responsavel ? aluno.responsavel : 'Sem Responsável';
                            tr.innerHTML = `
                                <td>${escapeHtml(aluno.nome)}</td>
                                <td>${escapeHtml(turma)}</td>
                                <td>${escapeHtml(responsavel)}</td>
                                <td><span class="badge-status badge-verde">Ativo</span></td>
                            `;
                            tbody.appendChild(tr);
                        });
                    }
                }

                // Preencher Agenda de Hoje
                const listaAgenda = document.getElementById('listaAgendaHoje');
                if (listaAgenda && data.agenda_hoje) {
                    listaAgenda.innerHTML = '';
                    if (data.agenda_hoje.length === 0) {
                        listaAgenda.innerHTML = '<li class="text-center text-muted py-3 small">Nenhum evento agendado para hoje.</li>';
                    } else {
                        data.agenda_hoje.forEach(evt => {
                            const li = document.createElement('li');
                            li.className = 'd-flex align-items-center gap-2';
                            
                            let badgeClass = 'badge-azul';
                            let tipoNome = 'Evento';
                            
                            switch (evt.tipo) {
                                case 'reuniao':
                                    badgeClass = 'badge-azul';
                                    tipoNome = 'Reunião';
                                    break;
                                case 'prova':
                                    badgeClass = 'badge-vermelho';
                                    tipoNome = 'Prova';
                                    break;
                                case 'evento':
                                    badgeClass = 'badge-verde';
                                    tipoNome = 'Evento';
                                    break;
                                case 'lembrete':
                                    badgeClass = 'badge-laranja';
                                    tipoNome = 'Lembrete';
                                    break;
                                case 'feriado':
                                    badgeClass = 'badge-vermelho';
                                    tipoNome = 'Feriado';
                                    break;
                            }
                            
                            li.innerHTML = `
                                <span class="dash-lista-hora flex-shrink-0">${escapeHtml(evt.hora)}</span>
                                <span class="dash-lista-texto flex-grow-1 text-truncate" title="${escapeHtml(evt.descricao || evt.titulo)}">${escapeHtml(evt.titulo)}</span>
                                <span class="badge-status ${badgeClass} flex-shrink-0">${tipoNome}</span>
                            `;
                            listaAgenda.appendChild(li);
                        });
                    }
                }

                // Preencher Avisos Importantes
                const listaAvisos = document.getElementById('listaAvisos');
                if (listaAvisos && data.avisos) {
                    listaAvisos.innerHTML = '';
                    if (data.avisos.length === 0) {
                        listaAvisos.innerHTML = '<li class="text-center text-muted py-3 small">Nenhum aviso importante cadastrado.</li>';
                    } else {
                        data.avisos.forEach(aviso => {
                            const li = document.createElement('li');
                            li.className = 'd-flex align-items-center gap-2';
                            
                            let textClass = 'text-primary';
                            if (aviso.tipo === 'success') textClass = 'text-success';
                            else if (aviso.tipo === 'warning') textClass = 'text-warning';
                            else if (aviso.tipo === 'danger' || aviso.tipo === 'error') textClass = 'text-danger';
                            
                            li.innerHTML = `
                                <i class="bi bi-circle-fill ${textClass} flex-shrink-0" style="font-size:.5rem"></i>
                                <span class="dash-lista-texto">${escapeHtml(aviso.texto)}</span>
                            `;
                            listaAvisos.appendChild(li);
                        });
                    }
                }
            } else {
                console.warn('Backend retornou erro, usando mock:', data.message);
                document.querySelectorAll('.dash-card-numero').forEach(el => animateCounter(el));
            }
        })
        .catch(err => {
            console.error('Falha ao conectar ao backend:', err);
            // Fallback animando os mocks padrões do HTML
            document.querySelectorAll('.dash-card-numero').forEach(el => animateCounter(el));
        });

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair do sistema?')) return;
        showToast('Saindo do sistema...', 'warning');
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });
});

