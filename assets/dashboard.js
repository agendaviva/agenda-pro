import { supabase } from './supabase.js'

// 🔐 USER
async function getUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    window.location.href = 'login.html'
    return null
  }

  return data.user
}

// 📁 PROJETO ATIVO
function getActiveProjectId() {
  return localStorage.getItem('activeProjectId')
}

// 👋 BOAS-VINDAS
async function setWelcomeUser() {
  const { data } = await supabase.auth.getUser()
  if (!data.user) return

  let nome = data.user.user_metadata?.nome || data.user.email || 'Usuário'
  const firstName = nome.trim().split(' ')[0]

  const el = document.getElementById('welcomeUser')
  if (el) {
    el.textContent = `👋 Seja bem vindo, ${firstName}.`
  }
}

// 📅 HELPERS
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

// 📊 SORT
function sortShows(shows) {
  return [...shows].sort((a, b) => {
    const dateA = normalizeDateOnly(a.data)
    const dateB = normalizeDateOnly(b.data)

    if (dateA !== dateB) return dateA.localeCompare(dateB)

    const timeA = a.horario || '99:99'
    const timeB = b.horario || '99:99'
    return timeA.localeCompare(timeB)
  })
}

// 📋 LISTA
function renderUpcomingShows(shows) {
  const list = document.getElementById('upcomingShowsList')
  if (!list) return

  if (!shows.length) {
    list.innerHTML = `<div class="text-gray-400 text-sm">Nenhum próximo show encontrado.</div>`
    return
  }

  list.innerHTML = shows.map((show, index) => `
    <div class="bg-white border border-green-100 rounded-2xl p-4 flex flex-col gap-2 cursor-pointer hover:bg-green-50 transition" data-index="${index}">
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
  `).join('')

  list.querySelectorAll('[data-index]').forEach(el => {
    el.addEventListener('click', () => {
      const index = Number(el.dataset.index)
      window.openCreateShowModal(null, shows[index])
    })
  })
}

// 📊 RESUMO
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
    shows.map(show => `${show.cidade || ''}-${show.estado || ''}`).filter(c => c !== '-')
  )

  document.getElementById('showsThisMonth').textContent = showsThisMonth.length
  document.getElementById('upcomingCount').textContent = upcomingShows.length
  document.getElementById('citiesCount').textContent = uniqueCities.size

  if (upcomingShows.length) {
    const next = upcomingShows[0]

    document.getElementById('nextShowDate').textContent =
      `${formatDateBR(next.data)}${next.horario ? ` • ${next.horario}` : ''}`

    document.getElementById('nextShowCity').textContent =
      `${next.cidade || '—'}${next.estado ? `/${next.estado}` : ''}`

    document.getElementById('nextShowTitle').textContent =
      next.titulo || 'Sem título'
  } else {
    document.getElementById('nextShowDate').textContent = '—'
    document.getElementById('nextShowCity').textContent = '—'
    document.getElementById('nextShowTitle').textContent = '—'
  }

  renderUpcomingShows(upcomingShows.slice(0, 5))
}

// 🚀 LOAD
async function loadDashboard() {
  const user = await getUser()
  if (!user) return

  await setWelcomeUser()

  const activeProjectId = getActiveProjectId()

  if (!activeProjectId) {
    updateSummary([])
    return
  }

  const { data: shows, error } = await supabase
    .from('shows')
    .select('*')
    .eq('project_id', activeProjectId)

  if (error) {
    console.error('Erro ao carregar shows do dashboard:', error)
    updateSummary([])
    return
  }

  updateSummary(shows || [])
}

// 🔁 EVENT
window.addEventListener('showsChanged', loadDashboard)

window.addEventListener('DOMContentLoaded', () => {
  loadDashboard()
})
