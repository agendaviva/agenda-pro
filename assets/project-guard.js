import { supabase } from './supabase.js'

function getActiveProjectId() {
  return localStorage.getItem('activeProjectId')
}

function go(url) {
  if (window.location.pathname.endsWith(url)) return
  window.location.href = url
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error || !data?.user) {
    go('login.html')
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

  if (error) {
    console.error('Erro ao verificar membro do projeto:', error)
    return false
  }

  return !!data
}

async function getProject(projectId) {
  const { data, error } = await supabase
    .from('projects')
    .select('id, plan_expires_at')
    .eq('id', projectId)
    .maybeSingle()

  if (error) {
    console.error('Erro ao buscar projeto:', error)
    return null
  }

  return data
}

function isPlanActive(planExpiresAt) {
  if (!planExpiresAt) return false
  return new Date(planExpiresAt).getTime() > Date.now()
}

export async function guardProjectPage() {
  const projectId = getActiveProjectId()

  if (!projectId) {
    go('dashboard.html')
    return {
      ok: false,
      reason: 'no-project'
    }
  }

  const user = await getUser()
  if (!user) {
    return {
      ok: false,
      reason: 'no-user'
    }
  }

  const member = await isMember(projectId, user.id)

  if (!member) {
    localStorage.removeItem('activeProjectId')
    go('dashboard.html')
    return {
      ok: false,
      reason: 'not-member'
    }
  }

  const project = await getProject(projectId)

  if (!project) {
    localStorage.removeItem('activeProjectId')
    go('dashboard.html')
    return {
      ok: false,
      reason: 'project-not-found'
    }
  }

  const active = isPlanActive(project.plan_expires_at)

  if (!active) {
    go('plano-expirado.html')
    return {
      ok: false,
      reason: 'expired'
    }
  }

  return {
    ok: true,
    project
  }
}

window.guardProjectPage = guardProjectPage

const currentPage = window.location.pathname.split('/').pop()

if (currentPage !== 'plano-expirado.html' && currentPage !== 'login.html') {
  guardProjectPage()
}
