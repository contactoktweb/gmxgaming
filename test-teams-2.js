const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zobxsyipyhlanigjakel.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LtWwUcSrICiCITc0cxIgJQ_LbHnRYmJ' 

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testFetchTeams2() {
  console.log('Fetching teams with select(id, name, type)...')
  const { data, error } = await supabase.from('teams').select('id, name, type')
  
  if (error) {
    console.log('Error:', error)
  } else {
    console.log('Teams count:', data.length)
    console.log(data)
  }
}

testFetchTeams2()
