const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zobxsyipyhlanigjakel.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LtWwUcSrICiCITc0cxIgJQ_LbHnRYmJ' // Note: publishable key from env

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLogin() {
  console.log('Testing login...')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'mordon@gmxgaming.com',
    password: '123456',
  })

  if (error) {
    console.log('Login error:', error)
  } else {
    console.log('Login success:', data)
  }
}

testLogin()
