import { createClient } from '@supabase/supabase-js';

const URL = 'https://pykaamzuxfljdvkmltnm.supabase.co';
const ANON_KEY = 'sb_publishable_mqnyXss6UkPMlTExvp56JQ_q4QasQQ6';

async function run() {
  const db = createClient(URL, ANON_KEY);
  console.log('Testing with publishable key...');

  const { data, error } = await db.from('aum_house_mass').select('count').limit(1);

  if (error) {
    console.log('Error code:   ', error.code);
    console.log('Error message:', error.message);
    if (error.message.includes('does not exist')) {
      console.log('\n✓ CONNECTION WORKS — schema not applied yet');
      console.log('  Next step: paste src/db/schema.sql into Supabase SQL Editor and run it');
    } else if (error.message.includes('allowlist')) {
      console.log('\n✗ Still blocked by allowlist — even publishable key is restricted');
    } else {
      console.log('\n? Unexpected error — see above');
    }
  } else {
    console.log('✓ Connected and schema exists! Data:', JSON.stringify(data));
  }
}

run().catch(console.error);
