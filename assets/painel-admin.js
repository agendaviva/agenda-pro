import { supabase } from './supabase.js'

const usersList = document.getElementById('usersList')
const searchInput = document.getElementById('searchInput')
const reloadBtn = document.getElementById('reloadBtn')
const adminMessage = document.getElementById('adminMessage')

let allProfiles = []
let allProjects = []
let currentUser = null

function setMessage(text, type = 'default') {
  if (!adminMessage) return

  adminMessage.textContent = text
  adminMessage.className = 'text-sm mt-4'

  if (type === 'success') {
    adminMessage.classList.add('text-green-600')
  } else if (type === 'error') {
    adminMessage.classList.add('text-red-600')
  } else {
    adminMessage.classList.add('text-gray-500')
  }
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    window.location.href = 'login.html'
    return null
  }

  return data.user
}

function getFilteredProfiles() {
  const term = (searchInput?.value || '').trim().toLowerCase()

  if (!term) return allProfiles

  return allProfiles.filter(profile => {
    const nome = (profile.nome || '').toLowerCase()
    const email = (profile.email || '').toLowerCase()
    return nome.includes(term) || email.includes(term)
  })
}

function getProjectsByOwner(userId) {
  return allProjects.filter(project => project.owner_user_id === userId)
}

function renderUsers() {
  const profiles = getFilteredProfiles()

  if (!profiles.length) {
    usersList.innerHTML = `<div class="text-sm text-gray-400">Nenhum usuário encontrado.</div>`
    return
  }

  usersList.innerHTML = profiles.map(profile => {
    const nome = profile.nome || 'Usuário'
    const email = profile.email || 'Sem e-mail'
    const coins = Number(profile.coins || 0)
    const userProjects = getProjectsByOwner(profile.id)

    return `
      <div class="border border-green-100 rounded-3xl p-5 bg-white">
        <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div class="min-w-0">
            <div class="flex items-center gap-3 mb-3">
              <div class="w-11 h-11 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
                ${String(nome).trim().charAt(0).toUpperCase() || 'U'}
              </div>

              <div class="min-w-0">
                <p class="font-semibold text-gray-900 truncate">${nome}</p>
                <p class="text-sm text-gray-500 truncate">${email}</p>
              </div>
            </div>

            <div class="flex items-center gap-2 mb-4">
              <span class="bg-amber-50 border border-amber-200 text-amber-700 px-3 py-1 rounded-2xl text-sm font-semibold">
                🪙 ${coins} moedas
              </span>
            </div>

            <div>
              <p class="text-sm font-medium text-gray-700 mb-2">Agendas</p>
              ${
                userProjects.length
                  ? `<div class="flex flex-wrap gap-2">
                      ${userProjects.map(project => `
                        <span class="bg-green-50 border border-green-100 text-green-700 px-3 py-1 rounded-2xl text-sm">
                          ${project.name}
                        </span>
                      `).join('')}
                    </div>`
                  : `<p class="text-sm text-gray-400">Nenhuma agenda criada.</p>`
              }
            </div>
          </div>

          <div class="w-full lg:w-80">
            <div class="grid grid-cols-1 gap-3">
              <input
                type="number"
                min="1"
                value="1"
                data-coin-input="${profile.id}"
                class="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-green-500 outline-none"
              />

              <div class="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  data-add-coins="${profile.id}"
                  class="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-xl font-semibold transition"
                >
                  + Adicionar
                </button>

                <button
                  type="button"
                  data-remove-coins="${profile.id}"
                  class="bg-red-50 hover:bg-red-100 text-red-600 px-4 py-3 rounded-xl font-semibold transition"
                >
                  - Remover
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
  }).join('')

  bindActions()
}

function bindActions() {
  document.querySelectorAll('[data-add-coins]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.addCoins
      await changeCoins(userId, 'add')
    })
  })

  document.querySelectorAll('[data-remove-coins]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const userId = btn.dataset.removeCoins
      await changeCoins(userId, 'remove')
    })
  })
}

async function loadProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nome, email, coins')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    setMessage('Erro ao carregar usuários.', 'error')
    usersList.innerHTML = `<div class="text-sm text-gray-400">Erro ao carregar usuários.</div>`
    return
  }

  allProfiles = data || []
}

async function loadProjects() {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, owner_user_id, expires_at, is_active')
    .order('created_at', { ascending: false })

  if (error) {
    console.error(error)
    setMessage('Erro ao carregar agendas.', 'error')
    return
  }

  allProjects = data || []
}

async function changeCoins(userId, mode) {
  const input = document.querySelector(`[data-coin-input="${userId}"]`)
  const amount = Number(input?.value || 0)

  if (!amount || amount < 1) {
    setMessage('Digite uma quantidade válida de moedas.', 'error')
    return
  }

  const profile = allProfiles.find(item => item.id === userId)
  if (!profile) {
    setMessage('Usuário não encontrado.', 'error')
    return
  }

  const currentCoins = Number(profile.coins || 0)
  let nextCoins = currentCoins

  if (mode === 'add') {
    nextCoins = currentCoins + amount
  }

  if (mode === 'remove') {
    nextCoins = currentCoins - amount
    if (nextCoins < 0) nextCoins = 0
  }

  const { error } = await supabase
    .from('profiles')
    .update({ coins: nextCoins })
    .eq('id', userId)

  if (error) {
    console.error(error)
    setMessage('Erro ao atualizar moedas.', 'error')
    return
  }

  profile.coins = nextCoins
  renderUsers()

  setMessage(
    mode === 'add'
      ? 'Moedas adicionadas com sucesso.'
      : 'Moedas removidas com sucesso.',
    'success'
  )
}

async function initPage() {
  currentUser = await getUser()
  if (!currentUser) return

  setMessage('Carregando dados...')

  await loadProfiles()
  await loadProjects()
  renderUsers()

  setMessage('Painel atualizado.')
}

window.addEventListener('DOMContentLoaded', () => {
  initPage()

  searchInput?.addEventListener('input', renderUsers)

  reloadBtn?.addEventListener('click', () => {
    initPage()
  })
})
