require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('profiles')
    .select(`
      id,
      name,
      email,
      avatar_url,
      country:closest_airport,
      created_at,
      player_status,
      discord_handle,
      is_featured,
      contracts(teams(name), status)
    `)
    .eq('is_player', true)
    .order('created_at', { ascending: false });
  console.log("Error:", error);
  console.log("Data length:", data ? data.length : 0);
}
run();
