import { supabase } from './supabase.js'

function formatCurrency(value) {
  if (!value) return 'R$ 0'

  return Number(value).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  })
}

async function getUser() {
  const { data } = await supabase.auth.getUser()
  return data.user
}

async function getRole(userId, projectId) {
  const { data } = await supabase
    .from('project_members')
    .select('role')
    .eq('user_id', userId)
    .eq('project_id', projectId)
    .single()

  return data?.role
}

async function loadFinance() {
  const user = await getUser()
  const projectId = localStorage.getItem('activeProjectId')

  if (!user || !projectId) return

  const role = await getRole(user.id, projectId)

  if (role === 'viewer') {
    alert('Você não tem acesso ao financeiro')
    window.location.href = 'dashboard.html'
    return
  }

  const { data: shows } = await supabase
    .from('shows')
    .select('*')
    .eq('project_id', projectId)

  let totalConfirmado = 0
  let totalReserva = 0

  const list = document.getElementById('financeList')
  list.innerHTML = ''

  shows.forEach(show => {
    const valor = Number(show.valor) || 0

    if (show.status === 'confirmado') {
      totalConfirmado += valor
    } else {
      totalReserva += valor
    }

    const div = document.createElement('div')

    div.className = 'border rounded-xl p-3 flex justify-between items-center'

    div.innerHTML = `
      <div>
        <p class="font-semibold">${show.titulo || 'Sem título'}</p>
        <p class="text-sm text-gray-500">
          ${show.cidade || ''}/${show.estado || ''}
        </p>
      </div>

      <div class="text-right">
        <p class="font-bold">${formatCurrency(valor)}</p>
        <p class="text-xs ${
          show.status === 'confirmado'
            ? 'text-green-600'
            : 'text-amber-600'
        }">
          ${show.status}
        </p>
      </div>
    `

    list.appendChild(div)
  })

  document.getElementById('totalConfirmado').innerText = formatCurrency(totalConfirmado)
  document.getElementById('totalReserva').innerText = formatCurrency(totalReserva)
  document.getElementById('totalGeral').innerText = formatCurrency(totalConfirmado + totalReserva)
  document.getElementById('totalShows').innerText = shows.length
}

loadFinance()
