import { getServiceRoleClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';
import { processTemplate, getFullAddress } from '@/lib/print-utils';

const DEFAULT_TEMPLATES: Record<string, string> = {
    'bol': `
<style>
    body { font-family: 'Inter', sans-serif; padding: 0; color: #1e293b; font-size: 11px; line-height: 1.5; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; border-bottom: 2px solid #0f172a; padding-bottom: 10px; }
    .title { font-size: 28px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em; }
    .load-info { font-size: 14px; font-weight: 700; color: #1e293b; margin-top: 4px; }
    .company-info { text-align: right; }
    .company-name { font-size: 20px; font-weight: 800; color: #0f172a; }
    .date-info { font-size: 12px; color: #64748b; margin-top: 2px; }
    
    .preamble { font-size: 9px; line-height: 1.3; margin-bottom: 20px; color: #475569; border: 1px solid #e2e8f0; padding: 10px; background: #f8fafc; border-radius: 4px; }
    
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-bottom: 25px; }
    .section-title { font-size: 10px; font-weight: 800; text-transform: uppercase; color: #64748b; margin-bottom: 6px; border-bottom: 1px solid #f1f5f9; padding-bottom: 4px; }
    .section-content { font-size: 13px; font-weight: 600; color: #0f172a; }
    .section-address { font-size: 13px; color: #475569; font-weight: 400; margin-top: 2px; }

    table { width: 100%; border-collapse: collapse; margin-top: 10px; border: 1px solid #0f172a; }
    th { text-align: left; background: #f8fafc; border: 1px solid #0f172a; padding: 8px 10px; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #1e293b; }
    td { padding: 8px 10px; border: 1px solid #0f172a; font-size: 12px; color: #1e293b; }
    .text-right { text-align: right; }
    .font-bold { font-weight: 700; }
    
    .special-instructions { margin-top: 20px; padding: 12px; border: 1px solid #e2e8f0; font-size: 11px; border-radius: 4px; }
    
    .liability-grid { display: grid; grid-template-columns: 1fr 300px; gap: 0; margin-top: 20px; border: 1px solid #0f172a; }
    .liability-section { padding: 12px; }
    .declared-value { border-left: 2px solid #0f172a; padding: 12px; }
    
    .cert-text { font-size: 9px; font-style: italic; color: #475569; margin-top: 15px; text-align: center; }
    
    .signature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 60px; margin-top: 60px; }
    .sig-line { border-top: 2px solid #0f172a; padding-top: 6px; }
    .sig-label { font-weight: 800; font-size: 10px; text-transform: uppercase; }
    .sig-sub { font-size: 9px; color: #64748b; margin-top: 2px; }
    
    .footer { margin-top: 40px; font-size: 9px; color: #94a3b8; text-align: center; border-top: 1px solid #f1f5f9; padding-top: 15px; }
</style>

<div class="header">
    <div>
        <div class="title">BILL OF LADING</div>
        <div class="load-info">LOAD #: {{load_number}}</div>
    </div>
    <div class="company-info">
        <div class="company-name">{{company_name}}</div>
        <div class="date-info">Date: {{pickup_date}}</div>
    </div>
</div>

<div class="grid">
    <div>
        <div class="section-title">Shipper (From)</div>
        <div class="section-content">{{shipper_name}}</div>
        <div class="section-address">{{shipper_address}}</div>
    </div>
    <div>
        <div class="section-title">Consignee (To)</div>
        <div class="section-content">{{consignee_name}}</div>
        <div class="section-address">{{consignee_address}}</div>
    </div>
</div>

<table>
    <thead>
        <tr>
            <th style="width: 80px;">QTY</th>
            <th style="width: 80px;">TYPE</th>
            <th>ITEM DESCRIPTION / CLASS</th>
            <th style="width: 100px;">NMFC #</th>
            <th style="width: 120px;">WEIGHT</th>
            <th style="width: 60px;">HM</th>
        </tr>
    </thead>
    <tbody>
        {{#each products}}
        <tr>
            <td class="font-bold">{{pcs}}</td>
            <td>{{type}}</td>
            <td>{{description}} {{#if class}}/ CLASS: {{class}}{{/if}}</td>
            <td>{{nmfc}}</td>
            <td>{{weight}} LBS</td>
            <td style="text-align: center;"></td>
        </tr>
        {{/each}}
    </tbody>
    <tfoot>
        <tr style="font-weight: 800; background: #f8fafc;">
            <td colspan="2" class="text-right">TOTALS:</td>
            <td class="font-bold">{{total_pallets}} Handling Units</td>
            <td></td>
            <td class="font-bold">{{total_weight}} LBS</td>
            <td></td>
        </tr>
    </tfoot>
</table>

<div class="special-instructions">
    <strong>Special Instructions:</strong> {{bol_notes}}
</div>

<div class="liability-grid">
    <div class="liability-section">
        <div class="section-title" style="border: none;">Liability Limitation</div>
        <div style="font-size: 10px; color: #475569;">{{liability_statement}}</div>
    </div>
    <div class="declared-value">
        <div class="section-title" style="border: none;">Declared Value</div>
        <div style="font-size: 14px; font-weight: 700; margin-top: 10px;">$ <span style="border-bottom: 1px dashed #cbd5e1; display: inline-block; width: 150px;">&nbsp;</span></div>
    </div>
</div>

<div class="preamble" style="margin-top: 20px;">
    {{standard_preamble}}
</div>

<div class="cert-text">
    {{shipper_certification}}
</div>

<div class="signature-grid">
    <div>
        <div class="sig-line">
            <span class="sig-label">Shipper Signature / Date</span>
            <div class="sig-sub">Property described above is received in good order.</div>
        </div>
    </div>
    <div>
        <div class="sig-line">
            <span class="sig-label">Carrier Signature / Date</span>
            <div class="sig-sub">Driver signature confirms unit count and condition.</div>
        </div>
    </div>
</div>

<div class="footer">
    Generated by {{company_name}} TMS. PRO: {{pro_number}} | BOL: {{bol_number}}
</div>
`,
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
    .items-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; margin-top: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; }
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
            {{#if shipper_name}}<div class="val">{{shipper_name}}</div>{{/if}}
            <div style="font-size: 13px; color: #64748b;">{{shipper_address}}</div>
        </div>
        <div>
            <div class="label">Destination</div>
            {{#if consignee_name}}<div class="val">{{consignee_name}}</div>{{/if}}
            <div style="font-size: 13px; color: #64748b;">{{consignee_address}}</div>
        </div>
    </div>

    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 40px; margin-top: 30px;">
        <div>
            <div class="label">Shipment Type</div>
            <div class="val">{{shipment_type}}</div>
        </div>
        <div>
            <div class="label">Carrier</div>
            <div class="val">{{carrier_name}}</div>
        </div>
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

<div style="margin-top: 20px;">
    <strong>EQUIPMENT REQUIRED:</strong> 53' Dry Van
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
    <tr>
        <td style="font-weight: bold;">AGREED CARRIER RATE</td>
        <td style="text-align: right; font-weight: bold; font-size: 18px;">{{carrier_rate}}</td>
    </tr>
</table>

<div style="margin-top: 30px; border: 1px solid #000; padding: 15px; font-size: 11px;">
    <strong>CARRIER INSTRUCTIONS:</strong><br>
    - Driver must call upon arrival and departure of all stops.<br>
    - All paperwork must be submitted via the TMS portal within 24 hours of delivery.<br>
    - No double brokering allowed.
</div>
`
};

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const type = searchParams.get('type'); // 'quote', 'spot-quote', or 'load'
    const templateSlugParam = searchParams.get('template'); // For 'load' type

    if (!id || !type) {
        return new Response('Missing id or type', { status: 400 });
    }

    const supabase = getServiceRoleClient();

    // Get organization ID and name
    const { data: org } = await supabase.from('organizations').select('id, name').limit(1).single();
    if (!org) {
        return new Response('Organization not found', { status: 404 });
    }

    let templateSlug = '';
    if (type === 'quote') {
        templateSlug = 'customer-rate-quote-ltl';
    } else if (type === 'spot-quote') {
        templateSlug = 'customer-spot-rate-quote';
    } else if (type === 'load') {
        templateSlug = templateSlugParam || 'bol';
    }
    
    // Attempt to fetch template from DB
    const { data: dbTemplate } = await supabase
        .from('document_templates')
        .select('content')
        .eq('org_id', org.id)
        .eq('slug', templateSlug)
        .single();

    const templateContent = dbTemplate?.content || DEFAULT_TEMPLATES[templateSlug];

    if (!templateContent) {
        return new Response('Template not found', { status: 404 });
    }

    // Fetch company logo
    const { data: logoSetting } = await supabase
        .from('settings')
        .select('setting_value')
        .eq('org_id', org.id)
        .eq('setting_key', 'company_logo')
        .single();
    
    const logo_url = (logoSetting?.setting_value as any)?.url || null;

    let printData: any = {
        company_name: org.name,
        logo_url,
        standard_preamble: "The property described below, in apparent good order, except as noted (contents and condition of contents of packages unknown) marked, consigned, and destined as shown below, which said carrier agrees to carry to its usual place of delivery at said destination...",
        liability_statement: "The carrier shall not be liable for any loss or damage to property except as provided in the Bill of Lading. Liability for loss or damage is limited to the lesser of the actual value, the replacement cost, or the specific dollar amount per pound set forth in the carrier's tariff.",
        shipper_certification: "This is to certify that the above named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation according to the applicable regulations of the Department of Transportation."
    };

    if (type === 'quote') {
        const { data: quote } = await supabase.from('quotes').select('*').eq('id', id).single();
        if (!quote) return new Response('Quote not found', { status: 404 });

        // Get accessorials names if available
        let accessorials_names: string[] = [];
        if (quote.accessorials && quote.accessorials.length > 0) {
            const { data: accs } = await supabase
                .from('accessorials')
                .select('name')
                .in('id', quote.accessorials);
            accessorials_names = accs?.map(a => a.name) || [];
        }

        printData = {
            ...printData,
            quote_number: quote.quote_number,
            carrier_name: quote.carrier_name || 'Carrier',
            shipper_name: quote.origin_info?.name || 'Shipper',
            shipper_address: getFullAddress(quote.origin_info),
            consignee_name: quote.destination_info?.name || 'Consignee',
            consignee_address: getFullAddress(quote.destination_info),
            total_weight: quote.items?.reduce((acc: number, item: any) => acc + (Number(item.weight) || 0), 0) || 0,
            total_pallets: quote.items?.reduce((acc: number, item: any) => acc + (Number(item.pcs) || 0), 0) || 0,
            products: quote.items || [],
            accessorials_names,
            accessorials_text: accessorials_names.join(', '),
            customer_rate: `$${Number(quote.customer_rate).toFixed(2)}`
        };
    } else if (type === 'spot-quote') {
        const { data: spotQuote } = await supabase
            .from('customer_spot_quotes')
            .select(`
                *,
                shipper:shipper_consignees!shipper_location_id(*),
                consignee:shipper_consignees!consignee_location_id(*),
                carriers!carrier_id(id, name)
            `)
            .eq('id', id)
            .single();
        
        if (!spotQuote) return new Response('Spot quote not found', { status: 404 });

        // Safely extract carrier name
        const carrierData = (spotQuote as any).carriers;
        const carrier_name = carrierData 
            ? (Array.isArray(carrierData) ? carrierData[0]?.name : (carrierData as any).name)
            : 'Not Assigned';

        // Get accessorials names if available
        let accessorials_names: string[] = [];
        if (spotQuote.accessorials && spotQuote.accessorials.length > 0) {
            const { data: accs } = await supabase
                .from('accessorials')
                .select('name')
                .in('id', spotQuote.accessorials);
            accessorials_names = accs?.map(a => a.name) || [];
        }

        printData = {
            ...printData,
            quote_number: spotQuote.quote_number,
            quote_date: new Date(spotQuote.quote_date).toLocaleDateString(),
            shipper_name: spotQuote.shipper?.name || '',
            shipper_address: spotQuote.shipper 
                ? getFullAddress(spotQuote.shipper) 
                : (spotQuote.shipper_zip ? `${spotQuote.shipper_city}, ${spotQuote.shipper_state} ${spotQuote.shipper_zip}` : ''),
            consignee_name: spotQuote.consignee?.name || '',
            consignee_address: spotQuote.consignee 
                ? getFullAddress(spotQuote.consignee) 
                : (spotQuote.consignee_zip ? `${spotQuote.consignee_city}, ${spotQuote.consignee_state} ${spotQuote.consignee_zip}` : ''),
            carrier_name,
            shipment_type: spotQuote.shipment_type || 'LTL',
            pcs: spotQuote.pcs,
            type: spotQuote.type || 'Pallets',
            weight: spotQuote.weight,
            cubic_ft: spotQuote.cubic_ft,
            products: spotQuote.products || [],
            accessorials_names,
            accessorials_text: accessorials_names.join(', '),
            additional_instructions: spotQuote.additional_instructions || 'None',
            customer_rate: `$${Number(spotQuote.rate).toFixed(2)}`
        };
    } else if (type === 'load') {
        const { data: load } = await supabase
            .from('loads')
            .select(`
                *,
                customer:customers(company_name),
                shipper:shipper_consignees!shipper_id(*),
                consignee:shipper_consignees!consignee_id(*),
                load_products(*)
            `)
            .eq('id', id)
            .single();
        
        if (!load) return new Response('Load not found', { status: 404 });

        printData = {
            ...printData,
            load_number: load.load_number,
            bol_number: load.bol_number || 'N/A',
            carrier_pro_number: load.carrier_pro_number || 'N/A',
            pro_number: load.carrier_pro_number || 'N/A', // Alias
            pickup_date: load.pickup_date ? new Date(load.pickup_date).toLocaleDateString() : 'TBD',
            delivery_date: load.delivery_date ? new Date(load.delivery_date).toLocaleDateString() : 'TBD',
            customer_name: load.customer?.company_name || 'Customer',
            shipper_name: load.shipper?.name || 'Shipper',
            shipper_address: getFullAddress(load.shipper),
            consignee_name: load.consignee?.name || 'Consignee',
            consignee_address: getFullAddress(load.consignee),
            total_weight: load.total_weight || 0,
            total_pallets: load.total_pallets || 0,
            customer_rate: `$${Number(load.customer_rate || 0).toFixed(2)}`,
            carrier_rate: `$${Number(load.carrier_rate || 0).toFixed(2)}`,
            bol_notes: load.bol_notes || 'None',
            standard_preamble: 'RECEIVED, subject to the classifications and tariffs in effect on the date of the issue of this Bill of Lading, the property described below, in apparent good order, except as noted (contents and condition of contents of packages unknown), marked, consigned, and destined as indicated below, which said carrier (the word carrier being understood throughout this contract as meaning any person or corporation in possession of the property under the contract) agrees to carry to its usual place of delivery at said destination...',
            shipper_certification: 'This is to certify that the above named materials are properly classified, described, packaged, marked and labeled, and are in proper condition for transportation according to the applicable regulations of the Department of Transportation.',
            liability_statement: 'Unless the shipper declares a higher value and pays the applicable surcharge, carrier liability for loss or damage is limited to $0.50 per pound per package.',
            products: (load.load_products || []).map((p: any) => ({
                ...p,
                pcs: p.pcs || p.pallets,
                type: p.unit_type,
                class: p.nmfc_class,
                nmfc: p.nmfc_class
            }))
        };
    }

    const html = processTemplate(templateContent, printData);

    const fullHtml = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Print Document ${id}</title>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
    <style>
        body { 
            margin: 0; 
            padding: 0; 
            background-color: #f1f5f9; 
            display: flex; 
            justify-content: center; 
            padding-top: 40px;
            padding-bottom: 40px;
        }
        .paper {
            background-color: white;
            width: 8.5in;
            min-height: 11in;
            padding: 0.5in;
            box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
            border-radius: 4px;
            box-sizing: border-box;
        }
        @media print {
            body { background-color: white; padding: 0; display: block; }
            .paper { box-shadow: none; width: 100%; border-radius: 0; padding: 0.5in; }
            @page { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="paper">
        ${html}
    </div>
    <script>
        window.onload = function() {
            setTimeout(() => {
                window.print();
            }, 500);
        };
    </script>
</body>
</html>
    `;

    return new Response(fullHtml, {
        headers: {
            'Content-Type': 'text/html',
        },
    });
}
