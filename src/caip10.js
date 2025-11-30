// src/caip10.js
import { parseStellarCAIP10 } from './namespaces/stellar/stellar.js';
import { parseEIP155CAIP10 } from './namespaces/eip155/eip155.js';

export async function parseCAIP10(value) {
    const parts = value.split(':');
    let namespace, reference, address;
    
    if (parts.length !== 3) {
        throw new Error('Invalid CAIP10');
    }

    [namespace, reference, address] = parts;

    // Validate namespace: [-a-z0-9]{3,8}
    const namespaceRegex = /^[-a-z0-9]{3,8}$/;
    if (!namespaceRegex.test(namespace)) {
        throw new Error('Invalid CAIP10 namespace: must be 3-8 characters, lowercase letters, numbers, and hyphens only');
    }

    // Validate reference: [-_a-zA-Z0-9]{1,32}
    const referenceRegex = /^[-_a-zA-Z0-9]{1,32}$/;
    if (!referenceRegex.test(reference)) {
        throw new Error('Invalid CAIP10 reference: must be 1-32 characters, letters, numbers, hyphens, and underscores only');
    }

    // Validate address: [-.%a-zA-Z0-9]{1,128}
    const addressRegex = /^[-.%a-zA-Z0-9]{1,128}$/;
    if (!addressRegex.test(address)) {
        throw new Error('Invalid CAIP10 address: must be 1-128 characters, letters, numbers, hyphens, dots, and percent signs only');
    }
    
    if (namespace === 'stellar') {
        return parseStellarCAIP10(reference, address);
    }   
    if (namespace === 'eip155') {
        return await parseEIP155CAIP10(reference, address);
    }
    return {
        namespace: namespace,
        reference: reference,
        address: address,
        chainName: `${namespace.charAt(0).toUpperCase() + namespace.slice(1)} ${reference}`,
        explorerUrl: undefined
    }; 
}
