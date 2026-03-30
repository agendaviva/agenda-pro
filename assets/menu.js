const currentPage = window.location.pathname.split('/').pop()

function activeClass(page) {
  return currentPage === page
    ? 'bg-green-600 text-white'
    : 'text-gray-700 hover:bg-green-50'
}

window.toggleMenu = function () {
  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('overlay')

  if (!sidebar || !overlay) return

  sidebar.classList.toggle('-translate-x-full')
  overlay.classList.toggle('hidden')
}

function getPlanStatus(planExpiresAt) {
  if (!planExpiresAt) {
    return {
      text: 'Plano expirado',
      badgeClass: 'bg-red-50 border border-red-200 text-red-700'
    }
  }

  const now = new Date()
  const expires = new Date(planExpiresAt)
  const diffMs = expires.getTime() - now.getTime()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))

  if (diffDays <= 0) {
    return {
      text: 'Plano expirado',
      badgeClass: 'bg-red-50 border border-red-200 text-red-700'
    }
  }

  if (diffDays === 1) {
    return {
      text: '1 dia restante',
      badgeClass: 'bg-amber-50 border border-amber-200 text-amber-700'
    }
  }

  if (diffDays <= 5) {
    return {
      text: `${diffDays} dias restantes`,
      badgeClass: 'bg-amber-50 border border-amber-200 text-amber-700'
    }
  }

  return {
    text: `${diffDays} dias restantes`,
    badgeClass: 'bg-green-50 border border-green-200 text-green-700'
  }
}

