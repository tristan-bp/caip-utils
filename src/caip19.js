// src/caip19.js
import { parseStellarCAIP19, verifyStellarCAIP19 } from './namespaces/stellar/stellar.js';
import { parseEIP155CAIP19, verifyEIP155CAIP19 } from './namespaces/eip155/eip155.js';

// Fast syntax validation only
export async function parseCAIP19(caip19) {
    // CAIP19 format: namespace:reference/asset_namespace:asset_reference
    // Note: asset_reference can contain optional forward slashes for nfts
    const firstSlashIndex = caip19.indexOf('/');
    if (firstSlashIndex === -1) {
        throw new Error('Invalid CAIP19 format: must contain at least one forward slash');
    }

    const chainId = caip19.substring(0, firstSlashIndex);
    const assetId = caip19.substring(firstSlashIndex + 1);
    
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

    // Parse asset_reference and optional token_id
    // Format: asset_reference or asset_reference/token_id
    let parsedAssetReference = asset_reference;
    let tokenId = undefined;
    
    const tokenSlashIndex = asset_reference.indexOf('/');
    if (tokenSlashIndex !== -1) {
        parsedAssetReference = asset_reference.substring(0, tokenSlashIndex);
        tokenId = asset_reference.substring(tokenSlashIndex + 1);
        
        // Validate token_id: [-.%a-zA-Z0-9]{1,78}
        const tokenIdRegex = /^[-.%a-zA-Z0-9]{1,78}$/;
        if (!tokenIdRegex.test(tokenId)) {
            throw new Error('Invalid CAIP19 token_id: must be 1-78 characters, letters, numbers, hyphens, dots, and percent signs only');
        }
    }
    
    // Validate asset_reference (without token_id): [-.%a-zA-Z0-9]{1,128}
    const assetReferenceRegex = /^[-.%a-zA-Z0-9]{1,128}$/;
    if (!assetReferenceRegex.test(parsedAssetReference)) {
        throw new Error('Invalid CAIP19 asset_reference: must be 1-128 characters, letters, numbers, hyphens, dots, and percent signs only');
    }
    
    if (namespace === "stellar") {
        return await parseStellarCAIP19(reference, asset_namespace, parsedAssetReference);
    }
    if (namespace === 'eip155') {
        return await parseEIP155CAIP19(reference, asset_namespace, parsedAssetReference, tokenId);
    }
    
    return {
        namespace: namespace,
        reference: reference,
        assetNamespace: asset_namespace,
        assetReference: parsedAssetReference,
        tokenId: tokenId
    }; 
}

// Parse + on-chain verification
// Internally calls parseCAIP19, then adds RPC data
export async function verifyCAIP19(caip19) {
    const parsed = await parseCAIP19(caip19);
    if (parsed.namespace === 'stellar') {
        return await verifyStellarCAIP19(parsed.reference, parsed.assetNamespace, parsed.assetReference);
    }
    if (parsed.namespace === 'eip155') {
        return await verifyEIP155CAIP19(parsed.reference, parsed.assetNamespace, parsed.assetReference, parsed.tokenId);
    }
    
    // For unknown namespaces, return parsed data with verified: false
    return {
        ...parsed,
        verified: false,
        verificationNote: `Verification not supported for namespace: ${parsed.namespace}`
    };
}