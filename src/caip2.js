// src/caip2.js
import { validateStellarCAIP2 } from './namespaces/stellar.js';

export function parseCAIP2(caip2) {
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
        return validateStellarCAIP2(reference);
    }
    
    return {
        namespace: namespace,
        reference: reference,
    };
}

export function generateCAIP2(chain) {
  // TODO: CAIP2 generation logic
}
