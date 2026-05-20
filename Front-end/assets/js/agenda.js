
document.addEventListener('DOMContentLoaded', () => {

    setDataAtualAgenda();

    // Botão sair
    document.getElementById('btnSair')?.addEventListener('click', e => {
        e.preventDefault();
        if (!confirm('Deseja realmente sair?')) return;
        showLoading();
        setTimeout(() => { window.location.href = 'login.html'; }, 1200);
    });

    // Mês atual
    window.agendaMesAtual = new Date().getMonth();
    window.agendaAnoAtual = new Date().getFullYear();

    renderCalendario();
    renderEventosLista();
    syncPainelEventosAltura();
    window.addEventListener('resize', syncPainelEventosAltura);

    // Navegação de meses
    document.getElementById('btnMesAnterior')?.addEventListener('click', () => {
        window.agendaMesAtual--;
        if (window.agendaMesAtual < 0) { window.agendaMesAtual = 11; window.agendaAnoAtual--; }
        renderCalendario();
        renderEventosLista();
    });

    document.getElementById('btnProximoMes')?.addEventListener('click', () => {
        window.agendaMesAtual++;
        if (window.agendaMesAtual > 11) { window.agendaMesAtual = 0; window.agendaAnoAtual++; }
        renderCalendario();
        renderEventosLista();
    });

    // Filtros de tipo
    document.querySelectorAll('.filtro-tipo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-tipo-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderEventosLista(btn.dataset.tipo);
        });
    });

    // Salvar evento
    document.getElementById('btnSalvarEvento')?.addEventListener('click', () => {
        const titulo = document.getElementById('inputTituloEvento')?.value.trim();
        const data   = document.getElementById('inputDataEvento')?.value;
        const tipo   = document.getElementById('selectTipoEvento')?.value;
        if (!titulo || !data || !tipo) { showToast('Preencha título, data e tipo.', 'warning'); return; }

        const btn = document.getElementById('btnSalvarEvento');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
        setTimeout(() => {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Evento';
            toggleModal('modalEvento', 'hide');
            document.getElementById('formEvento')?.reset();
            showToast('Evento adicionado com sucesso!', 'success');
        }, 1000);
    });

});

// Dados fake de eventos 

const eventosData = [
    { dia: 2,  titulo:'Reunião pedagógica',     tipo:'reuniao',  hora:'09:00' },
    { dia: 5,  titulo:'Prova de Matemática',    tipo:'prova',    hora:'08:30' },
    { dia: 8,  titulo:'Passeio ao zoológico',   tipo:'evento',   hora:'07:00' },
    { dia: 10, titulo:'Entrega de boletins',    tipo:'lembrete', hora:'14:00' },
    { dia: 12, titulo:'Reunião de pais',        tipo:'reuniao',  hora:'19:00' },
    { dia: 15, titulo:'Prova de Português',     tipo:'prova',    hora:'08:30' },
    { dia: 18, titulo:'Feira de Ciências',      tipo:'evento',   hora:'09:00' },
    { dia: 20, titulo:'Aniversário da escola',  tipo:'feriado',  hora:'—' },
    { dia: 22, titulo:'Conselho de classe',     tipo:'reuniao',  hora:'16:00' },
    { dia: 25, titulo:'Simulado geral',         tipo:'prova',    hora:'08:00' },
    { dia: 28, titulo:'Encerramento do mês',    tipo:'lembrete', hora:'17:00' },
];

/**
 * Alinha a altura máxima do painel lateral à do calendário (desktop).
 */
function syncPainelEventosAltura() {
    const painel  = document.querySelector('.agenda-painel-eventos');
    const scroll  = painel?.querySelector('.eventos-lista-scroll');
    const blocoCal = document.querySelector('.agenda-col-calendario');
    if (!painel || !scroll || !blocoCal) return;

    const limpar = () => {
        painel.style.removeProperty('max-height');
        scroll.style.removeProperty('max-height');
    };

    if (window.innerWidth < 992) {
        limpar();
        scroll.style.maxHeight = `${Math.min(360, Math.max(220, window.innerHeight * 0.38))}px`;
        scroll.style.overflowY = 'auto';
        return;
    }

    requestAnimationFrame(() => {
        const alturaCal = blocoCal.offsetHeight;
        if (alturaCal <= 0) return;

        const header  = painel.querySelector('.agenda-painel-header');
        const filtros = painel.querySelector('.agenda-filtros');
        const estilo  = getComputedStyle(painel);
        const gap     = parseFloat(estilo.rowGap || estilo.gap) || 10;
        const pad     = parseFloat(estilo.paddingTop) + parseFloat(estilo.paddingBottom);
        const alturaTopo = (header?.offsetHeight || 0) + (filtros?.offsetHeight || 0) + gap * 2;
        const alturaPainel = Math.min(alturaCal, window.innerHeight - 150);

        painel.style.maxHeight = `${alturaPainel}px`;
        scroll.style.maxHeight = `${Math.max(140, alturaPainel - alturaTopo - pad)}px`;
        scroll.style.overflowY = 'auto';
    });
}

