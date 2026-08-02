require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
)

async function test() {
  const { data, error } = await supabase.from('validations').select('id').limit(1)
  console.log("Validations table error:", error)
  
  const { data: buckets, error: bError } = await supabase.storage.listBuckets()
  console.log("Buckets:", buckets?.map(b => b.name), "Error:", bError)
}

test()
