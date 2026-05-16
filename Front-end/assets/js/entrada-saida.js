
document.addEventListener('DOMContentLoaded', () => {

    // Data atual
    const dias = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje = new Date();
    const dataFmt = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;

    const elData = document.getElementById('dataAtual');
    const elEsData = document.getElementById('esDataHoje');
    if (elData)   elData.textContent = dataFmt;
    if (elEsData) elEsData.textContent = `${String(hoje.getDate()).padStart(2,'0')}/${String(hoje.getMonth()+1).padStart(2,'0')}/${hoje.getFullYear()}`;

    // Botão sair
    const btnSair = document.getElementById('btnSair');
    if (btnSair) {
        btnSair.addEventListener('click', e => {
            e.preventDefault();
            if (!confirm('Deseja realmente sair do sistema?')) return;
            showToast('Saindo...', 'warning');
            showLoading();
            setTimeout(() => { window.location.href = 'login.html'; }, 1200);
        });
    }

    // Animação dos cards de status
    document.querySelectorAll('.status-card .status-numero').forEach(el => {
        const target = parseInt(el.dataset.target || el.textContent) || 0;
        el.textContent = '0';
        const dur = 1000;
        const start = performance.now();
        function tick(now) {
            const p = Math.min((now - start) / dur, 1);
            el.textContent = Math.floor(target * (1 - Math.pow(1 - p, 3)));
            if (p < 1) requestAnimationFrame(tick);
            else el.textContent = target;
        }
        setTimeout(() => requestAnimationFrame(tick), 300);
    });

    // Tabs de filtro
    document.querySelectorAll('.tab-filtro-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-filtro-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            // Aqui se conectaria com backend para filtrar por tab
            showToast(`Exibindo: ${btn.textContent.trim()}`, 'info');
        });
    });

    // Busca dinâmica 
    const searchInput = document.getElementById('searchAluno');
    if (searchInput) {
        searchInput.addEventListener('input', () => {
            const q = searchInput.value.toLowerCase().trim();
            filtrarTabela('tabelaEntradas', q);
            filtrarTabela('tabelaSaidas', q);
        });
    }

    // Filtros de select 
    ['filterTurma', 'filterStatus'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('change', aplicarFiltros);
        }
    });

    // Paginação fake 
    document.querySelectorAll('.es-pagination-btns button').forEach(btn => {
        btn.addEventListener('click', () => {
            if (btn.querySelector('i')) return; // setas
            document.querySelectorAll('.es-pagination-btns button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });

    // Botão confirmar saída
    const btnConfSaida = document.getElementById('btnConfirmarSaida');
    if (btnConfSaida) {
        btnConfSaida.addEventListener('click', () => {
            const nome = document.getElementById('saidaNome').textContent;
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalSaida'));
            if (modal) modal.hide();
            showToast(`Saída de ${nome} registrada com sucesso!`, 'success');
        });
    }

});

/**
 * Filtra linhas de uma tabela pelo texto de busca
 * @param {string} tableId
 * @param {string} query
 */
function filtrarTabela(tableId, query) {
    const tbody = document.querySelector(`#${tableId} tbody`);
    if (!tbody) return;
    tbody.querySelectorAll('tr').forEach(row => {
        const texto = row.textContent.toLowerCase();
        row.style.display = texto.includes(query) ? '' : 'none';
    });
}

/* Aplica filtros combinados de turma e status */
function aplicarFiltros() {
    const turma  = (document.getElementById('filterTurma')?.value  || '').toLowerCase();
    const status = (document.getElementById('filterStatus')?.value || '').toLowerCase();

    ['tabelaEntradas', 'tabelaSaidas'].forEach(id => {
        const tbody = document.querySelector(`#${id} tbody`);
        if (!tbody) return;
        tbody.querySelectorAll('tr').forEach(row => {
            const txt = row.textContent.toLowerCase();
            const okTurma  = !turma  || txt.includes(turma);
            const okStatus = !status || txt.includes(status);
            row.style.display = (okTurma && okStatus) ? '' : 'none';
        });
    });
}

/**
 * Abre modal de detalhes do aluno
 * @param {string} nome
 */
function abrirDetalhes(nome) {
    const dados = {
        'Carla Ferreira': { turma:'Rosa', horaPrev:'08:00', entrada:'10:45', status:'Atrasado', resp:'Maria Ferreira', obs:'Transporte particular' },
        'Daniel Santos':  { turma:'Girassol', horaPrev:'08:00', entrada:'07:02', status:'Atrasado', resp:'João Santos', obs:'Regularmente atrasado' },
        'Maria Oliveira': { turma:'Girassol', horaPrev:'08:00', entrada:'09:30', status:'Atrasado', resp:'Carlos Oliveira', obs:'—' },
    };

    const d = dados[nome] || {};
    document.getElementById('detNome').textContent       = nome;
    document.getElementById('detTurma').textContent      = d.turma      || '—';
    document.getElementById('detHoraPrev').textContent   = d.horaPrev   || '—';
    document.getElementById('detEntrada').textContent    = d.entrada    || '—';
    document.getElementById('detStatus').innerHTML       = d.status ? `<span class="es-status atrasado">${d.status}</span>` : '—';
    document.getElementById('detResponsavel').textContent = d.resp      || '—';
    document.getElementById('detObs').textContent        = d.obs        || '—';

    toggleModal('modalDetalhes', 'show');
}

/**
 * Abre modal de registro de saída
 * @param {string} nome
 */
function registrarSaida(nome) {
    document.getElementById('saidaNome').textContent = nome;
    document.getElementById('saidaObs').value = '';
    toggleModal('modalSaida', 'show');
}
