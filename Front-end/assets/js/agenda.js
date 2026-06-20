
let eventosData = [];

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

    carregarEventos();
    syncPainelEventosAltura();
    window.addEventListener('resize', syncPainelEventosAltura);

    // Navegação de meses
    document.getElementById('btnMesAnterior')?.addEventListener('click', () => {
        window.agendaMesAtual--;
        if (window.agendaMesAtual < 0) { window.agendaMesAtual = 11; window.agendaAnoAtual--; }
        carregarEventos();
    });

    document.getElementById('btnProximoMes')?.addEventListener('click', () => {
        window.agendaMesAtual++;
        if (window.agendaMesAtual > 11) { window.agendaMesAtual = 0; window.agendaAnoAtual++; }
        carregarEventos();
    });

    // Filtros de tipo
    document.querySelectorAll('.filtro-tipo-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.filtro-tipo-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            renderEventosLista(btn.dataset.tipo);
        });
    });

    // Salvar/Editar evento
    document.getElementById('btnSalvarEvento')?.addEventListener('click', async () => {
        const titulo = document.getElementById('inputTituloEvento')?.value.trim();
        const data   = document.getElementById('inputDataEvento')?.value;
        const tipo   = document.getElementById('selectTipoEvento')?.value;
        if (!titulo || !data || !tipo) { showToast('Preencha título, data e tipo.', 'warning'); return; }

        const btn = document.getElementById('btnSalvarEvento');
        btn.disabled = true;
        btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Salvando...';
        
        try {
            const form = document.getElementById('formEvento');
            const formData = new FormData(form);

            const response = await fetch('../../Back-End/api/save_evento.php', {
                method: 'POST',
                body: formData
            });
            const res = await response.json();

            if (res.status === 'success' || res.status === 'warning') {
                toggleModal('modalEvento', 'hide');
                form.reset();
                showToast(res.message, res.status === 'warning' ? 'warning' : 'success');
                carregarEventos();
            } else {
                showToast(res.message, 'danger');
            }
        } catch (error) {
            console.error("Erro ao salvar evento:", error);
            showToast('Erro de conexão ao salvar evento.', 'danger');
        } finally {
            btn.disabled = false;
            btn.innerHTML = '<i class="bi bi-check-lg me-1"></i>Salvar Evento';
        }
    });

    // Resetar modal de eventos ao fechar
    document.getElementById('modalEvento')?.addEventListener('hidden.bs.modal', () => {
        const form = document.getElementById('formEvento');
        if (form) form.reset();
        
        const inputId = document.getElementById('inputIdEvento');
        if (inputId) inputId.value = '';

        document.getElementById('modalEventoTitle').innerHTML =
            '<i class="bi bi-calendar-plus-fill me-2"></i>Novo Evento';
    });

});

/**
 * Carrega eventos do backend e renderiza tela
 */
async function carregarEventos() {
    showLoading();
    try {
        const response = await fetch(`../../Back-End/api/get_eventos.php?mes=${window.agendaMesAtual}&ano=${window.agendaAnoAtual}`);
        const res = await response.json();
        hideLoading();

        if (res.status === 'success' || res.status === 'warning') {
            eventosData = res.data || [];
            renderCalendario();
            renderEventosLista();
        } else {
            showToast('Erro ao carregar eventos: ' + res.message, 'danger');
        }
    } catch (error) {
        hideLoading();
        console.error("Erro ao buscar eventos:", error);
        showToast('Erro de conexão ao buscar eventos da agenda.', 'danger');
    }
}

/**
 * Alinha a altura do painel de eventos
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
 * Renderiza o calendário
 */
function renderCalendario() {
    const meses = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
    const mes = window.agendaMesAtual;
    const ano = window.agendaAnoAtual;

    document.getElementById('agendaMesTitulo').textContent = `${meses[mes]} ${ano}`;

    const grid = document.getElementById('calendarioGrid');
    grid.innerHTML = '';

    const primeiroDia   = new Date(ano, mes, 1).getDay();
    const diasNoMes     = new Date(ano, mes + 1, 0).getDate();
    const diasMesAnt    = new Date(ano, mes, 0).getDate();
    const hoje          = new Date();
    const ehMesAtual    = (hoje.getMonth() === mes && hoje.getFullYear() === ano);

    for (let i = primeiroDia - 1; i >= 0; i--) {
        const dia = diasMesAnt - i;
        grid.appendChild(criarCelula(dia, true, false, []));
    }

    for (let d = 1; d <= diasNoMes; d++) {
        const ehHoje = ehMesAtual && d === hoje.getDate();
        const evtsDia = eventosData.filter(e => e.dia === d);
        grid.appendChild(criarCelula(d, false, ehHoje, evtsDia));
    }

    const totalCelulas = grid.children.length;
    const faltam = (Math.ceil(totalCelulas / 7) * 7) - totalCelulas;
    for (let i = 1; i <= faltam; i++) {
        grid.appendChild(criarCelula(i, true, false, []));
    }

    syncPainelEventosAltura();
}

