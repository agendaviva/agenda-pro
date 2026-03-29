// Importa o cliente do Supabase via CDN
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm'

// Suas credenciais
const supabaseUrl = 'https://hljyiyxdvdkebbcylggm.supabase.co'
const supabaseKey = 'sb_publishable_gMc4tk8Poxf2J9MKF5-_Ng_qCHhk6XD'

// Cria conexão
export const supabase = createClient(supabaseUrl, supabaseKey)
