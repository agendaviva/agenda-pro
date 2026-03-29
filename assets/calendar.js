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
    // garante data limpa (caso venha com T00:00:00)
    const date = show.data.split('T')[0]

    const day = document.querySelector(`[data-date="${date}"]`)

    if (!day) {
      console.log('não achou dia:', date)
      return
    }

    const container = day.querySelector('.events-container')

    if (!container) {
      console.log('sem container no dia')
      return
    }

    const el = document.createElement('div')

    el.className =
      'bg-white border rounded-xl p-2 mt-2 text-sm cursor-pointer hover:bg-red-50 transition'

    el.innerHTML = `
      <p class="font-semibold text-gray-900">
        ${show.horario || ''} - ${show.cidade || ''}/${show.estado || ''}
      </p>
      <p class="text-xs text-gray-500 mt-1">
        ${show.titulo || ''}
      </p>
    `

    // 🔥 clicar para excluir
    el.addEventListener('click', async () => {
      const confirmar = confirm('Deseja excluir esse show?')

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
