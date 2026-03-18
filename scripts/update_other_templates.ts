import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const templates = {
    'customer-invoice': `
<style>
    body { font-family: Inter, sans-serif; padding: 40px; color: #334155; }
    .inv-header { display: flex; justify-content: space-between; margin-bottom: 40px; }
    .inv-title { font-size: 32px; font-weight: 800; color: #1e293b; }
    .bill-to { margin-bottom: 40px; }
    .bill-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 8px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 40px; }
    th { text-align: left; padding: 12px 15px; border-bottom: 2px solid #e2e8f0; font-size: 12px; text-transform: uppercase; color: #64748b; }
    td { padding: 15px; border-bottom: 1px solid #f1f5f9; font-size: 14px; }
    .total-box { margin-left: auto; width: 250px; background: #f8fafc; padding: 20px; border-radius: 12px; }
    .total-row { display: flex; justify-content: space-between; margin-bottom: 10px; }
    .total-grand { border-top: 1px solid #e2e8f0; padding-top: 10px; font-weight: 800; color: #0f172a; font-size: 18px; }
</style>

<div class="inv-header">
    <div>
        {{#if logo_url}}
        <img src="{{logo_url}}" style="max-height: 50px; margin-bottom: 15px; display: block;" />
        {{/if}}
        <div class="inv-title">INVOICE</div>
        <div style="margin-top: 10px; font-weight: 600;"># INV-{{load_number}}</div>
    </div>
    <div style="text-align: right;">
        <div style="font-weight: 800; font-size: 18px;">{{company_name}}</div>
        <div style="font-size: 12px; margin-top: 4px;">Logistics Management Services</div>
    </div>
</div>

<div class="bill-to">
    <div class="bill-label">Bill To</div>
    <div style="font-size: 16px; font-weight: 600;">{{customer_name}}</div>
</div>

<table>
    <thead>
        <tr>
            <th>Service Description</th>
            <th>Reference</th>
            <th style="text-align: right;">Amount</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><strong>Freight Transportation Services</strong><br><span style="font-size: 11px; color: #64748b;">{{shipper_name}} to {{consignee_name}}</span></td>
            <td>{{load_number}}</td>
            <td style="text-align: right; font-weight: 600;">{{customer_rate}}</td>
        </tr>
    </tbody>
</table>

<div class="total-box">
    <div class="total-row">
        <span style="font-size: 12px; color: #64748b;">Subtotal</span>
        <span style="font-weight: 600;">{{customer_rate}}</span>
    </div>
    <div class="total-row">
        <span style="font-size: 12px; color: #64748b;">Tax (0%)</span>
        <span style="font-weight: 600;">$0.00</span>
    </div>
    <div class="total-row total-grand">
        <span>Total Due</span>
        <span>{{customer_rate}}</span>
    </div>
</div>

<div style="margin-top: 60px; font-size: 12px; color: #64748b; line-height: 1.6;">
    <strong>Payment Terms:</strong> Net 30. Please make checks payable to {{company_name}}. Reference Invoice # INV-{{load_number}} on all payments.
</div>
`,
    'customer-load-confirmation': `
<style>
    body { font-family: 'Helvetica', sans-serif; padding: 30px; }
    .conf-header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 3px solid #1e293b; padding-bottom: 20px; margin-bottom: 30px; }
    .conf-logo-container { width: 200px; text-align: left; }
    .conf-title-container { text-align: center; flex-grow: 1; }
    .conf-empty-container { width: 200px; }
    .conf-title { font-size: 26px; font-weight: bold; letter-spacing: 2px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0px; border: 1px solid #000; }
    .info-cell { padding: 10px; border: 0.5px solid #000; }
    .label { font-size: 10px; font-weight: bold; text-transform: uppercase; margin-bottom: 3px; }
    .value { font-size: 13px; font-weight: bold; }
</style>

<div class="conf-header">
    <div class="conf-logo-container">
        {{#if logo_url}}
        <img src="{{logo_url}}" style="max-height: 50px; display: block;" />
        {{/if}}
    </div>
    <div class="conf-title-container">
        <div class="conf-title">CUSTOMER LOAD CONFIRMATION</div>
        <div style="font-size: 14px; margin-top: 5px;">Reference Number: {{load_number}}</div>
    </div>
    <div class="conf-empty-container"></div>
</div>

<div class="info-grid">
    <div class="info-cell">
        <div class="label">Shipper</div>
        <div class="value">{{shipper_name}}</div>
        <div class="value">{{shipper_address}}</div>
    </div>
    <div class="info-cell">
        <div class="label">Consignee</div>
        <div class="value">{{consignee_name}}</div>
        <div class="value">{{consignee_address}}</div>
    </div>
    <div class="info-cell">
        <div class="label">Pickup Date</div>
        <div class="value">{{pickup_date}}</div>
    </div>
    <div class="info-cell">
        <div class="label">Delivery Date</div>
        <div class="value">{{delivery_date}}</div>
    </div>
</div>

<div style="margin-top: 20px; border: 1px solid #000; padding: 15px;">
    <div class="label">Load Description</div>
    <div style="font-size: 13px;">{{total_pallets}} Pallets, {{total_weight}} LBS of General Freight.</div>
</div>

<div style="margin-top: 20px; text-align: right;">
    <div style="font-size: 16px;"><strong>Agreed Rate: {{customer_rate}}</strong></div>
</div>

<div style="margin-top: 40px; font-size: 11px;">
    <p>By accepting this load, the customer agrees to the terms and conditions set forth by {{company_name}}.</p>
</div>
`,
    'carrier-load-confirmation': `
<style>
    body { font-family: sans-serif; padding: 30px; }
    .header { display: flex; justify-content: space-between; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .main-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-top: 20px; }
    .stop { border: 1px solid #e2e8f0; padding: 15px; border-radius: 4px; }
    .stop-header { background: #f8fafc; margin: -15px -15px 15px -15px; padding: 10px 15px; border-bottom: 1px solid #e2e8f0; font-weight: bold; }
    .rate-table { width: 100%; border-collapse: collapse; margin-top: 30px; }
    .rate-table td { padding: 10px; border: 1px solid #000; }
</style>

<div class="header">
    <div>
        {{#if logo_url}}
        <img src="{{logo_url}}" style="max-height: 50px; margin-bottom: 15px; display: block;" />
        {{/if}}
        <h1 style="margin: 0;">CARRIER RATE CONFIRMATION</h1>
        <div style="font-size: 14px;">TMS Reference: {{load_number}}</div>
    </div>
    <div style="text-align: right;">
        <strong>{{company_name}}</strong><br>
        Dispatcher: (555) 000-0000
    </div>
</div>

<div class="main-grid">
    <div class="stop">
        <div class="stop-header">PICKUP</div>
        <strong>{{shipper_name}}</strong><br>
        {{shipper_address}}<br>
        Date: {{pickup_date}}
    </div>
    <div class="stop">
        <div class="stop-header">DELIVERY</div>
        <strong>{{consignee_name}}</strong><br>
        {{consignee_address}}<br>
        Date: {{delivery_date}}
    </div>
</div>

<div style="border: 1px solid #e2e8f0; padding: 15px; border-radius: 4px; margin-top: 20px;">
    <h3 style="margin-top: 0; font-size: 12px; color: #64748b;">COMMODITY DETAILS</h3>
    <div style="font-weight: bold; font-size: 16px;">
        {{total_pallets}} Pallets | {{total_weight}} LBS
    </div>
</div>

<table class="rate-table">
    <tr style="background: #f8fafc; font-weight: bold;">
        <td>Description</td>
        <td style="text-align: right; width: 150px;">Amount</td>
    </tr>
    <tr>
        <td>Linehaul Rate</td>
        <td style="text-align: right;">{{carrier_rate}}</td>
    </tr>
    <tr style="font-weight: bold; font-size: 16px;">
        <td style="text-align: right;">TOTAL PAY</td>
        <td style="text-align: right;">{{carrier_rate}}</td>
    </tr>
</table>

<div style="margin-top: 40px; font-size: 11px; color: #475569;">
    <strong>Driver Instructions:</strong> {{bol_notes}}
    <br><br>
    <em>Please sign and return to dispatcher.</em>
</div>
`
};

async function main() {
    for (const [slug, content] of Object.entries(templates)) {
        console.log(`Updating template '${slug}'...`);
        
        const { error } = await supabase
            .from('document_templates')
            .update({ content })
            .eq('slug', slug);
            
        if (error) {
            console.error(`❌ Failed to update ${slug}:`, error.message);
        } else {
            console.log(`✅ Successfully updated ${slug}`);
        }
    }
}

main().catch(console.error);
