
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

    // Animação contadora dos números
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

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair do sistema?')) return;
        showToast('Saindo do sistema...', 'warning');
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

});
