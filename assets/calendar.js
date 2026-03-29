import { supabase } from './supabase.js'

export async function renderCalendarShows() {
  const { data: shows, error } = await supabase
    .from('shows')
    .select('*')

  if (error) {
    console.error(error)
    return
  }

  console.log('Shows:', shows)
}
