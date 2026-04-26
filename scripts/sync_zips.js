const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const csv = require('csv-parse/sync');
const envContent = fs.readFileSync('.env.local', 'utf-8');
const env = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line && !line.startsWith('#'))
    .map(line => line.split('='))
);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncZips() {
  const csvPath = '/Users/kevinaubel/Library/CloudStorage/GoogleDrive-kaubel369@gmail.com/My Drive/Antigravity/TMSLite_dev/zip_codes_new.csv';
  console.log(`Reading CSV from ${csvPath}...`);
  
  const fileContent = fs.readFileSync(csvPath, 'utf-8');
  const records = csv.parse(fileContent, {
    columns: false,
    skip_empty_lines: true
  });

  console.log(`Parsed ${records.length} records. Syncing to Supabase...`);

  const batchSize = 1000;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize).map(r => ({
      zip: r[0],
      city: r[1],
      state_id: r[2],
      state_name: r[3]
    }));

    console.log(`Upserting batch ${i / batchSize + 1} of ${Math.ceil(records.length / batchSize)}...`);
    
    const { error } = await supabase
      .from('zip_codes')
      .upsert(batch, { onConflict: 'zip,city' });

    if (error) {
      console.error(`Error in batch ${i / batchSize + 1}:`, error.message);
    }
  }

  console.log('Sync complete!');
}

syncZips().catch(err => {
  console.error('Sync failed:', err);
  process.exit(1);
});
