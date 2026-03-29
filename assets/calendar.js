import { supabase } from './supabase.js'

function formatShowTime(horario) {
  return horario && horario.trim() ? horario : 'Horário não definido'
}

function renderShowCard(show) {
  const el = document.createElement('div')

  el.className =
    'bg-white border rounded-xl p-2 mt-2 text-sm flex justify-between items-start cursor-pointer hover:bg-green-50 transition'

  el.dataset.showId = show.id

  el.innerHTML = `
    <div>
      <p class="font-semibold text-gray-900">
        ${formatShowTime(show.horario)} - ${show.cidade || ''}/${show.estado || ''}
      </p>
      <p class="text-xs text-gray-500 mt-1">
        ${show.titulo || ''}
      </p>
    </div>

    <button class="delete-btn text-red-500 hover:text-red-700 text-lg font-bold ml-2">
      🗑️
    </button>
  `

  el.addEventListener('click', () => {
    window.openCreateShowModal(null, show)
  })

  const deleteBtn = el.querySelector('.delete-btn')

  deleteBtn.addEventListener('click', async (e) => {
    e.stopPropagation()

    const confirmar = confirm('Excluir esse show?')
    if (!confirmar) return

    const { error } = await supabase
      .from('shows')
      .delete()
      .eq('id', show.id)

    if (error) {
      alert('Erro ao excluir')
      return
    }

    removeShowFromCalendar(show.id, show.data)
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

async function loadShows() {
  const { data: shows, error } = await supabase
    .from('shows')
    .select('*')

  if (error) {
    alert('Erro ao buscar shows')
    return
  }

  document.querySelectorAll('.events-container').forEach(container => {
    container.innerHTML = '<span class="text-gray-400">Sem eventos</span>'
  })

  const grouped = {}

  shows.forEach(show => {
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
}

window.loadShows = loadShows
window.addShowToCalendar = addShowToCalendar
window.removeShowFromCalendar = removeShowFromCalendar
window.updateShowInCalendar = updateShowInCalendar

loadShows()
