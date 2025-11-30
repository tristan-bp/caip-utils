// src/caip2.js
import { parseStellarCAIP2 } from './namespaces/stellar/stellar.js';
import { parseEIP155CAIP2 } from './namespaces/eip155/eip155.js';

export async function parseCAIP2(caip2) {
    const parts = caip2.split(':');
    let namespace, reference;
    
    if (parts.length !== 2) {
        throw new Error('Invalid CAIP2 format');
    }
    
    [namespace, reference] = parts;
    
    // Validate namespace: [-a-z0-9]{3,8}
    const namespaceRegex = /^[-a-z0-9]{3,8}$/;
    if (!namespaceRegex.test(namespace)) {
        throw new Error('Invalid CAIP2 namespace: must be 3-8 characters, lowercase letters, numbers, and hyphens only');
    }
    
    // Validate reference: [-_a-zA-Z0-9]{1,32}
    const referenceRegex = /^[-_a-zA-Z0-9]{1,32}$/;
    if (!referenceRegex.test(reference)) {
        throw new Error('Invalid CAIP2 reference: must be 1-32 characters, letters, numbers, hyphens, and underscores only');
    }
    
    if (namespace === 'stellar') {
        return parseStellarCAIP2(reference);
    }
    if (namespace === 'eip155') {
        return await parseEIP155CAIP2(reference);
    }

    return {
        namespace: namespace,
        reference: reference,
        chainName: `${namespace.charAt(0).toUpperCase() + namespace.slice(1)} ${reference}`,
        explorerUrl: undefined
    };
}
