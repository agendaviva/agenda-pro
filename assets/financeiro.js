import { supabase } from './supabase.js'

function formatCurrency(value) {
  const number = Number(value) || 0

  return number.toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

function normalizeDate(dateValue) {
  return String(dateValue || '').split('T')[0]
}

function getMonthValue(dateValue) {
  const normalized = normalizeDate(dateValue)
  if (!normalized) return ''
  return normalized.slice(0, 7)
}

function escapeHtml(value) {
  return String(value || '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function parseLocalDate(dateValue) {
  const normalized = normalizeDate(dateValue)
  if (!normalized) return null

  const [year, month, day] = normalized.split('-').map(Number)
  if (!year || !month || !day) return null

  return new Date(year, month - 1, day)
}

function stripTime(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function isBetweenInclusive(targetDate, startDate, endDate) {
  if (!targetDate) return false
  return targetDate.getTime() >= startDate.getTime() && targetDate.getTime() <= endDate.getTime()
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    window.location.href = 'login.html'
    return null
  }

  return data.user
}

async function getRole(userId, projectId) {
  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .single()

  if (error || !data) return null

  return data.role || null
}

function renderEmptyState() {
  const list = document.getElementById('financeList')
  if (!list) return

  list.innerHTML = `
    <div class="rounded-2xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
      Nenhum show encontrado com os filtros atuais.
    </div>
  `
}

function renderList(shows) {
  const list = document.getElementById('financeList')
  if (!list) return

  if (!shows.length) {
    renderEmptyState()
    return
  }

  list.innerHTML = shows.map(show => {
    const valor = Number(show.valor) || 0
    const status = show.status === 'confirmado' ? 'Confirmado' : 'Reserva'
    const statusClass = show.status === 'confirmado'
      ? 'bg-green-100 text-green-700 border border-green-200'
      : 'bg-amber-100 text-amber-700 border border-amber-200'

    const local = show.cidade
      ? `${escapeHtml(show.cidade)}${show.estado ? `/${escapeHtml(show.estado)}` : ''}`
      : 'Cidade não definida'

    return `
      <div class="border rounded-2xl p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div class="min-w-0">
          <div class="flex items-center gap-2 flex-wrap">
            <p class="font-semibold text-gray-900">${escapeHtml(show.titulo || 'Sem título')}</p>
            <span class="inline-flex items-center px-2.5 py-1 rounded-xl text-xs font-semibold ${statusClass}">
              ${status}
            </span>
          </div>

          <p class="text-sm text-gray-500 mt-1">
            ${normalizeDate(show.data) || 'Sem data'}${show.horario ? ` • ${escapeHtml(show.horario)}` : ''}
          </p>

          <p class="text-sm text-gray-600 mt-1">${local}</p>

          <p class="text-xs text-gray-500 mt-1">
            ${show.contratante ? `Contratante: ${escapeHtml(show.contratante)}` : 'Sem contratante'}
          </p>
        </div>

        <div class="text-left md:text-right shrink-0">
          <p class="text-lg font-bold text-gray-900">${formatCurrency(valor)}</p>
        </div>
      </div>
    `
  }).join('')
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

function calculateWindowTotals(shows) {
  const today = stripTime(new Date())

  const past30Start = new Date(today)
  past30Start.setDate(past30Start.getDate() - 30)

  const next30End = new Date(today)
  next30End.setDate(next30End.getDate() + 30)

  let ultimos30Dias = 0
  let proximos30Dias = 0

  shows.forEach(show => {
    const showDate = parseLocalDate(show.data)
    const valor = Number(show.valor) || 0

    if (!showDate) return

    if (isBetweenInclusive(showDate, past30Start, today)) {
      ultimos30Dias += valor
    }

    if (isBetweenInclusive(showDate, today, next30End)) {
      proximos30Dias += valor
    }
  })

  return {
    ultimos30Dias,
    proximos30Dias
  }
}

function updateSummary(filteredShows, allShows) {
  let totalConfirmado = 0
  let totalReserva = 0
  let qtdConfirmados = 0
  let qtdReservas = 0

  filteredShows.forEach(show => {
    const valor = Number(show.valor) || 0

    if (show.status === 'confirmado') {
      totalConfirmado += valor
      qtdConfirmados += 1
    } else {
      totalReserva += valor
      qtdReservas += 1
    }
  })

  const totalGeral = totalConfirmado + totalReserva
  const totalShows = filteredShows.length
  const ticketMedio = totalShows ? totalGeral / totalShows : 0

  const windows = calculateWindowTotals(allShows)

  document.getElementById('totalConfirmado').innerText = formatCurrency(totalConfirmado)
  document.getElementById('totalReserva').innerText = formatCurrency(totalReserva)
  document.getElementById('totalGeral').innerText = formatCurrency(totalGeral)
  document.getElementById('totalShows').innerText = String(totalShows)
  document.getElementById('ticketMedio').innerText = formatCurrency(ticketMedio)
  document.getElementById('qtdConfirmados').innerText = String(qtdConfirmados)
  document.getElementById('qtdReservas').innerText = String(qtdReservas)
  document.getElementById('ultimos30Dias').innerText = formatCurrency(windows.ultimos30Dias)
  document.getElementById('proximos30Dias').innerText = formatCurrency(windows.proximos30Dias)
}

let allShows = []

function applyFilters() {
  const filtroStatus = document.getElementById('filtroStatus')?.value || 'todos'
  const filtroMes = document.getElementById('filtroMes')?.value || ''
  const filtroPeriodo = document.getElementById('filtroPeriodo')?.value || 'todos'

  const today = stripTime(new Date())

  const past30Start = new Date(today)
  past30Start.setDate(past30Start.getDate() - 30)

  const next30End = new Date(today)
  next30End.setDate(next30End.getDate() + 30)

  let filtered = [...allShows]

  if (filtroStatus !== 'todos') {
    filtered = filtered.filter(show => show.status === filtroStatus)
  }

  if (filtroMes) {
    filtered = filtered.filter(show => getMonthValue(show.data) === filtroMes)
  }

  if (filtroPeriodo === 'ultimos30') {
    filtered = filtered.filter(show => {
      const showDate = parseLocalDate(show.data)
      return isBetweenInclusive(showDate, past30Start, today)
    })
  }

  if (filtroPeriodo === 'proximos30') {
    filtered = filtered.filter(show => {
      const showDate = parseLocalDate(show.data)
      return isBetweenInclusive(showDate, today, next30End)
    })
  }

  const sorted = sortShows(filtered)
  updateSummary(sorted, allShows)
  renderList(sorted)
}

async function loadFinance() {
  const user = await getUser()
  const projectId = localStorage.getItem('activeProjectId')

  if (!user || !projectId) {
    renderEmptyState()
    return
  }

  const role = await getRole(user.id, projectId)

  if (role !== 'admin' && role !== 'editor') {
    alert('Você não tem acesso ao financeiro.')
    window.location.href = 'dashboard.html'
    return
  }

  const { data: shows, error } = await supabase
    .from('shows')
    .select('*')
    .eq('project_id', projectId)

  if (error) {
    console.error('Erro ao carregar financeiro:', error)
    renderEmptyState()
    return
  }

  allShows = shows || []
  applyFilters()
}

document.getElementById('filtroStatus')?.addEventListener('change', applyFilters)
document.getElementById('filtroMes')?.addEventListener('change', applyFilters)
document.getElementById('filtroPeriodo')?.addEventListener('change', applyFilters)

document.getElementById('limparFiltrosBtn')?.addEventListener('click', () => {
  const filtroStatus = document.getElementById('filtroStatus')
  const filtroMes = document.getElementById('filtroMes')
  const filtroPeriodo = document.getElementById('filtroPeriodo')

  if (filtroStatus) filtroStatus.value = 'todos'
  if (filtroMes) filtroMes.value = ''
  if (filtroPeriodo) filtroPeriodo.value = 'todos'

  applyFilters()
})

window.addEventListener('showsChanged', loadFinance)

loadFinance()
