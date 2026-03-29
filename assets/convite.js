import { supabase } from './supabase.js'

console.log('CONVITE JS NOVO CARREGADO')

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
    console.error('GET USER ERROR:', error)
    return null
  }

  return data?.user || null
}

async function loadInvite() {
  const token = getTokenFromUrl()
  console.log('TOKEN URL:', token)

  if (!token) {
    setStatus('Convite inválido.', 'error')
    if (goLoginBtn) goLoginBtn.classList.remove('hidden')
    return
  }

  const user = await getUser()

  if (!user) {
    setStatus('Faça login para visualizar e aceitar este convite.')
    if (goLoginBtn) goLoginBtn.classList.remove('hidden')
    return
  }

  const { data: invite, error } = await supabase
    .from('project_invitations')
    .select('*')
    .eq('token', token)
    .maybeSingle()

  console.log('INVITE:', invite)
  console.log('INVITE ERROR:', error)
  console.log('USER LOGADO:', user)

  if (error) {
    console.error('LOAD INVITE ERROR:', error)
    setStatus('Erro ao carregar convite.', 'error')
    if (goLoginBtn) goLoginBtn.classList.remove('hidden')
    return
  }

  if (!invite) {
    setStatus('Convite não encontrado.', 'error')
    if (goLoginBtn) goLoginBtn.classList.remove('hidden')
    return
  }

  if (invite.status !== 'pending') {
    setStatus('Este convite já foi utilizado ou não está mais disponível.', 'error')
    if (goLoginBtn) goLoginBtn.classList.remove('hidden')
    return
  }

  currentInvite = invite

  if (inviteInfo) inviteInfo.classList.remove('hidden')
  if (acceptInviteBtn) acceptInviteBtn.classList.remove('hidden')
  if (goLoginBtn) goLoginBtn.classList.remove('hidden')

  if (inviteEmailInput) inviteEmailInput.value = invite.email || ''
  if (inviteRoleInput) inviteRoleInput.value = formatRole(invite.role)

  setStatus('Convite carregado com sucesso.')
}

async function acceptInvite() {
  if (!currentInvite) return

  const user = await getUser()

  if (!user) {
    window.location.href = `login.html?next=${encodeURIComponent(window.location.pathname + window.location.search)}`
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

  console.log('EXISTING MEMBER:', existingMember)
  console.log('EXISTING MEMBER ERROR:', existingError)

  if (existingMember) {
    const { error: acceptedUpdateError } = await supabase
      .from('project_invitations')
      .update({ status: 'accepted' })
      .eq('id', currentInvite.id)

    if (acceptedUpdateError) {
      console.error('UPDATE ACCEPTED ERROR:', acceptedUpdateError)
    }

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
    console.error('INSERT MEMBER ERROR:', memberError)
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
    console.error('UPDATE INVITE ERROR:', updateError)
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

  if (acceptInviteBtn) {
    acceptInviteBtn.addEventListener('click', acceptInvite)
  }

  if (goLoginBtn) {
    goLoginBtn.addEventListener('click', goToLogin)
  }
})
