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
    const day = document.querySelector(`[data-date="${show.data}"]`)

    if (!day) {
      console.log('não achou dia:', show.data)
      return
    }

    const container = day.querySelector('.events-container')

    if (!container) {
      console.log('sem container no dia')
      return
    }

    const el = document.createElement('div')
    el.className = 'bg-white border rounded-xl p-2 mt-2 text-sm'

    el.innerHTML = `
      ${show.horario} - ${show.cidade}
    `

    container.appendChild(el)
  })
}

loadShows()