function setDataAtualAgenda() {
    const dias  = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const hoje  = new Date();
    const el    = document.getElementById('dataAtual');
    if (el) el.textContent = `${dias[hoje.getDay()]}, ${String(hoje.getDate()).padStart(2,'0')} de ${meses[hoje.getMonth()]}`;
}

/**
 * Renderiza o grid do calendário mensal
 */
function renderCalendario() {
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const mes = window.agendaMesAtual;
    const ano = window.agendaAnoAtual;

    // Atualizar título
    document.getElementById('agendaMesTitulo').textContent = `${meses[mes]} ${ano}`;

    const grid = document.getElementById('calendarioGrid');
    grid.innerHTML = '';

    const primeiroDia   = new Date(ano, mes, 1).getDay();
    const diasNoMes     = new Date(ano, mes + 1, 0).getDate();
    const diasMesAnt    = new Date(ano, mes, 0).getDate();
    const hoje          = new Date();
    const ehMesAtual    = (hoje.getMonth() === mes && hoje.getFullYear() === ano);

    // Dias do mês anterior (preenchimento)
    for (let i = primeiroDia - 1; i >= 0; i--) {
        const dia = diasMesAnt - i;
        grid.appendChild(criarCelula(dia, true, false, []));
    }

    // Dias do mês atual
    for (let d = 1; d <= diasNoMes; d++) {
        const ehHoje = ehMesAtual && d === hoje.getDate();
        const evtsDia = eventosData.filter(e => e.dia === d);
        grid.appendChild(criarCelula(d, false, ehHoje, evtsDia));
    }

    // Preencher próximo mês
    const totalCelulas = grid.children.length;
    const faltam = (Math.ceil(totalCelulas / 7) * 7) - totalCelulas;
    for (let i = 1; i <= faltam; i++) {
        grid.appendChild(criarCelula(i, true, false, []));
    }

    syncPainelEventosAltura();
}

/**
 * Cria uma célula do calendário
 */
function criarCelula(dia, outroMes, ehHoje, eventos) {
    const cell = document.createElement('div');
    cell.className = 'calendario-cell';
    if (outroMes) cell.classList.add('outro-mes');
    if (ehHoje) cell.classList.add('hoje');
    if (eventos.length > 0) cell.classList.add('tem-evento');

    const num = document.createElement('div');
    num.className = 'cell-numero';
    num.textContent = dia;
    cell.appendChild(num);

    if (eventos.length > 0) {
        const evtsDiv = document.createElement('div');
        evtsDiv.className = 'cell-eventos';
        eventos.slice(0, 2).forEach(ev => {
            const chip = document.createElement('span');
            chip.className = `evento-chip ${ev.tipo}`;
            chip.textContent = ev.titulo;
            chip.title = `${ev.titulo} — ${ev.hora}`;
            evtsDiv.appendChild(chip);
        });
        if (eventos.length > 2) {
            const mais = document.createElement('span');
            mais.className = 'evento-chip lembrete';
            mais.textContent = `+${eventos.length - 2} mais`;
            evtsDiv.appendChild(mais);
        }
        cell.appendChild(evtsDiv);
    }

    cell.addEventListener('click', () => {
        if (outroMes) return;
        const evts = eventosData.filter(e => e.dia === dia);
        if (evts.length > 0) {
            showToast(`Dia ${dia}: ${evts.map(e => e.titulo).join(', ')}`, 'info');
        } else {
            // Abrir modal novo evento com data preenchida
            const dateStr = `${window.agendaAnoAtual}-${String(window.agendaMesAtual + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
            document.getElementById('inputDataEvento').value = dateStr;
            toggleModal('modalEvento', 'show');
        }
    });

    return cell;
}

/**
 * Renderiza a lista lateral de eventos
 * @param {string} filtroTipo
 */
function renderEventosLista(filtroTipo = '') {
    const lista = document.getElementById('eventosLista');
    if (!lista) return;

    const eventosFiltrados = filtroTipo
        ? eventosData.filter(e => e.tipo === filtroTipo)
        : eventosData;

    if (eventosFiltrados.length === 0) {
        lista.innerHTML = '<p class="eventos-lista-vazio">Nenhum evento encontrado.</p>';
        syncPainelEventosAltura();
        return;
    }

    lista.innerHTML = eventosFiltrados.map(ev => `
        <div class="evento-item" role="listitem">
            <div class="evento-dot ${ev.tipo}"></div>
            <div class="evento-info">
                <div class="evento-titulo">${ev.titulo}</div>
                <div class="evento-detalhe">Dia ${ev.dia} · ${ev.tipo.charAt(0).toUpperCase() + ev.tipo.slice(1)}</div>
            </div>
            <span class="evento-hora">${ev.hora}</span>
        </div>
    `).join('');

    syncPainelEventosAltura();
}
