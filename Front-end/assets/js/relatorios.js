
let currentTipo = 'frequencia';

document.addEventListener('DOMContentLoaded', () => {

    setDataAtualRel();
    carregarTurmasDropdown();

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
            
            currentTipo = btn.dataset.tipo;
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
        showToast('Exportando relatório para planilha excel...', 'success');
    });

});

function setDataAtualRel() {
    const dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje  = new Date();
    const el    = document.getElementById('dataAtual');
    if (el) el.textContent = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;
}

/* Popula select de turmas */
async function carregarTurmasDropdown() {
    try {
        const response = await fetch('../../Back-End/api/listar_turmas.php');
        const res = await response.json();

        if (res.status === 'success') {
            const select = document.getElementById('selectRelTurma');
            if (select) {
                select.innerHTML = '<option value="">Todas as Turmas</option>';
                res.data.forEach(t => {
                    const option = document.createElement('option');
                    option.value = t.id;
                    option.textContent = `${t.nome} - ${t.periodo}`;
                    select.appendChild(option);
                });
            }
        }
    } catch (error) {
        console.error("Erro ao carregar turmas no relatorio:", error);
    }
}

/* Gera o relatório chamando a API do backend */
async function gerarRelatorio() {
    const btn = document.getElementById('btnGerarRel');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Gerando...';

    showLoading();

    const aluno = document.getElementById('inputRelAluno')?.value.trim();
    const turma = document.getElementById('selectRelTurma')?.value;
    const inicio = document.getElementById('inputRelDataInicio')?.value;
    const fim = document.getElementById('inputRelDataFim')?.value;

    let url = `../../Back-End/api/get_relatorio.php?tipo=${currentTipo}`;
    if (aluno) url += `&aluno=${encodeURIComponent(aluno)}`;
    if (turma) url += `&turma=${turma}`;
    if (inicio) url += `&data_inicio=${inicio}`;
    if (fim) url += `&data_fim=${fim}`;

    try {
        const response = await fetch(url);
        const res = await response.json();
        hideLoading();

        if (res.status === 'success') {
            // Mostrar resultado
            const resultado = document.getElementById('relResultado');
            resultado.classList.add('visible');

            // 1. Atualizar cards resumo
            document.getElementById('relN1').textContent = res.summary.n1;
            document.getElementById('relN2').textContent = res.summary.n2;
            document.getElementById('relN3').textContent = res.summary.n3;
            document.getElementById('relN4').textContent = res.summary.n4;

            // Atualizar labels dos cards resumo
            const boxes = document.querySelectorAll('.rel-numero-item');
            if (boxes.length === 4) {
                boxes[0].querySelector('.rel-numero-label').textContent = res.summary.labels.n1;
                boxes[1].querySelector('.rel-numero-label').textContent = res.summary.labels.n2;
                boxes[2].querySelector('.rel-numero-label').textContent = res.summary.labels.n3;
                boxes[3].querySelector('.rel-numero-label').textContent = res.summary.labels.n4;
            }

            // 2. Renderizar gráfico
            renderGrafico(res.chart);

            // 3. Renderizar Tabela com cabeçalho e corpo corretos
            renderizarTabelaDetalhada(res.data);

            // Scroll suave
            resultado.scrollIntoView({ behavior: 'smooth', block: 'start' });
            showToast('Relatório gerado com sucesso!', 'success');
        } else {
            showToast('Erro ao gerar relatório: ' + res.message, 'danger');
        }
    } catch (error) {
        hideLoading();
        console.error("Erro de requisição relatorio:", error);
        showToast('Erro de conexão ao buscar relatório.', 'danger');
    } finally {
        btn.disabled = false;
        btn.innerHTML = '<i class="bi bi-bar-chart-fill me-1"></i> Gerar Relatório';
    }
}

/* Renderiza o gráfico de barras CSS */
function renderGrafico(chartData) {
    const container = document.getElementById('graficoBarras');
    if (!container) return;

    container.innerHTML = '';

    chartData.forEach((d, i) => {
        const item = document.createElement('div');
        item.className = 'grafico-barra-item';

        const valorEl = document.createElement('div');
        valorEl.className = 'grafico-barra-valor';
        
        let displayVal = d.valor;
        let isPct = currentTipo === 'frequencia' || currentTipo === 'alimentacao';
        valorEl.textContent = displayVal + (isPct ? '%' : '');

        const fillEl = document.createElement('div');
        
        // Define classe de cor baseada no tipo e valor
        let cor = '';
        if (isPct) {
            if (d.valor < 75) cor = 'vermelho';
            else if (d.valor < 85) cor = 'laranja';
            else cor = 'verde';
        } else {
            // para contagens de atraso ou banho
            if (d.valor > 10) cor = 'vermelho';
            else if (d.valor > 5) cor = 'laranja';
            else cor = 'verde';
        }
        fillEl.className = `grafico-barra-fill ${cor}`;
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
            // Normalizar altura do gráfico se não for porcentagem
            let heightVal = isPct ? d.valor : Math.min(100, d.valor * 5);
            fillEl.style.height = heightVal + '%';
        }, 60 * (i + 1));
    });
}

