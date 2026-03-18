import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials!');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function main() {
    const { data, error } = await supabase
        .from('document_templates')
        .select('*')
        .eq('slug', 'customer-rate-quote-ltl');
        
    if (error) {
        console.error('Error:', error);
    } else {
        console.log(`Found ${data.length} templates for LTL quote.`);
        for (const row of data) {
            console.log(`\n--- Template ID: ${row.id} | Org ID: ${row.org_id} ---`);
            // Check what block is in the template
            const content = row.content || '';
            if (content.includes('accessorials_names')) {
                console.log('CONTAINS accessorials_names loop!');
            }
            if (content.includes('accessorials_text')) {
                console.log('CONTAINS accessorials_text boolean block!');
            }
            
            // Print the accessorials block
            const match = content.match(/<div class="loc-label">Accessorials<\/div>[\s\S]*?<\/div>/);
            if (match) {
                console.log('Block content:', match[0]);
            }
        }
    }
}
main();