/**
 * Cria cada célula no grid do calendário
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
            // Se houver eventos, destaca-os na lista lateral
            showToast(`Exibindo ${evts.length} evento(s) do dia ${dia}.`, 'info');
            renderEventosLista('', dia);
        } else {
            // Novo evento pré-preenchendo a data
            const dateStr = `${window.agendaAnoAtual}-${String(window.agendaMesAtual + 1).padStart(2,'0')}-${String(dia).padStart(2,'0')}`;
            document.getElementById('inputDataEvento').value = dateStr;
            toggleModal('modalEvento', 'show');
        }
    });

    return cell;
}

/**
 * Renderiza a lista lateral de eventos do mês ou de um dia específico
 */
function renderEventosLista(filtroTipo = '', filtroDia = null) {
    const lista = document.getElementById('eventosLista');
    if (!lista) return;

    let filtrados = eventosData;
    if (filtroTipo) {
        filtrados = eventosData.filter(e => e.tipo === filtroTipo);
    }
    if (filtroDia) {
        filtrados = filtrados.filter(e => e.dia === filtroDia);
    }

    if (filtrados.length === 0) {
        lista.innerHTML = '<p class="eventos-lista-vazio">Nenhum evento encontrado.</p>';
        syncPainelEventosAltura();
        return;
    }

    lista.innerHTML = filtrados.map(ev => {
        const horaExibir = ev.hora && ev.hora !== '—' && ev.hora !== '00:00' ? ev.hora : 'Dia Todo';
        return `
            <div class="evento-item d-flex align-items-center justify-content-between p-2 mb-2 rounded" style="background: rgba(0, 0, 0, 0.02);" role="listitem">
                <div class="d-flex align-items-center gap-2">
                    <div class="evento-dot ${ev.tipo}"></div>
                    <div class="evento-info">
                        <div class="evento-titulo fw-bold" style="font-size:0.85rem; color:var(--cor-texto-principal);">${escapeHtml(ev.titulo)}</div>
                        <div class="evento-detalhe" style="font-size:0.72rem; color:var(--cor-texto-secundario);">Dia ${ev.dia} · ${ev.tipo.charAt(0).toUpperCase() + ev.tipo.slice(1)}</div>
                    </div>
                </div>
                <div class="d-flex align-items-center gap-2">
                    <span class="evento-hora badge bg-light text-dark text-xs p-1" style="font-size:0.7rem;">${escapeHtml(horaExibir)}</span>
                    <button class="btn btn-sm btn-outline-primary border-0 p-1" style="line-height:1;" onclick="editarEvento(${ev.id})" title="Editar"><i class="bi bi-pencil" style="font-size:0.75rem;"></i></button>
                    <button class="btn btn-sm btn-outline-danger border-0 p-1" style="line-height:1;" onclick="excluirEvento(${ev.id})" title="Excluir"><i class="bi bi-trash" style="font-size:0.75rem;"></i></button>
                </div>
            </div>
        `;
    }).join('');

    syncPainelEventosAltura();
}

/**
 * Preenche o modal com as informações do evento para edição
 */
function editarEvento(id) {
    const ev = eventosData.find(e => parseInt(e.id) === parseInt(id));
    if (!ev) return;

    document.getElementById('inputIdEvento').value = ev.id;
    document.getElementById('inputTituloEvento').value = ev.titulo || '';
    document.getElementById('inputDataEvento').value = ev.data || '';
    document.getElementById('inputHoraEvento').value = ev.hora !== '—' && ev.hora !== '00:00' ? ev.hora : '';
    document.getElementById('selectTipoEvento').value = ev.tipo || '';
    document.getElementById('inputDescEvento').value = ev.descricao || '';

    document.getElementById('modalEventoTitle').innerHTML =
        '<i class="bi bi-pencil-fill me-2"></i>Editar Evento';

    toggleModal('modalEvento', 'show');
}

/**
 * Exclui o evento chamando a API delete_evento.php
 */
async function excluirEvento(id) {
    if (!confirm('Deseja realmente cancelar/excluir este evento? Esta ação não pode ser desfeita.')) return;

    showLoading();
    try {
        const formData = new FormData();
        formData.append('id', id);

        const response = await fetch('../../Back-End/api/delete_evento.php', {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        hideLoading();

        if (data.status === 'success' || data.status === 'warning') {
            showToast(data.message, data.status === 'warning' ? 'warning' : 'success');
            carregarEventos();
        } else {
            showToast('Erro ao excluir evento: ' + data.message, 'danger');
        }
    } catch (error) {
        hideLoading();
        console.error("Erro ao cancelar evento:", error);
        showToast('Erro de conexão ao cancelar evento.', 'danger');
    }
}

function escapeHtml(text) {
    if (!text) return '';
    return text.toString()
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
