
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

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair do sistema?')) return;
        showToast('Saindo do sistema...', 'warning');
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    carregarDashboard();
});

async function carregarDashboard() {
    try {
        // Estatísticas
        const respStats = await fetch('../../Back-End/api/dashboard_stats.php');
        const stats = await respStats.json();
        
        if (stats.status === 'success') {
            const numeros = document.querySelectorAll('.dash-card-numero');
            if (numeros[0]) numeros[0].dataset.target = stats.data.total_alunos;
            if (numeros[1]) numeros[1].dataset.target = stats.data.total_professores;
            if (numeros[2]) numeros[2].dataset.target = stats.data.total_turmas;
            // O 4º card é mensalidades pendentes, permanece estático
        }
        
        animarNumeros();

        // Últimos Alunos
        const respAlunos = await fetch('../../Back-End/api/listar_alunos.php');
        const dadosAlunos = await respAlunos.json();
        
        if (dadosAlunos.status === 'success') {
            const tbody = document.querySelector('.table-dash tbody');
            if (tbody) {
                tbody.innerHTML = '';
                // Pegar os 5 últimos
                const ultimos = dadosAlunos.data.slice(-5).reverse();
                
                if (ultimos.length === 0) {
                    tbody.innerHTML = '<tr><td colspan="4" class="text-center">Nenhum aluno cadastrado.</td></tr>';
                } else {
                    ultimos.forEach(a => {
                        tbody.innerHTML += `
                            <tr>
                                <td>${a.nome}</td>
                                <td>${a.turma || 'Sem turma'} - ${a.periodo || ''}</td>
                                <td>${a.resp || 'Sem responsável'}</td>
                                <td><span class="badge-status badge-verde">Ativo</span></td>
                            </tr>
                        `;
                    });
                }
            }
        }
    } catch (error) {
        console.error('Erro ao carregar dashboard', error);
        animarNumeros(); // Anima com 0 ou estáticos se der erro
    }
}

function animarNumeros() {
    document.querySelectorAll('.dash-card-numero').forEach(el => {
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

        setTimeout(() => requestAnimationFrame(update), 500);
    });
}
