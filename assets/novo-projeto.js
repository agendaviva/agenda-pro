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

async function createProject(name, userId) {
  const { data: project, error: projectError } = await supabase
    .from('projects')
    .insert([
      {
        name,
        owner_user_id: userId
      }
    ])
    .select()
    .single()

  if (projectError) {
    throw projectError
  }

  const { error: memberError } = await supabase
    .from('project_members')
    .insert([
      {
        project_id: project.id,
        user_id: userId,
        role: 'admin'
      }
    ])

  if (memberError) {
    throw memberError
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
    const project = await createProject(name, user.id)

    localStorage.setItem('activeProjectId', project.id)

    showMessage('Agenda criada com sucesso.', 'success')

    setTimeout(() => {
      window.location.href = 'dashboard.html'
    }, 700)
  } catch (error) {
    console.error(error)
    showMessage('Erro ao criar agenda.', 'error')
    createProjectBtn.disabled = false
    createProjectBtn.textContent = 'Criar agenda'
  }
}

window.addEventListener('DOMContentLoaded', () => {
  if (form) {
    form.addEventListener('submit', handleSubmit)
  }
})
