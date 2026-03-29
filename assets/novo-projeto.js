import { supabase } from './supabase.js'

const form = document.getElementById('newProjectForm')
const projectNameInput = document.getElementById('projectName')
const projectMessage = document.getElementById('projectMessage')
const createProjectBtn = document.getElementById('createProjectBtn')

function showMessage(text, type = 'default') {
  if (!projectMessage) return

  projectMessage.textContent = text
  projectMessage.className = 'text-sm mt-2'

  if (type === 'success') {
    projectMessage.classList.add('text-green-600')
  } else if (type === 'error') {
    projectMessage.classList.add('text-red-600')
  } else {
    projectMessage.classList.add('text-gray-500')
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

function getErrorMessage(error, fallback = 'Erro ao criar agenda.') {
  if (!error) return fallback
  return error.message || error.details || error.hint || fallback
}

function add30DaysIso() {
  const date = new Date()
  date.setDate(date.getDate() + 30)
  return date.toISOString()
}

async function ensureProfile(user) {
  const email = user.email || ''
  const nome = user.user_metadata?.nome || ''

  const { data: existingProfile, error: selectError } = await supabase
    .from('profiles')
    .select('id, coins')
    .eq('id', user.id)
    .maybeSingle()

  if (selectError) {
    throw new Error(`Erro ao buscar perfil: ${getErrorMessage(selectError)}`)
  }

  if (existingProfile) {
    return existingProfile
  }

  const { data: createdProfile, error: insertError } = await supabase
    .from('profiles')
    .insert([
      {
        id: user.id,
        nome,
        email,
        coins: 0
      }
    ])
    .select('id, coins')
    .single()

  if (insertError) {
    throw new Error(`Erro ao criar perfil: ${getErrorMessage(insertError)}`)
  }

  return createdProfile
}

async function createProject(name, user) {
  const profile = await ensureProfile(user)
  const currentCoins = Number(profile?.coins || 0)

  if (currentCoins < 1) {
    throw new Error('Você não tem moedas suficientes para criar uma nova agenda.')
  }

  const planExpiresAt = add30DaysIso()

  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert([
      {
        name,
        owner_user_id: user.id,
        plan_expires_at: planExpiresAt
      }
    ])
    .select()
    .single()

  if (projectError) {
    throw new Error(`Erro em projects: ${getErrorMessage(projectError)}`)
  }

  const { error: memberError } = await supabase
    .from('project_members')
    .insert([
      {
        project_id: project.id,
        user_id: user.id,
        role: 'admin'
      }
    ])

  if (memberError) {
    await supabase
      .from('projects')
      .delete()
      .eq('id', project.id)

    throw new Error(`Erro em project_members: ${getErrorMessage(memberError)}`)
  }

  const { error: coinUpdateError } = await supabase
    .from('profiles')
    .update({
      coins: currentCoins - 1
    })
    .eq('id', user.id)

  if (coinUpdateError) {
    await supabase.from('project_members').delete().eq('project_id', project.id)
    await supabase.from('projects').delete().eq('id', project.id)

    throw new Error(`Erro ao consumir moeda: ${getErrorMessage(coinUpdateError)}`)
  }

  return project
}

async function handleSubmit(event) {
  event.preventDefault()

  const name = projectNameInput.value.trim()

  if (!name) {
    showMessage('Digite o nome da agenda.', 'error')
    return
  }

  const user = await getUser()
  if (!user) return

  createProjectBtn.disabled = true
  createProjectBtn.textContent = 'Criando...'
  showMessage('Criando agenda...')

  try {
    const project = await createProject(name, user)

    localStorage.setItem('activeProjectId', project.id)

    showMessage('Agenda criada com sucesso.', 'success')

    setTimeout(() => {
      window.location.href = 'dashboard.html'
    }, 700)
  } catch (error) {
    console.error(error)
    showMessage(error.message || 'Erro ao criar agenda.', 'error')
    createProjectBtn.disabled = false
    createProjectBtn.textContent = 'Criar agenda'
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (form) {
    form.addEventListener('submit', handleSubmit)
  }
})
