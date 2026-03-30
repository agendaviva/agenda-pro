import { supabase } from './supabase.js'

const container = document.getElementById('create-show-modal-container')

window.openCreateShowModal = function (date = null, show = null) {
  const isEdit = !!show

  const dataAtual = show?.data || date || ''
  const tituloAtual = show?.titulo || ''
  const horarioAtual = show?.horario || ''
  const cidadeAtual = show?.cidade || ''
  const estadoAtual = show?.estado || ''
  const contratanteAtual = show?.contratante || ''
  const statusAtual = show?.status || 'reserva'
  const valorAtual = show?.valor ?? ''

  container.innerHTML = `
    <div class="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div class="bg-white w-full max-w-md rounded-2xl p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <h2 class="text-xl font-bold mb-4">
          ${isEdit ? 'Editar Show' : 'Novo Show'}
        </h2>

        <form id="show-form" class="space-y-4">

          <!-- DATA -->
          <input
            type="date"
            id="data"
            value="${dataAtual}"
            class="w-full border rounded-xl px-4 py-3"
            required
          />

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

          <!-- ESTADO -->
          <select id="estado" class="w-full border rounded-xl px-4 py-3 bg-white">
            <option value="">Selecione o estado</option>
            ${[
              ['AC', 'Acre'], ['AL', 'Alagoas'], ['AP', 'Amapá'], ['AM', 'Amazonas'],
              ['BA', 'Bahia'], ['CE', 'Ceará'], ['DF', 'Distrito Federal'],
              ['ES', 'Espírito Santo'], ['GO', 'Goiás'], ['MA', 'Maranhão'],
              ['MT', 'Mato Grosso'], ['MS', 'Mato Grosso do Sul'],
              ['MG', 'Minas Gerais'], ['PA', 'Pará'], ['PB', 'Paraíba'],
              ['PR', 'Paraná'], ['PE', 'Pernambuco'], ['PI', 'Piauí'],
              ['RJ', 'Rio de Janeiro'], ['RN', 'Rio Grande do Norte'],
              ['RS', 'Rio Grande do Sul'], ['RO', 'Rondônia'], ['RR', 'Roraima'],
              ['SC', 'Santa Catarina'], ['SP', 'São Paulo'], ['SE', 'Sergipe'],
              ['TO', 'Tocantins']
            ].map(([uf, nome]) => `
              <option value="${uf}" ${estadoAtual === uf ? 'selected' : ''}>
                ${nome}
              </option>
            `).join('')}
          </select>

          <!-- CONTRATANTE -->
          <input
            type="text"
            id="contratante"
            placeholder="Contratante"
            value="${contratanteAtual}"
            class="w-full border rounded-xl px-4 py-3"
          />

          <!-- STATUS -->
          <select id="status" class="w-full border rounded-xl px-4 py-3 bg-white">
            <option value="reserva" ${statusAtual === 'reserva' ? 'selected' : ''}>Reserva</option>
            <option value="confirmado" ${statusAtual === 'confirmado' ? 'selected' : ''}>Confirmado</option>
          </select>

          <!-- VALOR -->
          <input
            type="number"
            id="valor"
            placeholder="Valor do show (R$)"
            value="${valorAtual}"
            class="w-full border rounded-xl px-4 py-3"
            step="0.01"
            min="0"
          />

          <!-- BOTÕES -->
          <div class="flex gap-2 mt-4">
            <button
              type="submit"
              class="flex-1 bg-green-600 text-white py-3 rounded-xl font-medium"
            >
              Salvar
            </button>

            <button
              type="button"
              id="cancel-btn"
              class="flex-1 bg-gray-200 py-3 rounded-xl font-medium"
            >
              Cancelar
            </button>
          </div>

          ${isEdit ? `
            <button
              type="button"
              id="delete-btn"
              class="w-full bg-red-600 text-white py-3 rounded-xl font-medium"
            >
              Excluir show
            </button>
          ` : ''}
        </form>
      </div>
    </div>
  `

  document.getElementById('cancel-btn').onclick = () => {
    container.innerHTML = ''
  }

  if (isEdit) {
    document.getElementById('delete-btn').onclick = async () => {
      const confirmou = confirm('Tem certeza que deseja excluir este show?')

      if (!confirmou) return

      const { error } = await supabase
        .from('shows')
        .delete()
        .eq('id', show.id)

      if (error) {
        alert('Erro ao excluir show: ' + error.message)
        return
      }

      container.innerHTML = ''
      window.dispatchEvent(new Event('showsChanged'))
    }
  }

  document.getElementById('show-form').onsubmit = async (e) => {
    e.preventDefault()

    const data = document.getElementById('data').value
    const titulo = document.getElementById('titulo').value.trim()
    const horario = document.getElementById('horario').value
    const cidade = document.getElementById('cidade').value.trim()
    const estado = document.getElementById('estado').value
    const contratante = document.getElementById('contratante').value.trim()
    const status = document.getElementById('status').value
    const valorInput = document.getElementById('valor').value

    const valor = valorInput === '' ? null : Number(valorInput)
    const activeProjectId = localStorage.getItem('activeProjectId')

    if (!activeProjectId) {
      alert('Projeto não selecionado')
      return
    }

    if (!data) {
      alert('Informe a data do show')
      return
    }

    if (!titulo) {
      alert('Informe o título do show')
      return
    }

    if (isNaN(valor) && valorInput !== '') {
      alert('Valor inválido')
      return
    }

    const payload = {
      data,
      titulo,
      horario,
      cidade,
      estado,
      contratante,
      status,
      valor
    }

    let error = null

    if (isEdit) {
      const response = await supabase
        .from('shows')
        .update(payload)
        .eq('id', show.id)

      error = response.error
    } else {
      const response = await supabase
        .from('shows')
        .insert({
          ...payload,
          project_id: activeProjectId
        })

      error = response.error
    }

    if (error) {
      alert('Erro ao salvar show: ' + error.message)
      return
    }

    container.innerHTML = ''
    window.dispatchEvent(new Event('showsChanged'))
  }
}
