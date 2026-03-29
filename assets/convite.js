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

function ensureDebugBox() {
  let box = document.getElementById('inviteDebugBox')

  if (!box) {
    box = document.createElement('pre')
    box.id = 'inviteDebugBox'
    box.className = 'mt-4 p-4 rounded-2xl border border-gray-200 bg-gray-50 text-xs text-gray-700 whitespace-pre-wrap break-words'
    inviteStatus?.parentElement?.insertAdjacentElement('afterend', box)
  }

  return box
}

function setDebug(data) {
  const box = ensureDebugBox()
  if (!box) return

  try {
    box.textContent = JSON.stringify(data, null, 2)
  } catch {
    box.textContent = String(data)
  }
}

async function getUser() {
  const { data, error } = await supabase.auth.getUser()

  return {
    user: data?.user || null,
    error: error || null
  }
}

async function loadInvite() {
  const token = getTokenFromUrl()

  const authResult = await getUser()
  const user = authResult.user

  const debugStart = {
    step: 'loadInvite:start',
    url: window.location.href,
    pathname: window.location.pathname,
    search: window.location.search,
    token,
    loggedIn: !!user,
    userEmail: user?.email || null,
    authError: authResult.error ? {
      message: authResult.error.message,
      code: authResult.error.code || null
    } : null
  }

  setDebug(debugStart)

  if (!token) {
    setStatus('Convite inválido.', 'error')
    if (goLoginBtn) goLoginBtn.classList.remove('hidden')
    return
  }

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

  setDebug({
    step: 'loadInvite:queryResult',
    token,
    loggedIn: !!user,
    userEmail: user?.email || null,
    invite,
    error: error ? {
      message: error.message,
      code: error.code || null,
      details: error.details || null,
      hint: error.hint || null
    } : null
  })

  if (error) {
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

  const authResult = await getUser()
  const user = authResult.user

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

  setDebug({
    step: 'acceptInvite:existingMember',
    currentInvite,
    userEmail,
    inviteEmail,
    existingMember,
    existingError: existingError ? {
      message: existingError.message,
      code: existingError.code || null,
      details: existingError.details || null,
      hint: existingError.hint || null
    } : null
  })

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
    setDebug({
      step: 'acceptInvite:insertMemberError',
      currentInvite,
      memberError: {
        message: memberError.message,
        code: memberError.code || null,
        details: memberError.details || null,
        hint: memberError.hint || null
      }
    })

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
    setDebug({
      step: 'acceptInvite:updateInvitationError',
      updateError: {
        message: updateError.message,
        code: updateError.code || null,
        details: updateError.details || null,
        hint: updateError.hint || null
      }
    })
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
