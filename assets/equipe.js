import { supabase } from './supabase.js'

const projectNameEl = document.getElementById('projectName')
const projectSubtitleEl = document.getElementById('projectSubtitle')
const currentUserRoleEl = document.getElementById('currentUserRole')

const inviteForm = document.getElementById('inviteForm')
const inviteEmailInput = document.getElementById('inviteEmail')
const inviteRoleInput = document.getElementById('inviteRole')
const inviteMessageEl = document.getElementById('inviteMessage')

const inviteLinkCard = document.getElementById('inviteLinkCard')
const generatedInviteLinkInput = document.getElementById('generatedInviteLink')
const copyInviteLinkBtn = document.getElementById('copyInviteLinkBtn')

const teamListEl = document.getElementById('teamList')
const pendingInvitesListEl = document.getElementById('pendingInvitesList')

let currentUser = null
let activeProjectId = null
let currentUserRole = null

function setMessage(el, text, type = 'default') {
  if (!el) return

  el.textContent = text
  el.className = 'text-sm'

  if (type === 'success') {
    el.classList.add('text-green-600')
  } else if (type === 'error') {
    el.classList.add('text-red-600')
  } else {
    el.classList.add('text-gray-500')
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

function getActiveProjectId() {
  return localStorage.getItem('activeProjectId')
}

function formatRole(role) {
  if (role === 'admin') return 'Administrador'
  if (role === 'editor') return 'Editor'
  if (role === 'viewer') return 'Visualizador'
  return '—'
}

function roleBadgeClass(role) {
  if (role === 'admin') {
    return 'bg-green-100 text-green-700 border border-green-200'
  }

  if (role === 'editor') {
    return 'bg-blue-100 text-blue-700 border border-blue-200'
  }

  return 'bg-gray-100 text-gray-700 border border-gray-200'
}

function canManageTeam() {
  return currentUserRole === 'admin'
}

function renderTeamList(members) {
  if (!teamListEl) return

  if (!members || !members.length) {
    teamListEl.innerHTML = `
      <div class="text-sm text-gray-400">
        Nenhum membro encontrado neste projeto.
      </div>
    `
    return
  }

  teamListEl.innerHTML = members.map(member => {
    const memberName =
      member.profiles?.nome ||
      member.profiles?.name ||
      member.profiles?.email ||
      'Usuário'

    const memberEmail = member.profiles?.email || 'Sem e-mail'
    const role = member.role || 'viewer'
    const isSelf = member.user_id === currentUser?.id
    const canManage = canManageTeam() && !isSelf && role !== 'admin'

    return `
      <div class="border border-green-100 rounded-2xl p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p class="font-semibold text-gray-900">${memberName}</p>
          <p class="text-sm text-gray-500">${memberEmail}</p>
        </div>

        <div class="flex flex-col md:flex-row md:items-center gap-3">
          <span class="px-3 py-1 rounded-full text-sm font-medium ${roleBadgeClass(role)}">
            ${formatRole(role)}
          </span>

          ${
            canManage
              ? `
              <div class="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  data-change-role="${member.id}"
                  data-role="editor"
                  class="px-3 py-2 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-sm font-semibold hover:bg-blue-100 transition"
                >
                  Editor
                </button>

                <button
                  type="button"
                  data-change-role="${member.id}"
                  data-role="viewer"
                  class="px-3 py-2 rounded-xl bg-gray-50 text-gray-700 border border-gray-200 text-sm font-semibold hover:bg-gray-100 transition"
                >
                  Visualizador
                </button>

                <button
                  type="button"
                  data-remove-member="${member.id}"
                  class="px-3 py-2 rounded-xl bg-red-50 text-red-600 border border-red-200 text-sm font-semibold hover:bg-red-100 transition"
                >
                  Remover
                </button>
              </div>
              `
              : ''
          }
        </div>
      </div>
    `
  }).join('')

  bindMemberActions()
}

function renderPendingInvites(invites) {
  if (!pendingInvitesListEl) return

  if (!invites || !invites.length) {
    pendingInvitesListEl.innerHTML = `
      <div class="text-sm text-gray-400">
        Nenhum convite pendente no momento.
      </div>
    `
    return
  }

  pendingInvitesListEl.innerHTML = invites.map(invite => {
    const role = invite.role || 'viewer'
    const email = invite.email || 'Sem e-mail'

    return `
      <div class="border border-green-100 rounded-2xl p-4 bg-white flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div>
          <p class="font-semibold text-gray-900">${email}</p>
          <p class="text-sm text-gray-500">Status: ${invite.status || 'pending'}</p>
        </div>

        <div class="flex items-center gap-3">
          <span class="px-3 py-1 rounded-full text-sm font-medium ${roleBadgeClass(role)}">
            ${formatRole(role)}
          </span>
        </div>
      </div>
    `
  }).join('')
}

async function loadProjectInfo() {
  if (!activeProjectId) {
    if (projectNameEl) projectNameEl.textContent = 'Nenhum projeto selecionado'
    if (projectSubtitleEl) {
      projectSubtitleEl.textContent = 'Selecione um projeto para gerenciar a equipe.'
    }
    return
  }

  const { data, error } = await supabase
    .from('projects')
    .select('id, name')
    .eq('id', activeProjectId)
    .single()

  if (error || !data) {
    if (projectNameEl) projectNameEl.textContent = 'Projeto não encontrado'
    if (projectSubtitleEl) {
      projectSubtitleEl.textContent = 'Verifique o projeto ativo selecionado.'
    }
    return
  }

  if (projectNameEl) projectNameEl.textContent = data.name
  if (projectSubtitleEl) {
    projectSubtitleEl.textContent = 'Gerencie acessos deste projeto'
  }
}

async function loadCurrentUserRole() {
  if (!currentUser || !activeProjectId) {
    currentUserRole = null
    if (currentUserRoleEl) currentUserRoleEl.textContent = '—'
    return
  }

  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', activeProjectId)
    .eq('user_id', currentUser.id)
    .single()

  if (error || !data) {
    currentUserRole = null
    if (currentUserRoleEl) currentUserRoleEl.textContent = '—'
    return
  }

  currentUserRole = data.role || null
  if (currentUserRoleEl) currentUserRoleEl.textContent = formatRole(data.role)
}

async function loadTeamMembers() {
  if (!activeProjectId) {
    renderTeamList([])
    return
  }

  const { data: memberRows, error: memberError } = await supabase
    .from('project_members')
    .select('id, role, user_id, project_id')
    .eq('project_id', activeProjectId)

  if (memberError) {
    console.error('Erro ao carregar equipe:', memberError)
    renderTeamList([])
    return
  }

  const members = memberRows || []

  if (!members.length) {
    renderTeamList([])
    return
  }

  const userIds = [...new Set(members.map(member => member.user_id).filter(Boolean))]

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, nome, email')
    .in('id', userIds)

  if (profileError) {
    console.error('Erro ao carregar perfis da equipe:', profileError)
  }

  const profilesMap = new Map((profileRows || []).map(profile => [profile.id, profile]))

  const merged = members.map(member => ({
    ...member,
    profiles: profilesMap.get(member.user_id) || null
  }))

  const sorted = [...merged].sort((a, b) => {
    const order = { admin: 0, editor: 1, viewer: 2 }
    return (order[a.role] ?? 99) - (order[b.role] ?? 99)
  })

  console.log('MEMBERS RAW:', members)
  console.log('PROFILES RAW:', profileRows)
  console.log('MEMBERS MERGED:', merged)

  renderTeamList(sorted)
}

async function loadPendingInvites() {
  if (!activeProjectId) {
    renderPendingInvites([])
    return
  }

  const { data, error } = await supabase
    .from('project_invitations')
    .select('id, email, role, status, token, created_at')
    .eq('project_id', activeProjectId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Erro ao carregar convites:', error)
    renderPendingInvites([])
    return
  }

  renderPendingInvites(data || [])
}

function generateInviteToken() {
  return crypto.randomUUID()
}

function buildInviteLink(token) {
  const baseUrl = window.location.origin
  return `${baseUrl}/convite.html?token=${token}`
}

async function createInvitation(email, role) {
  const token = generateInviteToken()

  const { error } = await supabase
    .from('project_invitations')
    .insert({
      project_id: activeProjectId,
      email,
      role,
      token,
      status: 'pending',
      invited_by: currentUser.id
    })

  if (error) {
    throw error
  }

  return buildInviteLink(token)
}

async function handleInviteSubmit(event) {
  event.preventDefault()

  if (!currentUser) {
    setMessage(inviteMessageEl, 'Usuário não autenticado.', 'error')
    return
  }

  if (!activeProjectId) {
    setMessage(inviteMessageEl, 'Nenhum projeto ativo selecionado.', 'error')
    return
  }

  const email = inviteEmailInput?.value.trim().toLowerCase()
  const role = inviteRoleInput?.value

  if (!email) {
    setMessage(inviteMessageEl, 'Informe um e-mail válido.', 'error')
    return
  }

  if (!['editor', 'viewer'].includes(role)) {
    setMessage(inviteMessageEl, 'Permissão inválida.', 'error')
    return
  }

  setMessage(inviteMessageEl, 'Gerando convite...')

  try {
    const inviteLink = await createInvitation(email, role)

    if (inviteLinkCard) inviteLinkCard.classList.remove('hidden')
    if (generatedInviteLinkInput) generatedInviteLinkInput.value = inviteLink

    setMessage(inviteMessageEl, 'Convite gerado com sucesso.', 'success')
    inviteForm?.reset()

    await loadPendingInvites()
  } catch (error) {
    console.error(error)
    setMessage(inviteMessageEl, 'Erro ao gerar convite.', 'error')
  }
}

async function copyInviteLink() {
  const value = generatedInviteLinkInput?.value.trim()

  if (!value) return

  try {
    await navigator.clipboard.writeText(value)
    setMessage(inviteMessageEl, 'Link copiado com sucesso.', 'success')
  } catch (error) {
    console.error(error)
    setMessage(inviteMessageEl, 'Não foi possível copiar o link.', 'error')
  }
}

async function changeMemberRole(memberId, role) {
  const { error } = await supabase
    .from('project_members')
    .update({ role })
    .eq('id', memberId)
    .eq('project_id', activeProjectId)

  if (error) {
    console.error('Erro ao alterar função:', error)
    alert('Erro ao alterar função do membro.')
    return
  }

  await loadTeamMembers()
}

async function removeMember(memberId) {
  const confirmed = window.confirm('Tem certeza que deseja remover este membro da equipe?')
  if (!confirmed) return

  const { error } = await supabase
    .from('project_members')
    .delete()
    .eq('id', memberId)
    .eq('project_id', activeProjectId)

  if (error) {
    console.error('Erro ao remover membro:', error)
    alert('Erro ao remover membro.')
    return
  }

  await loadTeamMembers()
}

function bindMemberActions() {
  document.querySelectorAll('[data-change-role]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const memberId = btn.dataset.changeRole
      const role = btn.dataset.role
      await changeMemberRole(memberId, role)
    })
  })

  document.querySelectorAll('[data-remove-member]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const memberId = btn.dataset.removeMember
      await removeMember(memberId)
    })
  })
}

async function initPage() {
  currentUser = await getUser()
  if (!currentUser) return

  activeProjectId = getActiveProjectId()

  await loadProjectInfo()
  await loadCurrentUserRole()
  await loadTeamMembers()
  await loadPendingInvites()
}

window.addEventListener('DOMContentLoaded', () => {
  initPage()

  if (inviteForm) {
    inviteForm.addEventListener('submit', handleInviteSubmit)
  }

  if (copyInviteLinkBtn) {
    copyInviteLinkBtn.addEventListener('click', copyInviteLink)
  }
})
