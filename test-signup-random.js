const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = 'https://zobxsyipyhlanigjakel.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_LtWwUcSrICiCITc0cxIgJQ_LbHnRYmJ' 

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testSignup2() {
  console.log('Testing signup random...')
  const randomEmail = `test_${Date.now()}@gmxgaming.com`
  const { data, error } = await supabase.auth.signUp({
    email: randomEmail,
    password: 'password123',
  })

  if (error) {
    console.log('Signup error:', error)
  } else {
    console.log('Signup success. Email:', randomEmail)
    console.log('Session is null?', data.session === null)
    console.log('Confirmation sent at:', data.user.confirmation_sent_at)
  }
}

testSignup2()
