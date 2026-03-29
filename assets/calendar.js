import { supabase } from './supabase.js'

async function loadShows() {
  const { data: shows, error } = await supabase
    .from('shows')
    .select('*')

  if (error) {
    alert('Erro ao buscar shows')
    return
  }

  console.log('shows:', shows)

  // 🔥 agrupa por data
  const grouped = {}

  shows.forEach(show => {
    const date = show.data.split('T')[0]

    if (!grouped[date]) {
      grouped[date] = []
    }

    grouped[date].push(show)
  })

  // 🔥 percorre cada dia com evento
  Object.keys(grouped).forEach(date => {
    const day = document.querySelector(`[data-date="${date}"]`)
    if (!day) return

    const container = day.querySelector('.events-container')
    if (!container) return

    // limpa "Sem eventos"
    container.innerHTML = ''

    grouped[date].forEach(show => {
      const el = document.createElement('div')

      el.className =
        'bg-white border rounded-xl p-2 mt-2 text-sm flex justify-between items-start cursor-pointer hover:bg-green-50 transition'

      el.innerHTML = `
        <div>
          <p class="font-semibold text-gray-900">
            ${show.horario || ''} - ${show.cidade || ''}/${show.estado || ''}
          </p>
          <p class="text-xs text-gray-500 mt-1">
            ${show.titulo || ''}
          </p>
        </div>

        <button class="delete-btn text-red-500 hover:text-red-700 text-lg font-bold ml-2">
          🗑️
        </button>
      `

      // 🔥 EDITAR (clicar no card)
      el.addEventListener('click', () => {
        window.openCreateShowModal(null, show)
      })

      // 🔥 EXCLUIR (lixeira)
      const deleteBtn = el.querySelector('.delete-btn')

      deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation()

        const confirmar = confirm('Excluir esse show?')
        if (!confirmar) return

        const { error } = await supabase
          .from('shows')
          .delete()
          .eq('id', show.id)

        if (error) {
          alert('Erro ao excluir')
          return
        }

        location.reload()
      })

      container.appendChild(el)
    })
  })
}

// 🔥 importante pro calendário dinâmico
window.loadShows = loadShows

loadShows()
