import { supabase } from './supabase.js'

let currentUserRole = null
let currentUser = null

function getActiveProjectId() {
  return localStorage.getItem('activeProjectId')
}

async function getUser() {
  if (currentUser) return currentUser

  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    alert('Você precisa estar logado')
    window.location.href = 'login.html'
    return null
  }

  currentUser = data.user
  return currentUser
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

function renderShowCard(show) {
  const el = document.createElement('div')

  el.className =
    'bg-white border rounded-xl p-2 mt-2 text-sm cursor-pointer hover:bg-green-50 transition'

  el.dataset.showId = show.id

  el.innerHTML = `
    <div>
      <p class="font-semibold text-gray-900">
        ${show.horario ? `${show.horario} • ` : ''}${show.cidade || ''}${show.estado ? `/${show.estado}` : ''}
      </p>
      <p class="text-xs text-gray-500 mt-1">
        ${show.titulo || ''}
      </p>
    </div>
  `

  el.addEventListener('click', (event) => {
    event.stopPropagation()
    if (window.openCreateShowModal) {
      window.openCreateShowModal(null, show)
    }
  })

  return el
}

function ensureEmptyState(container) {
  if (!container.querySelector('[data-show-id]')) {
    container.innerHTML = '<span class="text-gray-400">Sem eventos</span>'
  }
}

function removeEmptyState(container) {
  const text = container.textContent.trim()
  if (text === 'Sem eventos') {
    container.innerHTML = ''
  }
}

function getDayContainerByDate(date) {
  const cleanDate = String(date).split('T')[0]
  const day = document.querySelector(`[data-date="${cleanDate}"]`)
  if (!day) return null
  return day.querySelector('.events-container')
}

function addShowToCalendar(show) {
  const container = getDayContainerByDate(show.data)
  if (!container) return

  removeEmptyState(container)
  container.appendChild(renderShowCard(show))
}

function removeShowFromCalendar(showId, date) {
  const container = getDayContainerByDate(date)
  if (!container) return

  const card = container.querySelector(`[data-show-id="${showId}"]`)
  if (card) card.remove()

  ensureEmptyState(container)
}

function updateShowInCalendar(oldShow, updatedShow) {
  const oldDate = String(oldShow.data).split('T')[0]
  const newDate = String(updatedShow.data).split('T')[0]

  if (oldDate !== newDate) {
    removeShowFromCalendar(oldShow.id, oldDate)
    addShowToCalendar(updatedShow)
    return
  }

  const container = getDayContainerByDate(oldDate)
  if (!container) return

  const oldCard = container.querySelector(`[data-show-id="${oldShow.id}"]`)
  if (oldCard) oldCard.replaceWith(renderShowCard(updatedShow))
}

function lockCreateButtonsForViewer() {
  const createButtons = document.querySelectorAll(
    '[data-open-create-show], .add-event-btn, .calendar-add-btn, .open-create-show-btn'
  )

  createButtons.forEach(btn => {
    if (!canManageAgenda()) {
      btn.style.display = 'none'
    }
  })
}

function bindDayClicks() {
  const dayElements = document.querySelectorAll('[data-date]')

  dayElements.forEach(day => {
    day.onclick = null

    day.addEventListener('click', async (event) => {
      const clickedShow = event.target.closest('[data-show-id]')
      if (clickedShow) return

      const clickedButton = event.target.closest('button')
      if (clickedButton) return

      const date = day.dataset.date
      if (!date) return

      if (!canManageAgenda()) {
        return
      }

      if (window.openCreateShowModal) {
        window.openCreateShowModal(date)
      }
    })
  })
}

function bindCreateButtons() {
  const createButtons = document.querySelectorAll(
    '[data-open-create-show], .add-event-btn, .calendar-add-btn, .open-create-show-btn'
  )

  createButtons.forEach(btn => {
    btn.onclick = null

    btn.addEventListener('click', async (event) => {
      event.preventDefault()
      event.stopPropagation()

      const date = btn.dataset.date || btn.getAttribute('data-date') || ''

      if (!canManageAgenda()) {
        return
      }

      if (window.openCreateShowModal) {
        window.openCreateShowModal(date)
      }
    })
  })
}

async function loadShows() {
  const user = await getUser()
  if (!user) return

  await loadCurrentUserRole()

  const activeProjectId = getActiveProjectId()

  if (!activeProjectId) {
    document.querySelectorAll('.events-container').forEach(container => {
      container.innerHTML = '<span class="text-gray-400">Sem eventos</span>'
    })
    return
  }

  const { data: shows, error } = await supabase
    .from('shows')
    .select('*')
    .eq('project_id', activeProjectId)

  if (error) {
    alert('Erro ao buscar shows')
    console.error(error)
    return
  }

  document.querySelectorAll('.events-container').forEach(container => {
    container.innerHTML = '<span class="text-gray-400">Sem eventos</span>'
  })

  const grouped = {}

  ;(shows || []).forEach(show => {
    const date = String(show.data).split('T')[0]
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

  lockCreateButtonsForViewer()
  bindDayClicks()
  bindCreateButtons()
}

window.loadShows = loadShows
window.addShowToCalendar = addShowToCalendar
window.removeShowFromCalendar = removeShowFromCalendar
window.updateShowInCalendar = updateShowInCalendar
window.canManageAgenda = canManageAgenda
window.loadCurrentUserRole = loadCurrentUserRole

window.addEventListener('showsChanged', loadShows)
window.addEventListener('DOMContentLoaded', loadShows)
