import { supabase } from './supabase.js'

let editingId = null
let editingOriginalShow = null

document.getElementById("create-show-modal-container").innerHTML = `
  <div id="createShowModal" class="fixed inset-0 hidden z-[70]">
    <div id="modalBackdrop" class="absolute inset-0 bg-black/45"></div>

    <div class="relative z-10 h-full w-full overflow-y-auto">
      <div class="min-h-full flex items-start md:items-center justify-center p-3 md:p-6">
        <div class="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-green-100 my-4 md:my-8 max-h-[92vh] flex flex-col">
          
          <div class="flex items-center justify-between px-5 py-4 border-b">
            <h3 id="modalTitle" class="text-2xl font-light text-gray-700">Novo show</h3>
            <button onclick="attemptCloseModal()" class="text-3xl text-gray-400 hover:text-gray-700">&times;</button>
          </div>

          <div class="overflow-y-auto px-5 py-6">

            <div class="flex items-center justify-between mb-5">
              <div>
                <p class="text-sm text-gray-500">Gerencie os dados do show</p>
              </div>

              <button
                id="deleteShowBtn"
                onclick="deleteCurrentShow()"
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
                <p class="text-xs text-gray-400 mt-1">Se não definir, ficará sem horário.</p>
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
              <button onclick="saveShow()" class="bg-green-500 hover:bg-green-600 text-white px-8 py-3 rounded-xl">
                Salvar
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  </div>
`

function emitShowsChanged() {
  window.dispatchEvent(new CustomEvent('showsChanged'))
}

function openCreateShowModal(date = '', show = null) {
  const modal = document.getElementById('createShowModal')
  const title = document.getElementById('modalTitle')
  const deleteBtn = document.getElementById('deleteShowBtn')

  modal.classList.remove('hidden')
  document.body.classList.add('overflow-hidden')

  if (show) {
    editingId = show.id
    editingOriginalShow = { ...show }
    title.innerText = 'Editar show'
    deleteBtn.classList.remove('hidden')

    document.getElementById('showDate').value = show.data || ''
    document.getElementById('showTime').value = show.horario || ''
    document.getElementById('showCity').value = show.cidade || ''
    document.getElementById('showState').value = show.estado || ''
    document.getElementById('showTitle').value = show.titulo || ''
    document.getElementById('showContractor').value = show.contratante || ''
    document.getElementById('showNotes').value = show.observacoes || ''
  } else {
    editingId = null
    editingOriginalShow = null
    title.innerText = 'Novo show'
    deleteBtn.classList.add('hidden')

    document.getElementById('showDate').value = date || ''
    document.getElementById('showTime').value = ''
    document.getElementById('showCity').value = ''
    document.getElementById('showState').value = ''
    document.getElementById('showTitle').value = ''
    document.getElementById('showContractor').value = ''
    document.getElementById('showNotes').value = ''
  }
}

function closeCreateShowModal() {
  document.getElementById('createShowModal').classList.add('hidden')
  document.body.classList.remove('overflow-hidden')
}

function attemptCloseModal() {
  if (confirm('Cancelar?')) closeCreateShowModal()
}

document.addEventListener('click', function (event) {
  const backdrop = document.getElementById('modalBackdrop')
  if (backdrop && event.target === backdrop) {
    attemptCloseModal()
  }
})

async function saveShow() {
  const data = document.getElementById('showDate').value
  const horario = document.getElementById('showTime').value || null
  const cidade = document.getElementById('showCity').value
  const estado = document.getElementById('showState').value
  const titulo = document.getElementById('showTitle').value
  const contratante = document.getElementById('showContractor').value
  const observacoes = document.getElementById('showNotes').value

  if (!data) {
    alert('Preencha a data')
    return
  }

  let error = null

  if (editingId) {
    const updatedShow = {
      id: editingId,
      data,
      horario,
      cidade,
      estado,
      titulo,
      contratante,
      observacoes
    }

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
      window.updateShowInCalendar(editingOriginalShow, res.data || updatedShow)
    }
  } else {
    const res = await supabase
      .from('shows')
      .insert([{ data, horario, cidade, estado, titulo, contratante, observacoes }])
      .select()
      .single()

    error = res.error

    if (!error && window.addShowToCalendar) {
      window.addShowToCalendar(res.data)
    }
  }

  if (error) {
    alert('Erro ao salvar')
    return
  }

  closeCreateShowModal()
  emitShowsChanged()
}

async function deleteCurrentShow() {
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

window.openCreateShowModal = openCreateShowModal
window.saveShow = saveShow
window.attemptCloseModal = attemptCloseModal
window.deleteCurrentShow = deleteCurrentShow
