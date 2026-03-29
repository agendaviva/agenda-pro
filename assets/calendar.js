import { supabase } from './supabase.js'

let currentUserRole = null
let isLoadingShows = false
let initialBootDone = false

function getActiveProjectId() {
  return localStorage.getItem('activeProjectId')
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    window.location.href = 'login.html'
    return null
  }

  return data.user
}

async function loadCurrentUserRole() {
  const user = await getUser()
  if (!user) return null

  const activeProjectId = getActiveProjectId()
  if (!activeProjectId) {
    currentUserRole = null
    return null
  }

  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', activeProjectId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    currentUserRole = null
    return null
  }

  currentUserRole = data.role || null
  return currentUserRole
}

function canManageAgenda() {
  return currentUserRole === 'admin' || currentUserRole === 'editor'
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

    if (dateA !== dateB) return dateA.localeCompare(dateB)

    const timeA = a.horario || '99:99'
    const timeB = b.horario || '99:99'
    return timeA.localeCompare(timeB)
  })
}

function getStatusMeta(status) {
  if (status === 'confirmado') {
    return {
      label: 'Confirmado',
      cardClass: 'border-green-200 bg-green-50',
      badgeClass: 'bg-green-100 text-green-700 border border-green-200',
      dotClass: 'bg-green-500',
      statusTextClass: 'text-green-700'
    }
  }

  return {
    label: 'Reserva',
    cardClass: 'border-amber-200 bg-amber-50',
    badgeClass: 'bg-amber-100 text-amber-700 border border-amber-200',
    dotClass: 'bg-amber-500',
    statusTextClass: 'text-amber-700'
  }
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="rounded-2xl border border-dashed border-gray-200 bg-gray-50/70 px-3 py-4 text-center text-sm text-gray-400">
      Sem eventos
    </div>
  `
}

function renderShowCard(show) {
  const meta = getStatusMeta(show.status)

  const titulo = escapeHtml(show.titulo || 'Sem título')
  const horario = escapeHtml(show.horario || '--:--')
  const cidade = escapeHtml(show.cidade || '')
  const estado = escapeHtml(show.estado || '')
  const contratante = escapeHtml(show.contratante || '')

  const local = cidade
    ? `${cidade}${estado ? `/${estado}` : ''}`
    : 'Local não definido'

  const el = document.createElement('button')
  el.type = 'button'
  el.dataset.showId = show.id
  el.className = `w-full text-left rounded-2xl border p-3 mt-2 transition hover:scale-[1.01] hover:shadow-sm ${meta.cardClass}`

  el.innerHTML = `
    <div class="flex items-start justify-between gap-2 mb-2">
      <div class="min-w-0">
        <p class="font-semibold text-gray-900 truncate">${titulo}</p>
        <p class="text-xs text-gray-600 mt-1">${horario}</p>
      </div>

      <span class="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-[11px] font-semibold ${meta.badgeClass}">
        <span class="w-2 h-2 rounded-full ${meta.dotClass}"></span>
        ${meta.label}
      </span>
    </div>

    <p class="text-sm text-gray-700 truncate">${local}</p>

    <p class="text-xs text-gray-500 mt-1 truncate">
      ${contratante ? `Contratante: ${contratante}` : 'Sem contratante'}
    </p>

    <p class="text-xs font-semibold mt-2 ${meta.statusTextClass}">
      ${meta.label}
    </p>
  `

  el.addEventListener('click', () => {
    if (window.openCreateShowModal) {
      window.openCreateShowModal(null, show)
    }
  })

  return el
}

function getDayContainerByDate(date) {
  const cleanDate = normalizeDate(date)
  const day = document.querySelector(`[data-date="${cleanDate}"]`)
  if (!day) return null
  return day.querySelector('.events-container')
}

function clearCalendarDays() {
  document.querySelectorAll('.events-container').forEach(container => {
    container.innerHTML = ''
    renderEmptyState(container)
  })
}

function calendarIsReady() {
  return document.querySelectorAll('[data-date]').length > 0
}

async function loadShows() {
  if (isLoadingShows) return
  isLoadingShows = true

  try {
    const user = await getUser()
    if (!user) return

    await loadCurrentUserRole()

    const activeProjectId = getActiveProjectId()

    if (!activeProjectId) {
      clearCalendarDays()
      return
    }

    if (!calendarIsReady()) {
      return
    }

    const { data: shows, error } = await supabase
      .from('shows')
      .select('*')
      .eq('project_id', activeProjectId)

    if (error) {
      console.error('Erro ao buscar shows:', error)
      clearCalendarDays()
      return
    }

    clearCalendarDays()

    const grouped = {}

    sortShows(shows || []).forEach(show => {
      const date = normalizeDate(show.data)
      if (!grouped[date]) grouped[date] = []
      grouped[date].push(show)
    })

    Object.keys(grouped).forEach(date => {
      const container = getDayContainerByDate(date)
      if (!container) return

      container.innerHTML = ''

      grouped[date].forEach(show => {
        container.appendChild(renderShowCard(show))
      })
    })
  } finally {
    isLoadingShows = false
  }
}

function bootInitialLoad() {
  if (initialBootDone) return
  initialBootDone = true

  let attempts = 0
  const maxAttempts = 20

  const interval = setInterval(async () => {
    attempts++

    if (calendarIsReady()) {
      await loadShows()
      clearInterval(interval)
      return
    }

    if (attempts >= maxAttempts) {
      clearInterval(interval)
    }
  }, 200)
}

function addShowToCalendar() {
  loadShows()
}

function removeShowFromCalendar() {
  loadShows()
}

function updateShowInCalendar() {
  loadShows()
}

document.addEventListener('calendar:rendered', () => {
  loadShows()
})

window.addEventListener('showsChanged', () => {
  loadShows()
})

window.addEventListener('storage', e => {
  if (e.key === 'activeProjectId') {
    loadShows()
  }
})

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    bootInitialLoad()
  })
} else {
  bootInitialLoad()
}

setTimeout(() => {
  loadShows()
}, 300)

setTimeout(() => {
  loadShows()
}, 800)

window.loadShows = loadShows
window.addShowToCalendar = addShowToCalendar
window.removeShowFromCalendar = removeShowFromCalendar
window.updateShowInCalendar = updateShowInCalendar
window.canManageAgenda = canManageAgenda
window.loadCurrentUserRole = loadCurrentUserRole
