import { supabase } from './supabase.js'

let currentUserRole = null

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
  if (!activeProjectId) return null

  const { data } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', activeProjectId)
    .eq('user_id', user.id)
    .single()

  currentUserRole = data?.role || null
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
      card: 'bg-green-50 border-green-200',
      badge: 'bg-green-100 text-green-700 border-green-200',
      dot: 'bg-green-500'
    }
  }

  return {
    label: 'Reserva',
    card: 'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    dot: 'bg-yellow-500'
  }
}

function renderEmptyState(container) {
  container.innerHTML = `
    <div class="text-sm text-gray-400 text-center mt-4">
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

  const local = cidade
    ? `${cidade}${estado ? `/${estado}` : ''}`
    : 'Local não definido'

  const el = document.createElement('div')

  el.className = `
    rounded-2xl border p-3 mt-2 cursor-pointer
    transition hover:scale-[1.02] hover:shadow-sm
    ${meta.card}
  `

  el.innerHTML = `
    <div class="flex justify-between items-start mb-2">
      <div class="min-w-0">
        <p class="font-semibold text-gray-900 truncate">${titulo}</p>
        <p class="text-xs text-gray-600">${horario}</p>
      </div>

      <span class="flex items-center gap-1 px-2 py-1 text-[11px] rounded-xl border ${meta.badge}">
        <span class="w-2 h-2 rounded-full ${meta.dot}"></span>
        ${meta.label}
      </span>
    </div>

    <p class="text-sm text-gray-700 truncate">${local}</p>
  `

  el.onclick = () => {
    if (window.openCreateShowModal) {
      window.openCreateShowModal(null, show)
    }
  }

  return el
}

function getContainer(date) {
  const clean = normalizeDate(date)
  const day = document.querySelector(`[data-date="${clean}"]`)
  return day?.querySelector('.events-container') || null
}

async function loadShows() {
  const user = await getUser()
  if (!user) return

  await loadCurrentUserRole()

  const activeProjectId = getActiveProjectId()

  if (!activeProjectId) {
    document.querySelectorAll('.events-container').forEach(renderEmptyState)
    return
  }

  const { data: shows, error } = await supabase
    .from('shows')
    .select('*')
    .eq('project_id', activeProjectId)

  if (error) {
    console.error(error)
    return
  }

  // limpa tudo
  document.querySelectorAll('.events-container').forEach(container => {
    container.innerHTML = ''
    renderEmptyState(container)
  })

  const grouped = {}

  sortShows(shows || []).forEach(show => {
    const date = normalizeDate(show.data)
    if (!grouped[date]) grouped[date] = []
    grouped[date].push(show)
  })

  Object.keys(grouped).forEach(date => {
    const container = getContainer(date)
    if (!container) return

    container.innerHTML = ''

    grouped[date].forEach(show => {
      container.appendChild(renderShowCard(show))
    })
  })
}

/* ===== EVENTO PRINCIPAL (CORREÇÃO DO BUG) ===== */
document.addEventListener('calendar:rendered', () => {
  loadShows()
})

/* ===== LISTENERS ===== */
window.addEventListener('showsChanged', loadShows)

/* ===== EXPORTS ===== */
window.loadShows = loadShows
window.canManageAgenda = canManageAgenda
window.loadCurrentUserRole = loadCurrentUserRole

window.addShowToCalendar = loadShows
window.removeShowFromCalendar = loadShows
window.updateShowInCalendar = loadShows
