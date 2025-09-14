// src/caip19.js
import { validateStellarCAIP19 } from './namespaces/stellar.js';

export async function parseCAIP19(caip19) {
    // CAIP19 format: namespace:reference/asset_namespace:asset_reference
    const parts = caip19.split('/');
    if (parts.length !== 2) {
        throw new Error('Invalid CAIP19 format: must contain exactly one forward slash');
    }

    const [chainId, assetId] = parts;
    
    // Parse chain part (namespace:reference)
    const caip2Parts = chainId.split(':');
    if (caip2Parts.length !== 2) {
        throw new Error('Invalid CAIP19 chain format: must be namespace:reference');
    }

    // Parse asset part (asset_namespace:asset_reference)
    const assetParts = assetId.split(':');
    if (assetParts.length !== 2) {
        throw new Error('Invalid CAIP19 asset format: must be asset_namespace:asset_reference');
    }

    const [namespace, reference] = caip2Parts;
    const [asset_namespace, asset_reference] = assetParts;

    // Validate namespace: [-a-z0-9]{3,8}
    const namespaceRegex = /^[-a-z0-9]{3,8}$/;
    if (!namespaceRegex.test(namespace)) {
        throw new Error('Invalid CAIP19 namespace: must be 3-8 characters, lowercase letters, numbers, and hyphens only');
    }

    // Validate reference: [-_a-zA-Z0-9]{1,32}
    const referenceRegex = /^[-_a-zA-Z0-9]{1,32}$/;
    if (!referenceRegex.test(reference)) {
        throw new Error('Invalid CAIP19 reference: must be 1-32 characters, letters, numbers, hyphens, and underscores only');
    }

    // Validate asset_namespace: [-a-z0-9]{3,8}
    const assetNamespaceRegex = /^[-a-z0-9]{3,8}$/;
    if (!assetNamespaceRegex.test(asset_namespace)) {
        throw new Error('Invalid CAIP19 asset_namespace: must be 3-8 characters, lowercase letters, numbers, and hyphens only');
    }

    // Validate asset_reference: [-.%a-zA-Z0-9]{1,128}
    const assetReferenceRegex = /^[-.%a-zA-Z0-9]{1,128}$/;
    if (!assetReferenceRegex.test(asset_reference)) {
        throw new Error('Invalid CAIP19 asset_reference: must be 1-128 characters, letters, numbers, hyphens, dots, and percent signs only');
    }
    
    if (namespace === "stellar") {
        return await validateStellarCAIP19(reference, asset_namespace, asset_reference );
    }
    
    return {
        namespace: namespace,
        reference: reference,
        asset_namespace: asset_namespace,
        asset_reference: asset_reference,
    }; 
}

// export function generateCAIP19(chain, chainId, address) {
//     TODO
// }