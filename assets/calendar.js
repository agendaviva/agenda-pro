import { supabase } from './supabase.js'

alert('calendar carregou')

const { data: shows, error } = await supabase
  .from('shows')
  .select('*')

if (error) {
  alert('Erro ao buscar')
} else {
  alert(JSON.stringify(shows))
}
