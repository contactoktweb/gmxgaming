const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zobxsyipyhlanigjakel.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LtWwUcSrICiCITc0cxIgJQ_LbHnRYmJ' 

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFetchTeams() {
  console.log('Fetching teams...')
  const { data, error } = await supabase.from('teams').select('*')
  
  if (error) {
    console.log('Error:', error)
  } else {
    console.log('Teams count:', data.length)
    console.log(data)
  }
}

testFetchTeams()
