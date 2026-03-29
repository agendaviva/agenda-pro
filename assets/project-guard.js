import { supabase } from './supabase.js'

function getActiveProjectId() {
  return localStorage.getItem('activeProjectId')
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    window.location.href = 'login.html'
    return null
  }

  return data.user
}

async function isMember(projectId, userId) {
  const { data, error } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', projectId)
    .eq('user_id', userId)
    .maybeSingle()

  if (error) return false
  return !!data
}

async function projectIsActive(projectId) {
  const { data, error } = await supabase
    .rpc('project_is_active', { p_project_id: projectId })

  if (error) return false
  return data === true
}

async function guardProjectPage() {
  const projectId = getActiveProjectId()

  if (!projectId) {
    window.location.href = 'dashboard.html'
    return
  }

  const user = await getUser()
  if (!user) return

  const member = await isMember(projectId, user.id)

  if (!member) {
    localStorage.removeItem('activeProjectId')
    window.location.href = 'dashboard.html'
    return
  }

  const active = await projectIsActive(projectId)

  if (!active) {
    window.location.href = 'plano-expirado.html'
    return
  }
}

window.guardProjectPage = guardProjectPage
guardProjectPage()
