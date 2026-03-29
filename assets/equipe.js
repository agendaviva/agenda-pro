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

  if (type === 'success') el.classList.add('text-green-600')
  else if (type === 'error') el.classList.add('text-red-600')
  else el.classList.add('text-gray-500')
}

async function getUser() {
  const { data } = await supabase.auth.getUser()
  if (!data.user) {
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
  if (role === 'admin') return 'bg-green-100 text-green-700 border border-green-200'
  if (role === 'editor') return 'bg-blue-100 text-blue-700 border border-blue-200'
  return 'bg-gray-100 text-gray-700 border border-gray-200'
}

function canManageTeam() {
  return currentUserRole === 'admin'
}

function canManageAgenda() {
  return currentUserRole === 'admin' || currentUserRole === 'editor'
}

function isViewer() {
  return currentUserRole === 'viewer'
}

function renderTeamList(members) {
  if (!members?.length) {
    teamListEl.innerHTML = `<div class="text-sm text-gray-400">Nenhum membro encontrado.</div>`
    return
  }

  teamListEl.innerHTML = members.map(member => {
    const name = member.profiles?.nome || member.profiles?.email || 'Usuário'
    const email = member.profiles?.email || ''
    const role = member.role
    const isSelf = member.user_id === currentUser.id
    const canManage = canManageTeam() && !isSelf && role !== 'admin'

    return `
    <div class="border rounded-2xl p-4 flex justify-between items-center">
      <div>
        <p class="font-semibold">${name}</p>
        <p class="text-sm text-gray-500">${email}</p>
      </div>

      <div class="flex items-center gap-2">
        ${
          canManage
            ? `
          <select data-change-role="${member.id}" class="border rounded-xl px-3 py-2">
            <option value="admin" ${role === 'admin' ? 'selected' : ''}>Admin</option>
            <option value="editor" ${role === 'editor' ? 'selected' : ''}>Editor</option>
            <option value="viewer" ${role === 'viewer' ? 'selected' : ''}>Viewer</option>
          </select>

          <button data-remove-member="${member.id}" class="text-red-600 font-semibold text-sm">
            Remover
          </button>
          `
            : `<span class="px-3 py-1 rounded-full text-sm ${roleBadgeClass(role)}">${formatRole(role)}</span>`
        }
      </div>
    </div>
    `
  }).join('')

  bindMemberActions()
}

function renderPendingInvites(invites) {
  if (!invites?.length) {
    pendingInvitesListEl.innerHTML = `<div class="text-sm text-gray-400">Nenhum convite pendente.</div>`
    return
  }

  pendingInvitesListEl.innerHTML = invites.map(invite => {
    return `
    <div class="border rounded-2xl p-4 flex justify-between items-center">
      <div>
        <p class="font-semibold">${invite.email}</p>
        <p class="text-sm text-gray-500">Convite pendente</p>
      </div>

      <div class="flex items-center gap-2">
        <span class="px-3 py-1 rounded-full text-sm ${roleBadgeClass(invite.role)}">
          ${formatRole(invite.role)}
        </span>

        ${
          canManageTeam()
            ? `<button data-cancel-invite="${invite.id}" class="text-red-600 text-sm font-semibold">Cancelar</button>`
            : ''
        }
      </div>
    </div>
    `
  }).join('')

  bindInviteActions()
}

async function loadTeamMembers() {
  const { data } = await supabase
    .from('project_members')
    .select('*')
    .eq('project_id', activeProjectId)

  const userIds = data.map(m => m.user_id)

  const { data: profiles } = await supabase
    .from('profiles')
    .select('*')
    .in('id', userIds)

  const map = new Map(profiles.map(p => [p.id, p]))

  const merged = data.map(m => ({
    ...m,
    profiles: map.get(m.user_id)
  }))

  renderTeamList(merged)
}

async function loadPendingInvites() {
  const { data } = await supabase
    .from('project_invitations')
    .select('*')
    .eq('project_id', activeProjectId)
    .eq('status', 'pending')

  renderPendingInvites(data)
}

async function createInvitation(email, role) {
  const { data: existing } = await supabase
    .from('project_invitations')
    .select('id')
    .eq('email', email)
    .eq('project_id', activeProjectId)
    .eq('status', 'pending')

  if (existing.length) throw new Error('Convite já existe')

  const token = crypto.randomUUID()

  await supabase.from('project_invitations').insert({
    project_id: activeProjectId,
    email,
    role,
    token,
    status: 'pending',
    invited_by: currentUser.id,
    expires_at: new Date(Date.now() + 7 * 86400000)
  })

  return `${location.origin}/convite.html?token=${token}`
}

async function cancelInvite(id) {
  await supabase
    .from('project_invitations')
    .update({ status: 'canceled' })
    .eq('id', id)

  loadPendingInvites()
}

async function changeMemberRole(id, role) {
  await supabase
    .from('project_members')
    .update({ role })
    .eq('id', id)

  loadTeamMembers()
}

async function removeMember(id) {
  if (!confirm('Remover membro?')) return

  await supabase
    .from('project_members')
    .delete()
    .eq('id', id)

  loadTeamMembers()
}

function bindMemberActions() {
  document.querySelectorAll('[data-change-role]').forEach(el => {
    el.onchange = () => changeMemberRole(el.dataset.changeRole, el.value)
  })

  document.querySelectorAll('[data-remove-member]').forEach(el => {
    el.onclick = () => removeMember(el.dataset.removeMember)
  })
}

function bindInviteActions() {
  document.querySelectorAll('[data-cancel-invite]').forEach(el => {
    el.onclick = () => cancelInvite(el.dataset.cancelInvite)
  })
}

async function init() {
  currentUser = await getUser()
  activeProjectId = getActiveProjectId()

  const { data } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', activeProjectId)
    .eq('user_id', currentUser.id)
    .single()

  currentUserRole = data?.role

  if (!canManageTeam()) inviteForm.style.display = 'none'

  loadTeamMembers()
  loadPendingInvites()
}

inviteForm?.addEventListener('submit', async e => {
  e.preventDefault()

  try {
    const link = await createInvitation(
      inviteEmailInput.value,
      inviteRoleInput.value
    )

    inviteLinkCard.classList.remove('hidden')
    generatedInviteLinkInput.value = link
    setMessage(inviteMessageEl, 'Convite criado', 'success')
  } catch (e) {
    setMessage(inviteMessageEl, e.message, 'error')
  }
})

copyInviteLinkBtn?.addEventListener('click', async () => {
  await navigator.clipboard.writeText(generatedInviteLinkInput.value)
  setMessage(inviteMessageEl, 'Copiado', 'success')
})

init()
