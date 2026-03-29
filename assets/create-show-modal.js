import { supabase } from './supabase.js'

const container = document.getElementById('create-show-modal-container')

window.openCreateShowModal = function (date = null, show = null) {
  const isEdit = !!show

  const estadoAtual = show?.estado || ''
  const cidadeAtual = show?.cidade || ''
  const tituloAtual = show?.titulo || ''
  const horarioAtual = show?.horario || ''
  const statusAtual = show?.status || 'reserva'

  container.innerHTML = `
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      
      <div class="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">

        <h2 class="text-xl font-bold mb-4">
          ${isEdit ? 'Editar Show' : 'Novo Show'}
        </h2>

        <form id="show-form" class="space-y-4">

          <!-- TÍTULO -->
          <input
            type="text"
            id="titulo"
            placeholder="Título"
            value="${tituloAtual}"
            class="w-full border rounded-xl px-4 py-3"
            required
          />

          <!-- HORÁRIO -->
          <input
            type="time"
            id="horario"
            value="${horarioAtual}"
            class="w-full border rounded-xl px-4 py-3"
          />

          <!-- CIDADE -->
          <input
            type="text"
            id="cidade"
            placeholder="Cidade"
            value="${cidadeAtual}"
            class="w-full border rounded-xl px-4 py-3"
          />

          <!-- ESTADO (NOVO SELECT) -->
          <select id="estado" class="w-full border rounded-xl px-4 py-3 bg-white">
            <option value="">Selecione o estado</option>
            ${[
              ['AC','Acre'],['AL','Alagoas'],['AP','Amapá'],['AM','Amazonas'],
              ['BA','Bahia'],['CE','Ceará'],['DF','Distrito Federal'],
              ['ES','Espírito Santo'],['GO','Goiás'],['MA','Maranhão'],
              ['MT','Mato Grosso'],['MS','Mato Grosso do Sul'],
              ['MG','Minas Gerais'],['PA','Pará'],['PB','Paraíba'],
              ['PR','Paraná'],['PE','Pernambuco'],['PI','Piauí'],
              ['RJ','Rio de Janeiro'],['RN','Rio Grande do Norte'],
              ['RS','Rio Grande do Sul'],['RO','Rondônia'],['RR','Roraima'],
              ['SC','Santa Catarina'],['SP','São Paulo'],['SE','Sergipe'],
              ['TO','Tocantins']
            ].map(([uf, nome]) => `
              <option value="${uf}" ${estadoAtual === uf ? 'selected' : ''}>
                ${nome}
              </option>
            `).join('')}
          </select>

          <!-- STATUS -->
          <select id="status" class="w-full border rounded-xl px-4 py-3">
            <option value="reserva" ${statusAtual === 'reserva' ? 'selected' : ''}>Reserva</option>
            <option value="confirmado" ${statusAtual === 'confirmado' ? 'selected' : ''}>Confirmado</option>
          </select>

          <!-- BOTÕES -->
          <div class="flex gap-2 mt-4">

            <button
              type="submit"
              class="flex-1 bg-green-600 text-white py-3 rounded-xl"
            >
              Salvar
            </button>

            <button
              type="button"
              id="cancel-btn"
              class="flex-1 bg-gray-200 py-3 rounded-xl"
            >
              Cancelar
            </button>

          </div>

        </form>
      </div>
    </div>
  `

  document.getElementById('cancel-btn').onclick = () => {
    container.innerHTML = ''
  }

  document.getElementById('show-form').onsubmit = async (e) => {
    e.preventDefault()

    const titulo = document.getElementById('titulo').value
    const horario = document.getElementById('horario').value
    const cidade = document.getElementById('cidade').value
    const estado = document.getElementById('estado').value
    const status = document.getElementById('status').value

    const activeProjectId = localStorage.getItem('activeProjectId')

    if (!activeProjectId) {
      alert('Projeto não selecionado')
      return
    }

    if (isEdit) {
      await supabase
        .from('shows')
        .update({
          titulo,
          horario,
          cidade,
          estado,
          status
        })
        .eq('id', show.id)
    } else {
      await supabase
        .from('shows')
        .insert({
          titulo,
          horario,
          cidade,
          estado,
          status,
          data: date,
          project_id: activeProjectId
        })
    }

    container.innerHTML = ''

    window.dispatchEvent(new Event('showsChanged'))
  }
}
