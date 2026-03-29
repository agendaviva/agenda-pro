import { supabase } from './supabase.js'

document.getElementById("create-show-modal-container").innerHTML = `
  <div id="createShowModal" class="fixed inset-0 hidden z-[70]">
    <div id="modalBackdrop" class="absolute inset-0 bg-black/45"></div>

    <div class="relative z-10 h-full w-full overflow-y-auto">
      <div class="min-h-full flex items-start md:items-center justify-center p-3 md:p-6">
        <div id="modalBox" class="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-green-100 my-4 md:my-8 max-h-[92vh] flex flex-col">
          
          <div class="flex items-center justify-between px-5 md:px-6 py-4 border-b border-gray-100 shrink-0">
            <h3 class="text-2xl md:text-3xl font-light text-gray-700">Novo lançamento</h3>
            <button onclick="attemptCloseModal()" class="text-3xl text-gray-400 hover:text-gray-700 leading-none">&times;</button>
          </div>

          <div class="overflow-y-auto px-5 md:px-8 py-6 md:py-8">
            <div class="mb-8">
              <h2 class="text-3xl md:text-5xl font-light text-gray-500">Agenda Lux</h2>
            </div>

            <div class="w-full bg-gray-100 rounded-full h-4 overflow-hidden mb-8">
              <div class="bg-green-500 h-4 w-1/2 flex items-center justify-center text-white text-xs font-bold">PASSO 1</div>
            </div>

            <h4 class="text-2xl md:text-3xl font-bold text-gray-600 mb-8">INFORMAÇÕES BÁSICAS</h4>

            <div class="grid md:grid-cols-2 gap-5">

              <div class="md:col-span-2">
                <label class="block text-base md:text-lg font-semibold text-gray-600 mb-2">Tipo de lançamento</label>
                <select class="w-full h-14 px-4 rounded-2xl border border-gray-300 bg-white text-gray-700">
                  <option>Show</option>
                  <option>Evento promocional</option>
                  <option>Entrevista</option>
                </select>
              </div>

              <div>
                <label class="block text-base md:text-lg font-semibold text-gray-600 mb-2">Data</label>
                <input id="showDate" type="date" class="w-full h-14 px-4 rounded-2xl border border-gray-300 bg-white text-gray-700">
              </div>

              <div>
                <label class="block text-base md:text-lg font-semibold text-gray-600 mb-2">Horário</label>
                <input id="showTime" type="time" class="w-full h-14 px-4 rounded-2xl border border-gray-300 bg-white text-gray-700">
              </div>

              <div>
                <label class="block text-base md:text-lg font-semibold text-gray-600 mb-2">Estado</label>
                <select id="showState" class="w-full h-14 px-4 rounded-2xl border border-gray-300 bg-white text-gray-700">
                  <option>Selecione</option>
                  <option>Bahia</option>
                  <option>Minas Gerais</option>
                  <option>São Paulo</option>
                </select>
              </div>

              <div>
                <label class="block text-base md:text-lg font-semibold text-gray-600 mb-2">Cidade</label>
                <input id="showCity" type="text" placeholder="Digite a cidade" class="w-full h-14 px-4 rounded-2xl border border-gray-300 bg-white text-gray-700">
              </div>

              <div class="md:col-span-2">
                <label class="block text-base md:text-lg font-semibold text-gray-600 mb-2">Título</label>
                <input id="showTitle" type="text" placeholder="Ex: Vaquejada do Parque" class="w-full h-14 px-4 rounded-2xl border border-gray-300 bg-white text-gray-700">
              </div>

              <div class="md:col-span-2">
                <label class="block text-base md:text-lg font-semibold text-gray-600 mb-2">Contratante</label>
                <input id="showContractor" type="text" placeholder="Nome do contratante" class="w-full h-14 px-4 rounded-2xl border border-gray-300 bg-white text-gray-700">
              </div>

              <div class="md:col-span-2">
                <label class="block text-base md:text-lg font-semibold text-gray-600 mb-2">Informações adicionais</label>
                <textarea id="showNotes" rows="4" placeholder="Observações do show..." class="w-full px-4 py-3 rounded-2xl border border-gray-300 bg-white text-gray-700"></textarea>
              </div>

            </div>

            <div class="text-center mt-8">
              <p class="text-gray-500 text-base md:text-lg mb-5">Clique para salvar o show</p>
              <button onclick="saveShow()" class="bg-green-500 hover:bg-green-600 text-white text-xl md:text-2xl px-10 py-4 rounded-2xl font-medium">
                Salvar Show
              </button>
            </div>

          </div>

        </div>
      </div>
    </div>
  </div>
`;

function openCreateShowModal(date = '') {
  const modal = document.getElementById('createShowModal');
  const dateInput = document.getElementById('showDate');

  modal.classList.remove('hidden');
  document.body.classList.add('overflow-hidden');

  if (date) {
    dateInput.value = date;
  } else {
    dateInput.value = '';
  }
}

function closeCreateShowModal() {
  const modal = document.getElementById('createShowModal');
  modal.classList.add('hidden');
  document.body.classList.remove('overflow-hidden');
}

function attemptCloseModal() {
  const confirmClose = confirm('Deseja mesmo desistir de criar a nova data?');
  if (confirmClose) {
    closeCreateShowModal();
  }
}

document.addEventListener('click', function (event) {
  const backdrop = document.getElementById('modalBackdrop');
  if (backdrop && event.target === backdrop) {
    attemptCloseModal();
  }
});

// 🔥 FUNÇÃO QUE SALVA NO SUPABASE
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

  const { error } = await supabase
    .from('shows')
    .insert([
      {
        data,
        horario,
        cidade,
        estado,
        titulo,
        contratante,
        observacoes
      }
    ])

  if (error) {
    console.error(error)
    alert('Erro ao salvar')
    return
  }

  alert('Show salvo com sucesso!')
  closeCreateShowModal()
}
