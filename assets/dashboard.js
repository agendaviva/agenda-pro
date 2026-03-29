import { supabase } from './supabase.js'

function formatDateBR(dateString) {
  const [year, month, day] = String(dateString).split('T')[0].split('-')
  return `${day}/${month}/${year}`
}

function normalizeDateOnly(dateString) {
  return String(dateString).split('T')[0]
}

function getTodayLocal() {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function sortShows(shows) {
  return [...shows].sort((a, b) => {
    const dateA = normalizeDateOnly(a.data)
    const dateB = normalizeDateOnly(b.data)

    if (dateA !== dateB) {
      return dateA.localeCompare(dateB)
    }

    const timeA = a.horario || '99:99'
    const timeB = b.horario || '99:99'
    return timeA.localeCompare(timeB)
  })
}

function renderUpcomingShows(shows) {
  const list = document.getElementById('upcomingShowsList')

  if (!shows.length) {
    list.innerHTML = `
      <div class="text-gray-400 text-sm">
        Nenhum próximo show encontrado.
      </div>
    `
    return
  }

  list.innerHTML = shows.map(show => `
    <div class="bg-white border border-green-100 rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
      <div>
        <p class="font-semibold text-lg text-gray-900">
          ${formatDateBR(show.data)}${show.horario ? ` • ${show.horario}` : ''}
        </p>
        <p class="text-gray-700">
          ${show.cidade || 'Cidade não definida'}${show.estado ? `/${show.estado}` : ''}
        </p>
        <p class="text-gray-500 text-sm">
          ${show.titulo || 'Sem título'}
        </p>
      </div>

      <button
        onclick="openCreateShowModal(null, ${encodeURIComponent(JSON.stringify(show)).replace(/'/g, '%27')})"
        class="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-2 rounded-xl text-sm font-medium transition"
      >
        Editar
      </button>
    </div>
  `).join('')

  // Corrige o onclick para objeto real
  list.querySelectorAll('button').forEach((button, index) => {
    button.onclick = () => window.openCreateShowModal(null, shows[index])
  })
}

function updateSummary(shows) {
  const today = getTodayLocal()
  const now = new Date()
  const currentMonth = now.getMonth() + 1
  const currentYear = now.getFullYear()

  const sortedShows = sortShows(shows)

  const upcomingShows = sortedShows.filter(show => normalizeDateOnly(show.data) >= today)

  const showsThisMonth = shows.filter(show => {
    const [year, month] = normalizeDateOnly(show.data).split('-').map(Number)
    return year === currentYear && month === currentMonth
  })

  const uniqueCities = new Set(
    shows
      .map(show => `${show.cidade || ''}-${show.estado || ''}`)
      .filter(city => city !== '-')
  )

  document.getElementById('showsThisMonth').textContent = showsThisMonth.length
  document.getElementById('upcomingCount').textContent = upcomingShows.length
  document.getElementById('citiesCount').textContent = uniqueCities.size

  if (upcomingShows.length) {
    const nextShow = upcomingShows[0]

    document.getElementById('nextShowDate').textContent =
      `${formatDateBR(nextShow.data)}${nextShow.horario ? ` • ${nextShow.horario}` : ''}`

    document.getElementById('nextShowCity').textContent =
      `${nextShow.cidade || '—'}${nextShow.estado ? `/${nextShow.estado}` : ''}`

    document.getElementById('nextShowTitle').textContent =
      nextShow.titulo || 'Sem título'
  } else {
    document.getElementById('nextShowDate').textContent = '—'
    document.getElementById('nextShowCity').textContent = '—'
    document.getElementById('nextShowTitle').textContent = '—'
  }

  renderUpcomingShows(upcomingShows.slice(0, 5))
}

async function loadDashboard() {
  const { data: shows, error } = await supabase
    .from('shows')
    .select('*')

  if (error) {
    document.getElementById('upcomingShowsList').innerHTML = `
      <div class="text-red-500 text-sm">Erro ao carregar shows.</div>
    `
    return
  }

  updateSummary(shows || [])
}

loadDashboard()
