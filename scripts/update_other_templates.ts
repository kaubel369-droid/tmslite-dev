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

<div class="bill-label" style="margin-top: 30px;">Commodities</div>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 40px; border: 1px solid #e2e8f0;">
    <thead>
        <tr style="background: #f8fafc;">
            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; font-size: 11px;">QTY</th>
            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; font-size: 11px;">TYPE</th>
            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; font-size: 11px;">ITEM DESCRIPTION / CLASS</th>
            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; font-size: 11px;">NMFC #</th>
            <th style="padding: 10px; border-bottom: 2px solid #e2e8f0; font-size: 11px;">WEIGHT</th>
        </tr>
    </thead>
    <tbody>
        {{#each products}}
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px; font-weight: bold;">{{pcs}}</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">{{type}}</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">{{description}} {{#if class}}/ CLASS: {{class}}{{/if}}</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">{{nmfc}}</td>
            <td style="padding: 10px; border-bottom: 1px solid #f1f5f9; font-size: 12px;">{{weight}} LBS</td>
        </tr>
        {{/each}}
    </tbody>
    <tfoot>
        <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="2" style="padding: 10px; text-align: right; font-size: 12px;">TOTALS:</td>
            <td style="padding: 10px; font-size: 12px;">{{total_pallets}} Handling Units</td>
            <td style="padding: 10px;"></td>
            <td style="padding: 10px; font-size: 12px;">{{total_weight}} LBS</td>
        </tr>
    </tfoot>
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

<div style="margin-top: 20px; font-size: 11px; font-weight: bold; text-transform: uppercase;">Commodities</div>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #000; font-size: 12px;">
    <thead>
        <tr style="background: #f8fafc;">
            <th style="padding: 8px; border: 1px solid #000; text-align: left;">QTY</th>
            <th style="padding: 8px; border: 1px solid #000; text-align: left;">TYPE</th>
            <th style="padding: 8px; border: 1px solid #000; text-align: left;">ITEM DESCRIPTION / CLASS</th>
            <th style="padding: 8px; border: 1px solid #000; text-align: left;">NMFC #</th>
            <th style="padding: 8px; border: 1px solid #000; text-align: left;">WEIGHT</th>
        </tr>
    </thead>
    <tbody>
        {{#each products}}
        <tr>
            <td style="padding: 8px; border: 1px solid #000; font-weight: bold;">{{pcs}}</td>
            <td style="padding: 8px; border: 1px solid #000;">{{type}}</td>
            <td style="padding: 8px; border: 1px solid #000;">{{description}} {{#if class}}/ CLASS: {{class}}{{/if}}</td>
            <td style="padding: 8px; border: 1px solid #000;">{{nmfc}}</td>
            <td style="padding: 8px; border: 1px solid #000;">{{weight}} LBS</td>
        </tr>
        {{/each}}
    </tbody>
    <tfoot>
        <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="2" style="padding: 8px; border: 1px solid #000; text-align: right;">TOTALS:</td>
            <td style="padding: 8px; border: 1px solid #000;">{{total_pallets}} Handling Units</td>
            <td style="padding: 8px; border: 1px solid #000;"></td>
            <td style="padding: 8px; border: 1px solid #000;">{{total_weight}} LBS</td>
        </tr>
    </tfoot>
</table>

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

<div style="margin-top: 30px; font-size: 12px; font-weight: bold; color: #64748b; margin-bottom: 5px;">COMMODITY DETAILS</div>
<table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; border: 1px solid #e2e8f0; font-size: 12px;">
    <thead>
        <tr style="background: #f8fafc;">
            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">QTY</th>
            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">TYPE</th>
            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">ITEM DESCRIPTION / CLASS</th>
            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">NMFC #</th>
            <th style="padding: 10px; border: 1px solid #e2e8f0; text-align: left;">WEIGHT</th>
        </tr>
    </thead>
    <tbody>
        {{#each products}}
        <tr>
            <td style="padding: 10px; border: 1px solid #e2e8f0; font-weight: bold;">{{pcs}}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">{{type}}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">{{description}} {{#if class}}/ CLASS: {{class}}{{/if}}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">{{nmfc}}</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">{{weight}} LBS</td>
        </tr>
        {{/each}}
    </tbody>
    <tfoot>
        <tr style="background: #f8fafc; font-weight: bold;">
            <td colspan="2" style="padding: 10px; border: 1px solid #e2e8f0; text-align: right;">TOTALS:</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">{{total_pallets}} Handling Units</td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;"></td>
            <td style="padding: 10px; border: 1px solid #e2e8f0;">{{total_weight}} LBS</td>
        </tr>
    </tfoot>
</table>

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
`,
    'customer-rate-quote-ltl': `
<style>
    body { font-family: Inter, sans-serif; padding: 40px; color: #334155; }
    .quote-box { border: 1px solid #e2e8f0; border-radius: 16px; padding: 32px; background: white; }
    .tag { display: inline-block; background: #e0e7ff; color: #4338ca; font-size: 10px; font-weight: 800; padding: 4px 10px; border-radius: 99px; text-transform: uppercase; margin-bottom: 12px; }
    .quote-title { font-size: 28px; font-weight: 800; color: #1e293b; margin-bottom: 32px; }
    .route { display: flex; align-items: center; gap: 24px; margin-bottom: 40px; border-bottom: 1px solid #f1f5f9; padding-bottom: 24px; }
    .location { flex: 1; }
    .loc-label { font-size: 11px; font-weight: bold; color: #94a3b8; text-transform: uppercase; margin-bottom: 4px; }
    .loc-val { font-size: 16px; font-weight: 700; color: #1e293b; }
    .rate-display { background: #f8fafc; border-radius: 12px; padding: 24px; display: flex; justify-content: space-between; align-items: center; }
</style>

<div class="quote-box">
    <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px;">
        <div>
            {{#if logo_url}}
            <img src="{{logo_url}}" style="max-height: 50px; display: block;" />
            {{/if}}
        </div>
        <div style="text-align: right;">
            <div class="tag">Standard LTL Quote</div>
            <div class="quote-title" style="margin-bottom: 0;">Rate Quotation #{{quote_number}}</div>
        </div>
    </div>

    <div class="route">
        <div class="location">
            <div class="loc-label">Origin</div>
            <div class="loc-val">{{shipper_name}}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">{{shipper_address}}</div>
        </div>
        <div style="font-size: 24px; color: #cbd5e1;">&rarr;</div>
        <div class="location">
            <div class="loc-label">Destination</div>
            <div class="loc-val">{{consignee_name}}</div>
            <div style="font-size: 13px; color: #64748b; margin-top: 4px;">{{consignee_address}}</div>
        </div>
    </div>

    <div style="margin-bottom: 24px;">
        <div class="loc-label">Carrier</div>
        <div style="font-size: 16px; font-weight: 700;">{{carrier_name}}</div>
    </div>

    <div style="margin-bottom: 32px;">
        <div class="loc-label">Shipment Details</div>
        <div style="font-size: 14px; margin-bottom: 12px;"><strong>Weight:</strong> {{total_weight}} LBS | <strong>Handling Units:</strong> {{total_pallets}}</div>
        
        <table style="width: 100%; border-collapse: collapse; margin-top: 5px; background: white;">
            <thead>
                <tr style="font-size: 10px; color: #94a3b8; border-bottom: 1px solid #e2e8f0;">
                    <th style="padding: 5px; text-align: left;">QTY</th>
                    <th style="padding: 5px; text-align: left;">TYPE</th>
                    <th style="padding: 5px; text-align: left;">CLASS</th>
                    <th style="padding: 5px; text-align: right;">WEIGHT</th>
                    <th style="padding: 5px; text-align: right;">DIMS</th>
                </tr>
            </thead>
            <tbody>
                {{#each products}}
                <tr style="font-size: 12px; border-bottom: 1px solid #f1f5f9;">
                    <td style="padding: 5px;">{{pcs}}</td>
                    <td style="padding: 5px;">{{type}}</td>
                    <td style="padding: 5px;">{{class}}</td>
                    <td style="padding: 5px; text-align: right;">{{weight}} lbs</td>
                    <td style="padding: 5px; text-align: right;">{{length}}x{{width}}x{{height}}</td>
                </tr>
                {{/each}}
            </tbody>
        </table>
    </div>

    <div style="margin-bottom: 32px;">
        <div class="loc-label">Accessorials</div>
        <div style="font-size: 14px;">
            {{#if accessorials_text}}
            {{accessorials_text}}
            {{else}}
            <span style="font-size: 12px; color: #94a3b8; font-style: italic;">No accessorials selected.</span>
            {{/if}}
        </div>
    </div>

    <div class="rate-display">
        <div>
            <div style="font-size: 13px; font-weight: 600; color: #64748b;">All-In Estimated Rate</div>
            <div style="font-size: 12px; color: #94a3b8; margin-top: 2px;">Subject to re-weigh and re-class</div>
        </div>
        <div style="font-size: 36px; font-weight: 800; color: #4338ca;">{{customer_rate}}</div>
    </div>

    <div style="margin-top: 32px; font-size: 11px; color: #94a3b8; line-height: 1.5;">
        Quote provided by {{company_name}}. Rates are valid for 7 days. Standard transit times apply.
    </div>
</div>
`,
    'customer-spot-rate-quote': `
<style>
    body { font-family: sans-serif; padding: 40px; color: #1e293b; background: #f1f5f9; }
    .card { background: white; border-radius: 12px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); padding: 40px; max-width: 800px; margin: 0 auto; border-top: 6px solid #6366f1; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 30px; }
    .quote-id { font-size: 12px; font-weight: 800; color: #6366f1; background: #e0e7ff; padding: 4px 12px; border-radius: 99px; }
    .title { font-size: 28px; font-weight: 800; margin: 15px 0; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; }
    .label { font-size: 11px; font-weight: bold; text-transform: uppercase; color: #94a3b8; margin-bottom: 5px; }
    .val { font-size: 15px; font-weight: 600; }
    .rate-section { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: right; }
    .price { font-size: 48px; font-weight: 900; color: #1e293b; }
</style>

<div class="card">
    <div class="header">
        <div>
            {{#if logo_url}}
            <img src="{{logo_url}}" style="max-height: 50px; display: block; margin-bottom: 15px;" />
            {{/if}}
            <span class="quote-id">SPOT QUOTE #{{quote_number}}</span>
            <h1 class="title">Rate Proposal</h1>
        </div>
        <div style="text-align: right;">
            <div style="font-weight: bold;">{{company_name}}</div>
            <div style="font-size: 13px; color: #64748b;">Date: {{quote_date}}</div>
            <div style="font-size: 13px; color: #64748b;">Valid until: 24 Hours from now</div>
        </div>
    </div>

    <div class="details">
        <div>
            <div class="label">Origin</div>
            <div class="val">{{shipper_name}}</div>
            <div style="font-size: 13px; color: #64748b;">{{shipper_address}}</div>
        </div>
        <div>
            <div class="label">Destination</div>
            <div class="val">{{consignee_name}}</div>
            <div style="font-size: 13px; color: #64748b;">{{consignee_address}}</div>
        </div>
    </div>

    <div style="margin-top: 30px;">
        <div class="label">Carrier</div>
        <div class="val">{{carrier_name}}</div>
    </div>

    <div style="margin-top: 30px;">
        <div class="label">Products</div>
        <div class="val">
            <table style="width: 100%; border-collapse: collapse; margin-top: 5px; background: white;">
                <thead>
                    <tr style="font-size: 10px; color: #94a3b8; border-bottom: 1px solid #e2e8f0;">
                        <th style="padding: 5px; text-align: left;">QTY</th>
                        <th style="padding: 5px; text-align: left;">TYPE</th>
                        <th style="padding: 5px; text-align: left;">DESC</th>
                        <th style="padding: 5px; text-align: right;">WT</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each products}}
                    <tr style="font-size: 12px; border-bottom: 1px solid #f1f5f9;">
                        <td style="padding: 5px;">{{pcs}}</td>
                        <td style="padding: 5px;">{{type}}</td>
                        <td style="padding: 5px;">{{description}}</td>
                        <td style="padding: 5px; text-align: right;">{{weight}} lbs</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
    </div>

    <div style="margin-top: 20px;">
        <div class="label">Accessorials</div>
        <div class="val">
            {{#if accessorials_text}}
            {{accessorials_text}}
            {{else}}
            <span style="font-size: 12px; font-weight: normal; font-style: italic; color: #94a3b8;">None</span>
            {{/if}}
        </div>
    </div>

    <div style="margin-top: 20px;">
        <div class="label">Additional Instructions</div>
        <div class="val" style="font-weight: normal; font-style: italic;">{{additional_instructions}}</div>
    </div>

    <div class="rate-section">
        <div class="label">All-In Spot Rate</div>
        <div class="price">{{customer_rate}}</div>
    </div>
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
    process.exit(0);
}

main().catch(console.error);
