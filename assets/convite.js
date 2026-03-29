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
  const { data } = await supabase.auth.getUser()
  return data.user || null
}

async function loadInvite() {
  const token = getTokenFromUrl()

  if (!token) {
    setStatus('Convite inválido.', 'error')
    return
  }

  const { data: invite, error } = await supabase
    .from('project_invitations')
    .select('*')
    .eq('token', token)
    .single()

  if (error || !invite) {
    setStatus('Convite não encontrado.', 'error')
    return
  }

  if (invite.status !== 'pending') {
    setStatus('Este convite já foi utilizado ou não está mais disponível.', 'error')
    return
  }

  currentInvite = invite

  inviteInfo.classList.remove('hidden')
  acceptInviteBtn.classList.remove('hidden')
  goLoginBtn.classList.remove('hidden')

  inviteEmailInput.value = invite.email || ''
  inviteRoleInput.value = formatRole(invite.role)

  setStatus('Convite carregado com sucesso.')
}

async function acceptInvite() {
  if (!currentInvite) return

  const user = await getUser()

  if (!user) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`
    return
  }

  const userEmail = (user.email || '').toLowerCase()
  const inviteEmail = (currentInvite.email || '').toLowerCase()

  if (userEmail !== inviteEmail) {
    setStatus('Entre com o mesmo e-mail que recebeu o convite.', 'error')
    return
  }

  acceptInviteBtn.disabled = true
  acceptInviteBtn.textContent = 'Entrando...'

  const { error: memberError } = await supabase
    .from('project_members')
    .insert([{
      project_id: currentInvite.project_id,
      user_id: user.id,
      role: currentInvite.role
    }])

  if (memberError) {
    if (memberError.code === '23505') {
      localStorage.setItem('activeProjectId', currentInvite.project_id)
      setStatus('Você já faz parte dessa agenda.', 'success')
      window.location.href = 'dashboard.html'
      return
    }

    console.error(memberError)
    setStatus('Erro ao entrar na equipe.', 'error')
    acceptInviteBtn.disabled = false
    acceptInviteBtn.textContent = 'Aceitar convite'
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

function goToLogin() {
  window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`
}

window.addEventListener('DOMContentLoaded', () => {
  loadInvite()

  acceptInviteBtn.addEventListener('click', acceptInvite)
  goLoginBtn.addEventListener('click', goToLogin)
})
