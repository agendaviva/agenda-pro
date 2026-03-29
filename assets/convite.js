import { supabase } from './supabase.js'

const inviteStatus = document.getElementById('inviteStatus')
const inviteInfo = document.getElementById('inviteInfo')
const inviteEmailInput = document.getElementById('inviteEmail')
const inviteRoleInput = document.getElementById('inviteRole')
const acceptInviteBtn = document.getElementById('acceptInviteBtn')
const goLoginBtn = document.getElementById('goLoginBtn')

let currentInvite = null

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('token')
}

function formatRole(role) {
  if (role === 'admin') return 'Administrador'
  if (role === 'editor') return 'Editor'
  if (role === 'viewer') return 'Visualizador'
  return '—'
}

function setStatus(text, type = 'default') {
  if (!inviteStatus) return

  inviteStatus.textContent = text
  inviteStatus.className = 'font-medium'

  if (type === 'success') {
    inviteStatus.classList.add('text-green-700')
  } else if (type === 'error') {
    inviteStatus.classList.add('text-red-600')
  } else {
    inviteStatus.classList.add('text-gray-900')
  }
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser()

  if (error) {
    console.error('Erro ao buscar usuário:', error)
    return null
  }

  return data?.user || null
}

function redirectToLogin() {
  const next = `${window.location.pathname}${window.location.search}`
  window.location.href = `login.html?next=${encodeURIComponent(next)}`
}

async function loadInvite() {
  const token = getTokenFromUrl()

  if (!token) {
    setStatus('Convite inválido.', 'error')
    if (goLoginBtn) {
      goLoginBtn.classList.remove('hidden')
      goLoginBtn.textContent = 'Entrar'
    }
    return
  }

  const user = await getUser()

  if (!user) {
    setStatus('Faça login para visualizar e aceitar este convite.')
    if (goLoginBtn) {
      goLoginBtn.classList.remove('hidden')
      goLoginBtn.textContent = 'Entrar para aceitar convite'
    }
    return
  }

  const { data: invite, error } = await supabase
    .from('project_invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  console.log('INVITE:', invite)
  console.log('INVITE ERROR:', error)

  if (error) {
    setStatus('Erro ao carregar convite.', 'error')
    return
  }

  if (!invite) {
    setStatus('Convite não encontrado.', 'error')
    return
  }

  if (invite.status !== 'pending') {
    setStatus('Este convite já foi utilizado ou não está mais disponível.', 'error')
    return
  }

  currentInvite = invite

  if (inviteInfo) inviteInfo.classList.remove('hidden')
  if (acceptInviteBtn) acceptInviteBtn.classList.remove('hidden')
  if (goLoginBtn) {
    goLoginBtn.classList.remove('hidden')
    goLoginBtn.textContent = 'Entrar com outra conta'
  }

  if (inviteEmailInput) inviteEmailInput.value = invite.email || ''
  if (inviteRoleInput) inviteRoleInput.value = formatRole(invite.role)

  setStatus('Convite carregado com sucesso.', 'success')
}

async function acceptInvite() {
  if (!currentInvite) return

  const user = await getUser()

  if (!user) {
    redirectToLogin()
    return
  }

  const userEmail = (user.email || '').trim().toLowerCase()
  const inviteEmail = (currentInvite.email || '').trim().toLowerCase()

  if (userEmail !== inviteEmail) {
    setStatus('Entre com o mesmo e-mail que recebeu o convite.', 'error')
    return
  }

  if (acceptInviteBtn) {
    acceptInviteBtn.disabled = true
    acceptInviteBtn.textContent = 'Entrando...'
  }

  const { data: existingMember, error: existingError } = await supabase
    .from('project_members')
    .select('id')
    .eq('project_id', currentInvite.project_id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existingError) {
    console.error(existingError)
  }

  if (existingMember) {
    await supabase
      .from('project_invitations')
      .update({ status: 'accepted' })
      .eq('id', currentInvite.id)

    localStorage.setItem('activeProjectId', currentInvite.project_id)
    setStatus('Você já faz parte dessa agenda.', 'success')
    window.location.href = 'dashboard.html'
    return
  }

  const { error: memberError } = await supabase
    .from('project_members')
    .insert([
      {
        project_id: currentInvite.project_id,
        user_id: user.id,
        role: currentInvite.role
      }
    ])

  if (memberError) {
    console.error(memberError)
    setStatus('Erro ao entrar na equipe.', 'error')

    if (acceptInviteBtn) {
      acceptInviteBtn.disabled = false
      acceptInviteBtn.textContent = 'Aceitar convite'
    }
    return
  }

  const { error: updateError } = await supabase
    .from('project_invitations')
    .update({ status: 'accepted' })
    .eq('id', currentInvite.id)

  if (updateError) {
    console.error(updateError)
  }

  localStorage.setItem('activeProjectId', currentInvite.project_id)
  setStatus('Convite aceito com sucesso.', 'success')
  window.location.href = 'dashboard.html'
}

function handleLoginButton() {
  redirectToLogin()
}

window.addEventListener('DOMContentLoaded', () => {
  loadInvite()

  if (acceptInviteBtn) {
    acceptInviteBtn.addEventListener('click', acceptInvite)
  }

  if (goLoginBtn) {
    goLoginBtn.addEventListener('click', handleLoginButton)
  }
})
