import { supabase } from './supabase.js'

function getActiveProjectId() {
  return localStorage.getItem('activeProjectId')
}

function normalizeDate(dateValue) {
  return String(dateValue || '').split('T')[0]
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function sortShows(shows) {
  return [...shows].sort((a, b) => {
    const dateA = normalizeDate(a.data)
    const dateB = normalizeDate(b.data)

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB)
    }

    const timeA = a.horario || '99:99'
    const timeB = b.horario || '99:99'
    return timeA.localeCompare(timeB)
  })
}

function getStatusMeta(status) {
  if (status === 'confirmado') {
    return {
      label: 'Confirmado',
      wrapperClass: 'border-green-200 bg-green-50',
      badgeClass: 'bg-green-100 text-green-700 border border-green-200',
      dotClass: 'bg-green-500'
    }
  }

  return {
    label: 'Reserva',
    wrapperClass: 'border-amber-200 bg-amber-50',
    badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200',
    dotClass: 'bg-amber-500'
  }
}

function renderEmptyDay(container) {
  container.innerHTML = `
    <div class="rounded-2xl border border-dashed border-gray-200 px-3 py-4 text-sm text-gray-400 text-center bg-gray-50/60">
      Sem eventos
    </div>
  `
}

function createShowCard(show) {
  const statusMeta = getStatusMeta(show.status)
  const horario = show.horario ? escapeHtml(show.horario) : 'Sem horário'
  const titulo = show.titulo ? escapeHtml(show.titulo) : 'Sem título'
  const cidadeEstado = [show.cidade, show.estado].filter(Boolean).map(escapeHtml).join('/')

  return `
    <button
      type="button"
      class="show-card w-full text-left rounded-2xl border p-3 transition hover:shadow-sm ${statusMeta.wrapperClass}"
      data-show-id="${show.id}"
    >
      <div class="flex items-start justify-between gap-3 mb-2">
        <div class="min-w-0">
          <p class="font-semibold text-gray-900 leading-tight truncate">${titulo}</p>
          <p class="text-xs text-gray-600 mt-1">${horario}</p>
        </div>

        <span class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold ${statusMeta.badgeClass}">
          <span class="w-2 h-2 rounded-full ${statusMeta.dotClass}"></span>
          ${statusMeta.label}
        </span>
      </div>

      <div class="space-y-1">
        <p class="text-sm text-gray-700 truncate">
          ${cidadeEstado || 'Cidade não definida'}
        </p>

        <p class="text-xs text-gray-500 truncate">
          ${show.contratante ? `Contratante: ${escapeHtml(show.contratante)}` : 'Sem contratante'}
        </p>

        <p class="text-xs font-medium ${show.status === 'confirmado' ? 'text-green-700' : 'text-amber-700'}">
          ${statusMeta.label}
        </p>
      </div>
    </button>
  `
}

function bindShowCardEvents(shows) {
  document.querySelectorAll('.show-card').forEach(card => {
    card.addEventListener('click', () => {
      const showId = card.dataset.showId
      const show = shows.find(item => String(item.id) === String(showId))
      if (show && window.openCreateShowModal) {
        window.openCreateShowModal(null, show)
      }
    })
  })
}

function renderShowsInCalendar(shows) {
  const dayCards = document.querySelectorAll('[data-date]')

  dayCards.forEach(dayCard => {
    const date = dayCard.getAttribute('data-date')
    const eventsContainer = dayCard.querySelector('.events-container')
    if (!eventsContainer) return

    const dayShows = sortShows(
      shows.filter(show => normalizeDate(show.data) === date)
    )

    if (!dayShows.length) {
      renderEmptyDay(eventsContainer)
      return
    }

    eventsContainer.innerHTML = `
      <div class="space-y-2">
        ${dayShows.map(createShowCard).join('')}
      </div>
    `
  })

  bindShowCardEvents(shows)
}

async function loadShows() {
  const projectId = getActiveProjectId()
  if (!projectId) return

  const { data, error } = await supabase
    .from('shows')
    .select('*')
    .eq('project_id', projectId)

  if (error) {
    console.error('Erro ao carregar shows:', error)

    document.querySelectorAll('.events-container').forEach(container => {
      container.innerHTML = `
        <div class="rounded-2xl border border-red-100 bg-red-50 px-3 py-4 text-sm text-red-600 text-center">
          Erro ao carregar eventos
        </div>
      `
    })

    return
  }

  renderShowsInCalendar(data || [])
}

function addShowToCalendar() {
  loadShows()
}

function updateShowInCalendar() {
  loadShows()
}

function removeShowFromCalendar() {
  loadShows()
}

window.loadShows = loadShows
window.addShowToCalendar = addShowToCalendar
window.updateShowInCalendar = updateShowInCalendar
window.removeShowFromCalendar = removeShowFromCalendar

window.addEventListener('showsChanged', loadShows)
