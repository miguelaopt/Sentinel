import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'TUA_URL_DO_SUPABASE'
const supabaseAnonKey = 'TUA_CHAVE_ANON_PUBLIC'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)