import { processTemplate } from '../src/lib/print-utils';

const template = `
<div>
    {{#if logo_url}}
    <img src="{{logo_url}}" />
    {{/if}}
    <span class="quote-id">SPOT QUOTE #{{quote_number}}</span>
</div>
`;

const data = {
    logo_url: 'http://example.com/logo.png',
    quote_number: 'Q-12345'
};

console.log(processTemplate(template, data));
