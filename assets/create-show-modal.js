import { supabase } from './supabase.js'

let editingId = null
let editingOriginalShow = null
let currentUserRole = null

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

async function loadCurrentUserRole() {
  const user = await getUser()
  if (!user) return null

  const projectId = getActiveProjectId()
  if (!projectId) return null

  const { data, error } = await supabase
    .from('project_members')
    .select('role')
    .eq('project_id', projectId)
    .eq('user_id', user.id)
    .single()

  if (error || !data) {
    currentUserRole = null
    return null
  }

  currentUserRole = data.role || null
  return currentUserRole
}

function canManageAgenda() {
  return currentUserRole === 'admin' || currentUserRole === 'editor'
}

const container = document.getElementById('create-show-modal-container')

container.innerHTML = `
  <div id="createShowModal" class="fixed inset-0 hidden z-[70]">
    <div id="modalBackdrop" class="absolute inset-0 bg-black/45"></div>

    <div class="relative z-10 h-full w-full overflow-y-auto">
      <div class="min-h-full flex items-start md:items-center justify-center p-3 md:p-6">
        <div class="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-green-100 my-4 md:my-8 max-h-[92vh] flex flex-col">
          
          <div class="flex items-center justify-between px-5 py-4 border-b">
            <h3 id="modalTitle" class="text-2xl font-light text-gray-700">Novo show</h3>
            <button type="button" id="closeModalBtn" class="text-3xl text-gray-400 hover:text-gray-700">&times;</button>
          </div>

          <div class="overflow-y-auto px-5 py-6">

            <div class="flex items-center justify-between mb-5">
              <div>
                <p class="text-sm text-gray-500" id="modalSubtitle">Gerencie os dados do show</p>
              </div>

              <button
                id="deleteShowBtn"
                type="button"
                class="hidden bg-red-50 hover:bg-red-100 text-red-600 px-4 py-2 rounded-xl text-sm font-medium transition"
              >
                Excluir data
              </button>
            </div>

            <div class="grid md:grid-cols-2 gap-5">
              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Data</label>
                <input id="showDate" type="date" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Horário</label>
                <input id="showTime" type="time" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Estado</label>
                <input id="showState" type="text" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div>
                <label class="block mb-2 text-sm font-medium text-gray-700">Cidade</label>
                <input id="showCity" type="text" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div class="md:col-span-2">
                <label class="block mb-2 text-sm font-medium text-gray-700">Título</label>
                <input id="showTitle" type="text" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div class="md:col-span-2">
                <label class="block mb-2 text-sm font-medium text-gray-700">Contratante</label>
                <input id="showContractor" type="text" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div class="md:col-span-2">
                <label class="block mb-2 text-sm font-medium text-gray-700">Observações</label>
                <textarea id="showNotes" class="w-full p-3 border rounded-xl"></textarea>
              </div>
            </div>

            <div class="text-center mt-6">
              <button
                id="saveShowBtn"
                type="button"
                class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl"
              >
                Salvar
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  </div>
`

function getModalEls() {
  return {
    modal: document.getElementById('createShowModal'),
    backdrop: document.getElementById('modalBackdrop'),
    title: document.getElementById('modalTitle'),
    subtitle: document.getElementById('modalSubtitle'),
    closeBtn: document.getElementById('closeModalBtn'),
    deleteBtn: document.getElementById('deleteShowBtn'),
    saveBtn: document.getElementById('saveShowBtn'),
    date: document.getElementById('showDate'),
    time: document.getElementById('showTime'),
    city: document.getElementById('showCity'),
    state: document.getElementById('showState'),
    titleInput: document.getElementById('showTitle'),
    contractor: document.getElementById('showContractor'),
    notes: document.getElementById('showNotes')
  }
}

function resetForm() {
  const els = getModalEls()
  editingId = null
  editingOriginalShow = null

  els.date.value = ''
  els.time.value = ''
  els.city.value = ''
  els.state.value = ''
  els.titleInput.value = ''
  els.contractor.value = ''
  els.notes.value = ''

  els.title.textContent = 'Novo show'
  els.subtitle.textContent = 'Gerencie os dados do show'
  els.deleteBtn.classList.add('hidden')
  els.saveBtn.classList.remove('hidden')

  setReadOnly(false)
}

function setReadOnly(readOnly) {
  const els = getModalEls()
  const fields = [
    els.date,
    els.time,
    els.city,
    els.state,
    els.titleInput,
    els.contractor,
    els.notes
  ]

  fields.forEach(field => {
    field.disabled = readOnly
    field.classList.toggle('bg-gray-50', readOnly)
    field.classList.toggle('text-gray-500', readOnly)
    field.classList.toggle('cursor-not-allowed', readOnly)
  })

  if (readOnly) {
    els.saveBtn.classList.add('hidden')
    els.deleteBtn.classList.add('hidden')
    els.subtitle.textContent = 'Modo visualização'
  }
}

