import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

async function main() {
    const { data, error } = await supabase.from('customer_spot_quotes').select('*').limit(1);
    console.log(data?.[0] ? Object.keys(data[0]) : 'No data');
}
main();
