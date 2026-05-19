
document.addEventListener('DOMContentLoaded', () => {

    setDataAtualRel();

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair?')) return;
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    // Seletor de tipo de relatório
    document.querySelectorAll('.rel-tipo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.rel-tipo-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showToast(`Relatório selecionado: ${btn.textContent.trim()}`, 'info');
        });
    });

    // Gerar relatório
    document.getElementById('btnGerarRel')?.addEventListener('click', gerarRelatorio);

    // Exportar fake
    document.getElementById('btnExportarRel')?.addEventListener('click', () => {
        const resultado = document.getElementById('relResultado');
        if (!resultado || !resultado.classList.contains('visible')) {
            showToast('Gere o relatório antes de exportar.', 'warning');
            return;
        }
        showToast('Exportando relatório... (simulação)', 'success');
    });

});

function setDataAtualRel() {
    const dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje  = new Date();
    const el    = document.getElementById('dataAtual');
    if (el) el.textContent = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;
}

/* Simula a geração de relatório com loading e gráfico */
function gerarRelatorio() {
    const btn = document.getElementById('btnGerarRel');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Gerando...';

    showLoading();

    setTimeout(() => {
        hideLoading();
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-bar-chart-fill me-1"></i> Gerar Relatório';

        // Mostrar resultado
        const resultado = document.getElementById('relResultado');
        resultado.classList.add('visible');

        // Gerar gráfico de barras
        renderGrafico();

        // Scroll suave
        resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });

        showToast('Relatório gerado com sucesso!', 'success');
    }, 1500);
}

/* Renderiza o gráfico de barras CSS com dados fake */
function renderGrafico() {
    const container = document.getElementById('graficoBarras');
    if (!container) return;

    const dadosMeses = [
        { label: 'Jan', valor: 95, cor: '' },
        { label: 'Fev', valor: 88, cor: '' },
        { label: 'Mar', valor: 92, cor: '' },
        { label: 'Abr', valor: 78, cor: 'laranja' },
        { label: 'Mai', valor: 96, cor: '' },
        { label: 'Jun', valor: 85, cor: '' },
        { label: 'Jul', valor: 70, cor: 'vermelho' },
        { label: 'Ago', valor: 91, cor: '' },
        { label: 'Set', valor: 94, cor: '' },
        { label: 'Out', valor: 89, cor: '' },
        { label: 'Nov', valor: 97, cor: 'verde' },
        { label: 'Dez', valor: 93, cor: '' },
    ];

    container.innerHTML = '';

    dadosMeses.forEach((d, i) => {
        const item = document.createElement('div');
        item.className = 'grafico-barra-item';

        const valorEl = document.createElement('div');
        valorEl.className = 'grafico-barra-valor';
        valorEl.textContent = d.valor + '%';

        const fillEl = document.createElement('div');
        fillEl.className = `grafico-barra-fill ${d.cor}`;
        fillEl.style.height = '0%';

        const labelEl = document.createElement('div');
        labelEl.className = 'grafico-barra-label';
        labelEl.textContent = d.label;

        item.appendChild(valorEl);
        item.appendChild(fillEl);
        item.appendChild(labelEl);
        container.appendChild(item);

        // Animar barra com delay
        setTimeout(() => {
            fillEl.style.height = d.valor + '%';
        }, 100 * (i + 1));
    });
}
