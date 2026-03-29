import { supabase } from './supabase.js'

export async function renderCalendarShows() {
  const { data: shows, error } = await supabase
    .from('shows')
    .select('*')

  if (error) {
    alert('Erro ao buscar shows')
    return
  }

  // cria uma lista simples na tela
  const div = document.createElement('div')
  div.className = "fixed bottom-4 right-4 bg-white p-4 rounded shadow text-sm max-w-xs"

  div.innerHTML = `
    <strong>Shows carregados:</strong><br>
    ${shows.length} encontrados
  `

  document.body.appendChild(div)
}
