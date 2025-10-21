import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://xhhaeahbxdaszixachwz.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhoaGFlYWhieGRhc3ppeGFjaHd6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNDYzMjgsImV4cCI6MjA3NjYyMjMyOH0.LR_Dz7klPdavB6crNY-W3Vr1pRYAxJORl0tnNeC8qTs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)