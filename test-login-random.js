const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zobxsyipyhlanigjakel.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LtWwUcSrICiCITc0cxIgJQ_LbHnRYmJ' 

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testLoginRandom() {
  console.log('Testing login random...')
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test_1786474045767@gmxgaming.com',
    password: 'password123',
  })

  if (error) {
    console.log('Login error:', error)
  } else {
    console.log('Login success:', data)
  }
}

testLoginRandom()
