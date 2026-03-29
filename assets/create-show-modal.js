import { supabase } from './supabase.js'

let editingId = null
let editingOriginalShow = null
let currentUserRole = null

function getActiveProjectId() {
  return localStorage.getItem('activeProjectId')
}

async function getUser() {
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    window.location.href = 'login.html'
    return null
  }

  return data.user
}

async function loadCurrentUserRole() {
  const user = await getUser()
  if (!user) return null

  const projectId = getActiveProjectId()
  if (!projectId) return null

  const { data } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  currentUserRole = data?.role || null
  return currentUserRole
}

function canManageAgenda() {
  return currentUserRole === 'admin' || currentUserRole === 'editor'
}

document.getElementById("create-show-modal-container").innerHTML = `
<div id="createShowModal" class="fixed inset-0 hidden z-[70]">
  <div id="modalBackdrop" class="absolute inset-0 bg-black/45"></div>

  <div class="relative z-10 h-full w-full overflow-y-auto">
    <div class="min-h-full flex items-center justify-center p-4">
      <div class="w-full max-w-3xl bg-white rounded-3xl shadow-xl border p-6">

        <div class="flex justify-between items-center mb-4">
          <h3 id="modalTitle" class="text-xl font-semibold">Show</h3>
          <button onclick="closeCreateShowModal()" class="text-xl">✕</button>
        </div>

        <p id="modalSubtitle" class="text-sm text-gray-500 mb-4"></p>

        <div class="grid grid-cols-2 gap-4">

          <input id="showDate" type="date" class="border p-2 rounded-lg">
          <input id="showTime" type="time" class="border p-2 rounded-lg">

          <input id="showState" placeholder="Estado" class="border p-2 rounded-lg">
          <input id="showCity" placeholder="Cidade" class="border p-2 rounded-lg">

          <input id="showTitle" placeholder="Título" class="col-span-2 border p-2 rounded-lg">
          <input id="showContractor" placeholder="Contratante" class="col-span-2 border p-2 rounded-lg">

          <textarea id="showNotes" placeholder="Observações" class="col-span-2 border p-2 rounded-lg"></textarea>

        </div>

        <div class="flex justify-between mt-6">
          <button id="deleteShowBtn" class="text-red-600 hidden">Excluir</button>

          <button id="saveShowBtn" class="bg-green-500 text-white px-6 py-2 rounded-lg">
            Salvar
          </button>
        </div>

      </div>
    </div>
  </div>
</div>
`

function setReadOnlyMode(readOnly) {
  const fields = [
    'showDate','showTime','showCity','showState',
    'showTitle','showContractor','showNotes'
  ]

  fields.forEach(id => {
    const el = document.getElementById(id)
    el.disabled = readOnly
    el.classList.toggle('bg-gray-100', readOnly)
  })

  document.getElementById('saveShowBtn').style.display = readOnly ? 'none' : 'block'
  document.getElementById('deleteShowBtn').style.display =
    readOnly || !editingId ? 'none' : 'block'

  document.getElementById('modalSubtitle').innerText =
    readOnly ? 'Modo visualização (sem permissão para editar)' : ''
}

async function openCreateShowModal(date = '', show = null) {
  await loadCurrentUserRole()

  const modal = document.getElementById('createShowModal')
  modal.classList.remove('hidden')

  if (show) {
    editingId = show.id
    editingOriginalShow = show

    document.getElementById('modalTitle').innerText =
      canManageAgenda() ? 'Editar show' : 'Visualizar show'

    document.getElementById('showDate').value = show.data || ''
    document.getElementById('showTime').value = show.horario || ''
    document.getElementById('showCity').value = show.cidade || ''
    document.getElementById('showState').value = show.estado || ''
    document.getElementById('showTitle').value = show.titulo || ''
    document.getElementById('showContractor').value = show.contratante || ''
    document.getElementById('showNotes').value = show.observacoes || ''

  } else {
    if (!canManageAgenda()) {
      alert('Você só pode visualizar a agenda')
      return
    }

    editingId = null

    document.getElementById('modalTitle').innerText = 'Novo show'

    document.getElementById('showDate').value = date || ''
    document.getElementById('showTime').value = ''
    document.getElementById('showCity').value = ''
    document.getElementById('showState').value = ''
    document.getElementById('showTitle').value = ''
    document.getElementById('showContractor').value = ''
    document.getElementById('showNotes').value = ''
  }

  setReadOnlyMode(!canManageAgenda())
}

function closeCreateShowModal() {
  document.getElementById('createShowModal').classList.add('hidden')
}

async function saveShow() {
  if (!canManageAgenda()) return

  const data = document.getElementById('showDate').value
  if (!data) return alert('Preencha a data')

  const projectId = getActiveProjectId()

  const payload = {
    project_id: projectId,
    data,
    horario: document.getElementById('showTime').value || null,
    cidade: document.getElementById('showCity').value,
    estado: document.getElementById('showState').value,
    titulo: document.getElementById('showTitle').value,
    contratante: document.getElementById('showContractor').value,
    observacoes: document.getElementById('showNotes').value
  }

  let error

  if (editingId) {
    const res = await supabase.from('shows').update(payload).eq('id', editingId)
    error = res.error
  } else {
    const res = await supabase.from('shows').insert([payload])
    error = res.error
  }

  if (error) return alert('Erro ao salvar')

  closeCreateShowModal()
  location.reload()
}

async function deleteCurrentShow() {
  if (!canManageAgenda()) return

  if (!confirm('Excluir show?')) return

  await supabase.from('shows').delete().eq('id', editingId)

  closeCreateShowModal()
  location.reload()
}

document.getElementById('saveShowBtn')?.addEventListener('click', saveShow)
document.getElementById('deleteShowBtn')?.addEventListener('click', deleteCurrentShow)

window.openCreateShowModal = openCreateShowModal