function fillForm(show, date = '') {
  const els = getModalEls()
  els.date.value = show?.data || date || ''
  els.time.value = show?.horario || ''
  els.city.value = show?.cidade || ''
  els.state.value = show?.estado || ''
  els.titleInput.value = show?.titulo || ''
  els.contractor.value = show?.contratante || ''
  els.notes.value = show?.observacoes || ''
}

function openModal() {
  const { modal } = getModalEls()
  modal.classList.remove('hidden')
  document.body.classList.add('overflow-hidden')
}

function closeCreateShowModal() {
  const { modal } = getModalEls()
  modal.classList.add('hidden')
  document.body.classList.remove('overflow-hidden')
  resetForm()
}

function emitShowsChanged() {
  window.dispatchEvent(new CustomEvent('showsChanged'))
}

async function openCreateShowModal(date = '', show = null) {
  await loadCurrentUserRole()

  if (!show && !canManageAgenda()) {
    alert('Você só pode visualizar a agenda.')
    return
  }

  resetForm()

  if (show) {
    editingId = show.id
    editingOriginalShow = { ...show }
    fillForm(show)

    const els = getModalEls()
    els.title.textContent = canManageAgenda() ? 'Editar show' : 'Detalhes do show'

    if (canManageAgenda()) {
      els.deleteBtn.classList.remove('hidden')
    } else {
      setReadOnly(true)
    }
  } else {
    fillForm(null, date)
  }

  openModal()
}

async function saveShow() {
  await loadCurrentUserRole()

  if (!canManageAgenda()) {
    alert('Você não tem permissão para alterar a agenda.')
    closeCreateShowModal()
    return
  }

  const els = getModalEls()

  const data = els.date.value
  const horario = els.time.value || null
  const cidade = els.city.value
  const estado = els.state.value
  const titulo = els.titleInput.value
  const contratante = els.contractor.value
  const observacoes = els.notes.value

  if (!data) {
    alert('Preencha a data')
    return
  }

  const user = await getUser()
  if (!user) return

  const projectId = getActiveProjectId()
  if (!projectId) {
    alert('Nenhuma agenda selecionada')
    return
  }

  let error = null

  if (editingId) {
    const res = await supabase
      .from('shows')
      .update({
        data,
        horario,
        cidade,
        estado,
        titulo,
        contratante,
        observacoes
      })
      .eq('id', editingId)
      .select()
      .single()

    error = res.error

    if (!error && window.updateShowInCalendar && editingOriginalShow) {
      window.updateShowInCalendar(editingOriginalShow, res.data)
    }
  } else {
    const res = await supabase
      .from('shows')
      .insert([{
        project_id: projectId,
        data,
        horario,
        cidade,
        estado,
        titulo,
        contratante,
        observacoes
      }])
      .select()
      .single()

    error = res.error

    if (!error && window.addShowToCalendar) {
      window.addShowToCalendar(res.data)
    }
  }

  if (error) {
    alert('Erro ao salvar')
    console.error(error)
    return
  }

  closeCreateShowModal()
  emitShowsChanged()
}

async function deleteCurrentShow() {
  await loadCurrentUserRole()

  if (!canManageAgenda()) {
    alert('Você não tem permissão para excluir.')
    closeCreateShowModal()
    return
  }

  if (!editingId) return

  const confirmar = confirm('Excluir essa data?')
  if (!confirmar) return

  const { error } = await supabase
    .from('shows')
    .delete()
    .eq('id', editingId)

  if (error) {
    alert('Erro ao excluir')
    return
  }

  if (window.removeShowFromCalendar && editingOriginalShow) {
    window.removeShowFromCalendar(editingId, editingOriginalShow.data)
  }

  closeCreateShowModal()
  emitShowsChanged()
}

const els = getModalEls()
els.closeBtn.addEventListener('click', closeCreateShowModal)
els.backdrop.addEventListener('click', closeCreateShowModal)
els.saveBtn.addEventListener('click', saveShow)
els.deleteBtn.addEventListener('click', deleteCurrentShow)

window.openCreateShowModal = openCreateShowModal
window.closeCreateShowModal = closeCreateShowModal
window.saveShow = saveShow
window.deleteCurrentShow = deleteCurrentShow
window.attemptCloseModal = closeCreateShowModal
