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
  if (role === 'admin') return 'bg-green-100 text-green-700 border border-green-200'
  if (role === 'editor') return 'bg-blue-100 text-blue-700 border border-blue-200'
  return 'bg-gray-100 text-gray-700 border border-gray-200'
}

function canManageTeam() {
  return currentUserRole === 'admin'
}

/* =======================
   🔥 CORREÇÃO PRINCIPAL AQUI
======================= */
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
    console.error('Erro ao carregar membros:', memberError)
    renderTeamList([])
    return
  }

  const members = memberRows || []

  if (!members.length) {
    renderTeamList([])
    return
  }

  const userIds = [...new Set(members.map(m => m.user_id).filter(Boolean))]

  const { data: profileRows, error: profileError } = await supabase
    .from('profiles')
    .select('id, nome, email')
    .in('id', userIds)

  if (profileError) {
    console.error('Erro ao carregar perfis:', profileError)
  }

  const profilesMap = new Map((profileRows || []).map(p => [p.id, p]))

  const merged = members.map(member => ({
    ...member,
    profiles: profilesMap.get(member.user_id) || null
  }))

  const sorted = [...merged].sort((a, b) => {
    const order = { admin: 0, editor: 1, viewer: 2 }
    return (order[a.role] ?? 99) - (order[b.role] ?? 99)
  })

  console.log('MEMBERS:', sorted)

  renderTeamList(sorted)
}

function renderTeamList(members) {
  if (!teamListEl) return

  if (!members || !members.length) {
    teamListEl.innerHTML = `<div class="text-sm text-gray-400">Nenhum membro encontrado.</div>`
    return
  }

  teamListEl.innerHTML = members.map(member => {
    const nome =
      member.profiles?.nome ||
      member.profiles?.email ||
      'Usuário'

    const email = member.profiles?.email || 'Sem e-mail'
    const role = member.role
    const isSelf = member.user_id === currentUser?.id
    const canManage = canManageTeam() && !isSelf && role !== 'admin'

    return `
      <div class="border border-green-100 rounded-2xl p-4 bg-white flex flex-col lg:flex-row justify-between gap-4">
        <div>
          <p class="font-semibold">${nome}</p>
          <p class="text-sm text-gray-500">${email}</p>
        </div>

        <div class="flex flex-col gap-2">
          <span class="px-3 py-1 rounded-full text-sm ${roleBadgeClass(role)}">
            ${formatRole(role)}
          </span>

          ${
            canManage
              ? `
              <div class="flex gap-2">
                <button data-role="${member.id}" data-type="editor">Editor</button>
                <button data-role="${member.id}" data-type="viewer">Viewer</button>
                <button data-remove="${member.id}">Remover</button>
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

function bindMemberActions() {
  document.querySelectorAll('[data-role]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.role
      const role = btn.dataset.type

      await supabase.from('project_members')
        .update({ role })
        .eq('id', id)

      await loadTeamMembers()
    })
  })

  document.querySelectorAll('[data-remove]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = btn.dataset.remove

      await supabase.from('project_members')
        .delete()
        .eq('id', id)

      await loadTeamMembers()
    })
  })
}

/* ======================= */

async function loadPendingInvites() {
  const { data } = await supabase
    .from('project_invitations')
    .select('*')
    .eq('project_id', activeProjectId)
    .eq('status', 'pending')

  renderPendingInvites(data || [])
}

function renderPendingInvites(invites) {
  if (!pendingInvitesListEl) return

  pendingInvitesListEl.innerHTML = invites.map(invite => `
    <div class="text-sm text-gray-600">
      ${invite.email} (${invite.role})
    </div>
  `).join('')
}

async function initPage() {
  currentUser = await getUser()
  if (!currentUser) return

  activeProjectId = getActiveProjectId()

  const { data } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', activeProjectId)
    .eq('user_id', currentUser.id)
    .single()

  currentUserRole = data?.role

  await loadTeamMembers()
  await loadPendingInvites()
}

window.addEventListener('DOMContentLoaded', initPage)
