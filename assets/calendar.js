import { supabase } from './supabase.js'

export async function loadShows() {
  const { data, error } = await supabase
    .from('shows')
    .select('*')

  if (error) {
    console.error('Erro ao buscar shows:', error)
    return []
  }

  return data
}
