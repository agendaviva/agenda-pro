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
        
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold">
            ${isEdit ? 'Editar Show' : 'Novo Show'}
          </h2>

          ${
            isEdit
              ? `
                <button
                  type="button"
                  id="delete-btn"
                  class="text-red-600 font-semibold text-sm"
                >
                  Excluir
                </button>
              `
              : ''
          }
        </div>

        <form id="show-form" class="space-y-4">

          <!-- DATA -->
          <div>
            <label for="data" class="block text-sm font-medium text-gray-700 mb-1">
              Data
            </label>
            <input
              type="date"
              id="data"
              value="${dataAtual}"
              class="w-full border rounded-xl px-4 py-3"
              required
            />
          </div>

          <!-- TÍTULO -->
          <div>
            <label for="titulo" class="block text-sm font-medium text-gray-700 mb-1">
              Título
            </label>
            <input
              type="text"
              id="titulo"
              placeholder="Título"
              value="${tituloAtual}"
              class="w-full border rounded-xl px-4 py-3"
              required
            />
          </div>

          <!-- HORÁRIO -->
          <div>
            <label for="horario" class="block text-sm font-medium text-gray-700 mb-1">
              Horário
            </label>
            <input
              type="time"
              id="horario"
              value="${horarioAtual}"
              class="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <!-- CIDADE -->
          <div>
            <label for="cidade" class="block text-sm font-medium text-gray-700 mb-1">
              Cidade
            </label>
            <input
              type="text"
              id="cidade"
              placeholder="Cidade"
              value="${cidadeAtual}"
              class="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <!-- ESTADO -->
          <div>
            <label for="estado" class="block text-sm font-medium text-gray-700 mb-1">
              Estado
            </label>
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
          </div>

          <!-- CONTRATANTE -->
          <div>
            <label for="contratante" class="block text-sm font-medium text-gray-700 mb-1">
              Contratante
            </label>
            <input
              type="text"
              id="contratante"
              placeholder="Contratante"
              value="${contratanteAtual}"
              class="w-full border rounded-xl px-4 py-3"
            />
          </div>

          <!-- STATUS -->
          <div>
            <label for="status" class="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select id="status" class="w-full border rounded-xl px-4 py-3 bg-white">
              <option value="reserva" ${statusAtual === 'reserva' ? 'selected' : ''}>Reserva</option>
              <option value="confirmado" ${statusAtual === 'confirmado' ? 'selected' : ''}>Confirmado</option>
            </select>
          </div>

          <!-- VALOR -->
          <div>
            <label for="valor" class="block text-sm font-medium text-gray-700 mb-1">
              Valor do show
            </label>
            <input
              type="number"
              id="valor"
              placeholder="Valor do show (R$)"
              value="${valorAtual}"
              class="w-full border rounded-xl px-4 py-3"
              step="0.01"
              min="0"
            />
          </div>

          <!-- BOTÕES -->
          <div class="flex gap-2 pt-2">
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

        </form>
      </div>
    </div>
  `

  const cancelBtn = document.getElementById('cancel-btn')
  const form = document.getElementById('show-form')
  const deleteBtn = document.getElementById('delete-btn')

  cancelBtn.onclick = () => {
    container.innerHTML = ''
  }

  if (deleteBtn && isEdit) {
    deleteBtn.onclick = async () => {
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

  form.onsubmit = async (e) => {
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

    if (valorInput !== '' && Number.isNaN(valor)) {
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

    if (isEdit) {
      const { error } = await supabase
        .from('shows')
        .update(payload)
        .eq('id', show.id)

      if (error) {
        alert('Erro ao atualizar show: ' + error.message)
        return
      }
    } else {
      const { error } = await supabase
        .from('shows')
        .insert({
          ...payload,
          project_id: activeProjectId
        })

      if (error) {
        alert('Erro ao criar show: ' + error.message)
        return
      }
    }

    container.innerHTML = ''
    window.dispatchEvent(new Event('showsChanged'))
  }
}