window.addEventListener('DOMContentLoaded', async () => {
  const container = document.getElementById('menu-container')
  if (!container) return

  const supabase = window.supabase

  let user = null
  let profile = null
  let projects = []
  let activeProjectId = localStorage.getItem('activeProjectId')
  let activeProjectName = 'Selecionar agenda'
  let activeProjectPlanExpiresAt = null

  if (supabase) {
    const { data: userData } = await supabase.auth.getUser()
    user = userData?.user || null

    if (user) {
      const fallbackName = user.user_metadata?.nome || ''
      const fallbackEmail = user.email || ''

      const { data: profileData } = await supabase
        .from('profiles')
        .select('id, nome, email, coins, is_admin')
        .eq('id', user.id)
        .maybeSingle()

      profile = profileData || {
        nome: fallbackName,
        email: fallbackEmail,
        coins: 0,
        is_admin: false
      }

      const { data: memberRows } = await supabase
        .from('project_members')
        .select(`
          project_id,
          role,
          projects:project_id (
            id,
            name,
            plan_expires_at
          )
        `)
        .eq('user_id', user.id)

      if (memberRows && memberRows.length) {
        projects = memberRows.map(row => ({
          project_id: row.project_id,
          role: row.role,
          name: row.projects?.name || 'Projeto',
          plan_expires_at: row.projects?.plan_expires_at || null
        }))

        if (!activeProjectId && projects.length) {
          activeProjectId = projects[0].project_id
          localStorage.setItem('activeProjectId', activeProjectId)
        }

        const active = projects.find(p => p.project_id === activeProjectId)
        if (active) {
          activeProjectName = active.name
          activeProjectPlanExpiresAt = active.plan_expires_at
        }
      }
    }
  }

  const displayName =
    profile?.nome ||
    user?.user_metadata?.nome ||
    user?.email ||
    'Usuário'

  const displayEmail =
    profile?.email ||
    user?.email ||
    ''

  const initial = String(displayName).trim().charAt(0).toUpperCase() || 'U'
  const coins = Number(profile?.coins ?? 0)
  const isAdmin = profile?.is_admin === true
  const planStatus = getPlanStatus(activeProjectPlanExpiresAt)

  container.innerHTML = `
    <div id="overlay" class="fixed inset-0 bg-black/40 hidden z-40 md:hidden"></div>

    <aside id="sidebar" class="fixed z-50 top-0 left-0 h-full w-72 bg-white border-r border-green-100 p-6 transform -translate-x-full md:translate-x-0 transition-transform duration-300 shadow-lg flex flex-col">

      <div>
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-green-700">Agenda Lux</h1>
          <p class="text-sm text-gray-500 mt-1">Painel do empresário</p>
        </div>

        <div class="mb-6 relative">
          <button
            id="projectSwitcherBtn"
            class="w-full flex items-center justify-between px-4 py-3 rounded-2xl border border-green-100 bg-green-50 hover:bg-green-100 transition"
            type="button"
          >
            <div class="text-left min-w-0">
              <p class="text-xs text-gray-500">Agenda atual</p>
              <p class="font-semibold text-gray-900 truncate">${activeProjectName}</p>
              <div class="mt-2 inline-flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-semibold ${planStatus.badgeClass}">
                <span>⏳</span>
                <span>${planStatus.text}</span>
              </div>
            </div>
            <span class="text-green-700 text-lg shrink-0">▾</span>
          </button>

          <div
            id="projectDropdown"
            class="hidden absolute left-0 top-full mt-2 w-full bg-white border border-green-100 rounded-2xl shadow-lg p-2 z-50"
          >
            ${projects.map(p => {
              const itemPlanStatus = getPlanStatus(p.plan_expires_at)

              return `
                <button
                  class="project-option w-full text-left px-4 py-3 rounded-xl ${
                    p.project_id === activeProjectId
                      ? 'bg-green-600 text-white'
                      : 'text-gray-700 hover:bg-green-50'
                  }"
                  data-id="${p.project_id}"
                  type="button"
                >
                  <div class="flex flex-col gap-1">
                    <span class="font-medium">${p.name}</span>
                    <span class="text-xs ${
                      p.project_id === activeProjectId
                        ? 'text-white/90'
                        : itemPlanStatus.badgeClass.includes('red')
                          ? 'text-red-600'
                          : itemPlanStatus.badgeClass.includes('amber')
                            ? 'text-amber-600'
                            : 'text-green-600'
                    }">
                      ${itemPlanStatus.text}
                    </span>
                  </div>
                </button>
              `
            }).join('')}

            <button
              id="createProjectBtn"
              class="w-full text-left px-4 py-3 rounded-xl text-green-700 hover:bg-green-50 font-medium"
              type="button"
            >
              + Criar nova agenda
            </button>
          </div>
        </div>

        <nav class="space-y-3">
          <a href="dashboard.html" class="${activeClass('dashboard.html')} block px-4 py-3 rounded-2xl font-semibold">
            Dashboard
          </a>

          <a href="calendario.html" class="${activeClass('calendario.html')} block px-4 py-3 rounded-2xl font-semibold">
            Calendário
          </a>

          <a href="financeiro.html" class="${activeClass('financeiro.html')} block px-4 py-3 rounded-2xl font-semibold">
            Financeiro
          </a>

          <a href="equipe.html" class="${activeClass('equipe.html')} block px-4 py-3 rounded-2xl font-semibold">
            Equipe
          </a>

          <a href="configuracoes.html" class="${activeClass('configuracoes.html')} block px-4 py-3 rounded-2xl font-semibold">
            Configurações
          </a>

          <button
            id="supportBtn"
            type="button"
            class="${activeClass('suporte.html')} block w-full text-left px-4 py-3 rounded-2xl font-semibold"
          >
            Suporte
          </button>

          ${isAdmin ? `
            <button
              id="adminPanelBtn"
              type="button"
              class="${activeClass('painel-admin.html')} block w-full text-left px-4 py-3 rounded-2xl font-semibold"
            >
              Painel ADM
            </button>
          ` : ''}
        </nav>
      </div>

      <div class="mt-auto pt-6 border-t border-green-100">
        <div class="flex items-center justify-between gap-3 mb-4 px-1">
          <div class="flex items-center gap-3 min-w-0">
            <div class="w-11 h-11 rounded-full bg-green-600 text-white flex items-center justify-center font-bold text-lg shrink-0">
              ${initial}
            </div>

            <div class="min-w-0">
              <p class="font-semibold text-gray-900 truncate">${displayName}</p>
              <p class="text-xs text-gray-500 truncate">${displayEmail}</p>
            </div>
          </div>

          <div class="shrink-0">
            <div class="flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-700 px-3 py-2 rounded-2xl font-semibold text-sm">
              <span>🪙</span>
              <span>${coins}</span>
            </div>
          </div>
        </div>

        <button id="logoutBtn" class="w-full text-left px-4 py-3 rounded-2xl text-red-600 hover:bg-red-50" type="button">
          Sair
        </button>
      </div>
    </aside>
  `

  const sidebar = document.getElementById('sidebar')
  const overlay = document.getElementById('overlay')
  const projectDropdown = document.getElementById('projectDropdown')
  const projectSwitcherBtn = document.getElementById('projectSwitcherBtn')

  overlay?.addEventListener('click', () => {
    sidebar.classList.add('-translate-x-full')
    overlay.classList.add('hidden')
  })

  projectSwitcherBtn?.addEventListener('click', () => {
    projectDropdown.classList.toggle('hidden')
  })

  document.querySelectorAll('.project-option').forEach(btn => {
    btn.addEventListener('click', () => {
      localStorage.setItem('activeProjectId', btn.dataset.id)
      window.location.reload()
    })
  })

  document.getElementById('createProjectBtn')?.addEventListener('click', () => {
    window.location.href = 'novo-projeto.html'
  })

  document.getElementById('supportBtn')?.addEventListener('click', () => {
    window.location.href = 'suporte.html'
  })

  document.getElementById('adminPanelBtn')?.addEventListener('click', () => {
    window.location.href = 'painel-admin.html'
  })

  document.getElementById('logoutBtn')?.addEventListener('click', async () => {
    if (window.supabase) {
      await window.supabase.auth.signOut()
    }
    localStorage.removeItem('activeProjectId')
    window.location.href = 'login.html'
  })
})
