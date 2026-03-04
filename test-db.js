const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
    const { data: customers, error } = await supabase.from('customers').select('*').limit(1);
    console.log("Customers:", customers);
    if (error) console.error("Error:", error);

    if (customers && customers.length > 0) {
        const id = customers[0].id;
        console.log("Fetching by ID:", id);
        const { data: cust, error: e2 } = await supabase.from('customers').select('*').eq('id', id).single();
        console.log("Cust by ID:", cust);
        console.error("Error by ID:", e2);
    }
}
run();