/* Constrói a tabela dinamicamente com base nas colunas necessárias */
function renderizarTabelaDetalhada(data) {
    const table = document.getElementById('tabelaRel');
    if (!table) return;

    // Cabeçalho da tabela
    let theadHtml = '';
    if (currentTipo === 'frequencia') {
        theadHtml = `
            <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Dias Presentes</th>
                <th>Faltas</th>
                <th>Atrasos</th>
                <th>Frequência</th>
            </tr>
        `;
    } else if (currentTipo === 'alimentacao') {
        theadHtml = `
            <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Refeições Servidas</th>
                <th>Refeições Recusadas</th>
                <th>Total Refeições</th>
                <th>Taxa de Aceitação</th>
            </tr>
        `;
    } else if (currentTipo === 'banhos') {
        theadHtml = `
            <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Banhos Realizados</th>
                <th>Banhos Recusados</th>
                <th>Total Registros</th>
            </tr>
        `;
    } else if (currentTipo === 'atrasos') {
        theadHtml = `
            <tr>
                <th>Aluno</th>
                <th>Turma</th>
                <th>Data</th>
                <th>Horário Entrada</th>
                <th>Observação / Atraso</th>
            </tr>
        `;
    }

    const thead = table.querySelector('thead');
    if (thead) thead.innerHTML = theadHtml;

    // Corpo da tabela
    const tbody = document.getElementById('tbodyRel');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (data.length === 0) {
        let cols = currentTipo === 'atrasos' ? 5 : (currentTipo === 'banhos' ? 5 : 6);
        tbody.innerHTML = `<tr><td colspan="${cols}" class="text-center text-muted py-4">Nenhum registro encontrado para os filtros selecionados.</td></tr>`;
        return;
    }

    let tbodyHtml = '';
    data.forEach(row => {
        if (currentTipo === 'frequencia') {
            let freqClass = 'baixa';
            if (row.frequencia >= 90) freqClass = '';
            else if (row.frequencia >= 80) freqClass = 'media';

            tbodyHtml += `
                <tr>
                    <td>${escapeHtml(row.aluno)}</td>
                    <td>${escapeHtml(row.turma || 'Sem Turma')}</td>
                    <td>${row.dias_presentes}</td>
                    <td>${row.faltas}</td>
                    <td>${row.atrasos}</td>
                    <td>
                        <div class="freq-bar d-flex align-items-center gap-2">
                            <div class="freq-bar-track">
                                <div class="freq-bar-fill ${freqClass}" style="width:${row.frequencia}%"></div>
                            </div>
                            <span class="freq-pct ${freqClass}">${row.frequencia}%</span>
                        </div>
                    </td>
                </tr>
            `;
        } else if (currentTipo === 'alimentacao') {
            let aceitClass = 'baixa';
            if (row.taxa_aceitacao >= 90) aceitClass = '';
            else if (row.taxa_aceitacao >= 80) aceitClass = 'media';

            tbodyHtml += `
                <tr>
                    <td>${escapeHtml(row.aluno)}</td>
                    <td>${escapeHtml(row.turma || 'Sem Turma')}</td>
                    <td>${row.refeicoes_servidas}</td>
                    <td>${row.refeicoes_recusadas}</td>
                    <td>${row.total_refeicoes}</td>
                    <td>
                        <div class="freq-bar d-flex align-items-center gap-2">
                            <div class="freq-bar-track">
                                <div class="freq-bar-fill ${aceitClass}" style="width:${row.taxa_aceitacao}%"></div>
                            </div>
                            <span class="freq-pct ${aceitClass}">${row.taxa_aceitacao}%</span>
                        </div>
                    </td>
                </tr>
            `;
        } else if (currentTipo === 'banhos') {
            tbodyHtml += `
                <tr>
                    <td>${escapeHtml(row.aluno)}</td>
                    <td>${escapeHtml(row.turma || 'Sem Turma')}</td>
                    <td>${row.banhos_realizados}</td>
                    <td>${row.banhos_recusados}</td>
                    <td>${row.total_banhos}</td>
                </tr>
            `;
        } else if (currentTipo === 'atrasos') {
            let dataFmt = row.data;
            if (row.data) {
                const partes = row.data.split('-');
                if (partes.length === 3) {
                    dataFmt = `${partes[2]}/${partes[1]}/${partes[0]}`;
                }
            }

            tbodyHtml += `
                <tr>
                    <td>${escapeHtml(row.aluno)}</td>
                    <td>${escapeHtml(row.turma || 'Sem Turma')}</td>
                    <td>${escapeHtml(dataFmt)}</td>
                    <td class="text-danger fw-bold">${escapeHtml(row.horario)}</td>
                    <td><span class="badge-status badge-vermelho">${escapeHtml(row.observacao || 'Atrasado')}</span></td>
                </tr>
            `;
        }
    });

    tbody.innerHTML = tbodyHtml;
}

// Helpers para escapar caracteres
function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
