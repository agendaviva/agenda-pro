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

  shows.forEach(show => {
    const date = show.data.split('T')[0]

    const day = document.querySelector(`[data-date="${date}"]`)
    if (!day) return

    const container = day.querySelector('.events-container')
    if (!container) return

    const el = document.createElement('div')

    el.className =
      'bg-white border rounded-xl p-2 mt-2 text-sm flex justify-between items-start'

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

    // 👉 botão de excluir (lixeira)
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
        console.error(error)
        return
      }

      alert('Show excluído!')
      location.reload()
    })

    container.appendChild(el)
  })
}

loadShows()
