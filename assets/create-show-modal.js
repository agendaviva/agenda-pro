import { supabase } from './supabase.js'

// 🔥 controle de edição
let editingId = null

document.getElementById("create-show-modal-container").innerHTML = `
  <div id="createShowModal" class="fixed inset-0 hidden z-[70]">
    <div id="modalBackdrop" class="absolute inset-0 bg-black/45"></div>

    <div class="relative z-10 h-full w-full overflow-y-auto">
      <div class="min-h-full flex items-start md:items-center justify-center p-3 md:p-6">
        <div class="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-green-100 my-4 md:my-8 max-h-[92vh] flex flex-col">
          
          <div class="flex items-center justify-between px-5 py-4 border-b">
            <h3 id="modalTitle" class="text-2xl font-light text-gray-700">Novo show</h3>
            <button onclick="attemptCloseModal()" class="text-3xl text-gray-400">&times;</button>
          </div>

          <div class="overflow-y-auto px-5 py-6">

            <div class="grid md:grid-cols-2 gap-5">

              <div>
                <label>Data</label>
                <input id="showDate" type="date" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div>
                <label>Horário</label>
                <input id="showTime" type="time" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div>
                <label>Estado</label>
                <input id="showState" type="text" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div>
                <label>Cidade</label>
                <input id="showCity" type="text" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div class="md:col-span-2">
                <label>Título</label>
                <input id="showTitle" type="text" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div class="md:col-span-2">
                <label>Contratante</label>
                <input id="showContractor" type="text" class="w-full h-12 px-3 border rounded-xl">
              </div>

              <div class="md:col-span-2">
                <label>Observações</label>
                <textarea id="showNotes" class="w-full p-3 border rounded-xl"></textarea>
              </div>

            </div>

            <div class="text-center mt-6">
              <button onclick="saveShow()" class="bg-green-500 text-white px-8 py-3 rounded-xl">
                Salvar
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  </div>
`

// 🔥 ABRIR MODAL (CREATE ou EDIT)
function openCreateShowModal(date = '', show = null) {
  const modal = document.getElementById('createShowModal')

  modal.classList.remove('hidden')
  document.body.classList.add('overflow-hidden')

  const title = document.getElementById('modalTitle')

  if (show) {
    // 👉 modo edição
    editingId = show.id
    title.innerText = 'Editar show'

    document.getElementById('showDate').value = show.data
    document.getElementById('showTime').value = show.horario
    document.getElementById('showCity').value = show.cidade
    document.getElementById('showState').value = show.estado
    document.getElementById('showTitle').value = show.titulo
    document.getElementById('showContractor').value = show.contratante
    document.getElementById('showNotes').value = show.observacoes

  } else {
    // 👉 modo criação
    editingId = null
    title.innerText = 'Novo show'

    document.getElementById('showDate').value = date || ''
    document.getElementById('showTime').value = ''
    document.getElementById('showCity').value = ''
    document.getElementById('showState').value = ''
    document.getElementById('showTitle').value = ''
    document.getElementById('showContractor').value = ''
    document.getElementById('showNotes').value = ''
  }
}

// 🔥 FECHAR
function closeCreateShowModal() {
  document.getElementById('createShowModal').classList.add('hidden')
  document.body.classList.remove('overflow-hidden')
}

// 🔥 CONFIRMAR FECHAMENTO
function attemptCloseModal() {
  if (confirm('Cancelar?')) closeCreateShowModal()
}

// 🔥 BACKDROP
document.addEventListener('click', function (event) {
  const backdrop = document.getElementById('modalBackdrop')
  if (backdrop && event.target === backdrop) {
    attemptCloseModal()
  }
})

// 🔥 SALVAR (CREATE ou UPDATE)
async function saveShow() {
  const data = document.getElementById('showDate').value
  const horario = document.getElementById('showTime').value
  const cidade = document.getElementById('showCity').value
  const estado = document.getElementById('showState').value
  const titulo = document.getElementById('showTitle').value
  const contratante = document.getElementById('showContractor').value
  const observacoes = document.getElementById('showNotes').value

  if (!data) {
    alert('Preencha a data')
    return
  }

  let error

  if (editingId) {
    // 🔥 UPDATE
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

    error = res.error

  } else {
    // 🔥 CREATE
    const res = await supabase
      .from('shows')
      .insert([{ data, horario, cidade, estado, titulo, contratante, observacoes }])

    error = res.error
  }

  if (error) {
    alert('Erro ao salvar')
    return
  }

  closeCreateShowModal()
  location.reload()
}

// 🔥 GLOBAL
window.openCreateShowModal = openCreateShowModal
window.saveShow = saveShow
window.attemptCloseModal = attemptCloseModal
