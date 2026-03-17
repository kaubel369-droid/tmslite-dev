
export function processTemplate(template: string, data: Record<string, any>): string {
    let result = template;

    // Handle {{#if key}} ... {{else}} ... {{/if}}
    // This is a simple implementation that doesn't support nested ifs
    const ifElseRegex = /{{#if (.*?)}}([\s\S]*?)(?:{{\/else}}([\s\S]*?))?{{\/if}}/g;
    result = result.replace(ifElseRegex, (match, key, ifContent, elseContent) => {
        const value = data[key.trim()];
        const condition = Array.isArray(value) ? value.length > 0 : !!value;
        
        if (condition) {
            return ifContent;
        } else {
            return elseContent || '';
        }
    });

    // Handle {{#each products}} ... {{/each}}
    const productListMatch = result.match(/{{#each products}}([\s\S]*?){{\/each}}/);
    if (productListMatch && data.products && Array.isArray(data.products)) {
        const productTemplate = productListMatch[1];
        const processedProducts = data.products.map((product: any) => {
            let item = productTemplate;
            const itemData = { ...product };

            // Handle {{#if key}} inside loop
            const innerIfRegex = /{{#if (.*?)}}([\s\S]*?)(?:{{\/else}}([\s\S]*?))?{{\/if}}/g;
            item = item.replace(innerIfRegex, (match, key, ifContent, elseContent) => {
                const value = itemData[key.trim()];
                const condition = Array.isArray(value) ? value.length > 0 : !!value;
                return condition ? ifContent : (elseContent || '');
            });

            // Replace keys inside the loop
            Object.keys(itemData).forEach(key => {
                const regex = new RegExp(`{{${key}}}`, 'g');
                const value = itemData[key] !== undefined && itemData[key] !== null ? String(itemData[key]) : '';
                item = item.replace(regex, value);
            });
            return item;
        }).join('');
        result = result.replace(productListMatch[0], processedProducts);
    }

    // Handle {{#each accessorials_names}} ... {{/each}}
    const accListMatch = result.match(/{{#each accessorials_names}}([\s\S]*?){{\/each}}/);
    if (accListMatch && data.accessorials_names && Array.isArray(data.accessorials_names)) {
        const accTemplate = accListMatch[1];
        const processedAccs = data.accessorials_names.map((name: string) => {
            return accTemplate.replace(/{{this}}/g, name);
        }).join('');
        result = result.replace(accListMatch[0], processedAccs);
    }

    // Handle regular placeholders
    Object.keys(data).forEach(key => {
        const value = data[key];
        if (typeof value === 'string' || typeof value === 'number') {
            const regex = new RegExp(`{{${key}}}`, 'g');
            result = result.replace(regex, String(value));
        }
    });

    // Final cleanup of any remaining curly braces that were not replaced
    // result = result.replace(/{{.*?}}/g, '');

    return result;
}

export function getFullAddress(info: any): string {
    if (!info) return '';
    const parts = [];
    if (info.address) parts.push(info.address);
    if (info.city || info.state || info.zip) {
        const cityStateZip = [info.city, info.state, info.zip].filter(Boolean).join(' ');
        if (cityStateZip) parts.push(cityStateZip);
    }
    return parts.join(', ');
}
