const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zobxsyipyhlanigjakel.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LtWwUcSrICiCITc0cxIgJQ_LbHnRYmJ' 

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignup() {
  console.log('Testing signup...')
  const { data, error } = await supabase.auth.signUp({
    email: 'mordon@gmxgaming.com',
    password: '123456',
  })

  if (error) {
    console.log('Signup error:', error)
  } else {
    console.log('Signup success:', data)
  }
}

testSignup()
