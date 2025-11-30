import { fetchStellarAssetInfo, fetchStellarTransactionInfo } from './horizen.js';

export function parseStellarCAIP2(reference) {
    if (reference === "pubnet") {
        return {
            namespace: 'stellar',
            reference: 'pubnet',
            chainName: 'Stellar Mainnet',
            explorerUrl: 'https://stellar.expert/explorer/public'
        };
    }
    if (reference === "testnet") {
        return {
            namespace: 'stellar',
            reference: 'testnet',
            chainName: 'Stellar Testnet',
            explorerUrl: 'https://stellar.expert/explorer/testnet'
        };
    }
    else {
        throw new Error('Unsupported Stellar namespace reference');
    }
}

export function parseStellarCAIP10(reference, address) {
    if (reference !== 'pubnet') {
        throw new Error('Unsupported Stellar namespace reference');
    }
    return {
        namespace: 'stellar',
        reference: 'pubnet',
        address: address,
        chainName: `Stellar Mainnet`,
        explorerUrl: `https://stellar.expert/explorer/public/account/${address}`
    };
}

export async function parseStellarCAIP19(reference, assetNamespace, assetReference) {
    if (reference === "pubnet") {
        if (assetNamespace === "slip44") {
            if (assetReference === "148") {
                return {
                    namespace: 'stellar',
                    reference: reference,
                    assetNamespace: assetNamespace,
                    assetReference: assetReference,
                    explorerUrl: `https://stellar.expert/explorer/public/asset/XLM`,
                    symbol: 'XLM',
                    isNativeToken: true
                };
            }
            else {
                throw new Error('Wrong slip44 assetReference');
            }
        }
        else if (assetNamespace === "asset") {
            return {
                namespace: 'stellar',
                reference: reference,
                assetNamespace: assetNamespace,
                assetReference: assetReference,
                explorerUrl: `https://stellar.expert/explorer/public/asset/${assetReference}`,
                isNativeToken: false
            };
        }
        else {
            throw new Error('Only stellar assets and XLM native token are supported at this time');
        }
    }
    else {
        throw new Error('Unsupported Stellar reference');
    }
}

export async function verifyStellarCAIP19(reference, assetNamespace, assetReference) {
    // Let parse errors bubble up (format/syntax errors should throw in both parse and verify)
    const parsedData = await parseStellarCAIP19(reference, assetNamespace, assetReference);
    
    if (assetNamespace === "slip44" && assetReference === "148") {
        // Native XLM - always verified without network call
        return {
            ...parsedData,
            verified: true
        };
    } else if (assetNamespace === "asset") {
        // Custom asset - try to verify on network
        try {
            const assetInfo = await fetchStellarAssetInfo(assetReference);
            if (assetInfo === null) {
                return {
                    ...parsedData,
                    verified: false,
                    verificationError: 'Asset not found on Stellar network'
                };
            }
            return {
                ...parsedData,
                verified: true,
                assetCode: assetInfo.asset_code,
                assetIssuer: assetInfo.asset_issuer
            };
        } catch (error) {
            // Network error - return unverified but don't throw
            return {
                ...parsedData,
                verified: false,
                verificationError: `Cannot fetch asset info: ${error.message}`
            };
        }
    }
    
    // This should never be reached due to parse validation, but just in case
    return {
        ...parsedData,
        verified: false,
        verificationNote: `Verification completed for ${assetNamespace}:${assetReference}`
    };
}

export function parseStellarCAIP221(reference, transactionId) {
    if (reference !== "pubnet" && reference !== "testnet") {
        throw new Error(`Unsupported Stellar namespace reference: ${reference}`);
    }

    // Basic Stellar transaction hash validation (64 hex characters)
    if (!/^[a-fA-F0-9]{64}$/.test(transactionId)) {
        throw new Error('Invalid Stellar transaction hash format: must be 64 hex characters');
    }

    const chainData = parseStellarCAIP2(reference);

    return {
        namespace: 'stellar',
        reference: reference,
        chainName: chainData.chainName,
        transactionId: transactionId,
        explorerUrl: `${chainData.explorerUrl}/tx/${transactionId}`,
        verified: false
    };
}

export async function verifyStellarCAIP221(reference, transaction_id) {
    const chainData = parseStellarCAIP2(reference);
    if (reference === "pubnet") {
        const txInfo = await fetchStellarTransactionInfo(transaction_id);
        if (txInfo.status === 'success') {
            return {
                namespace: 'stellar',
                reference: reference,
                chainName: chainData.chainName,
                transactionId: transaction_id,
                verified: true,
                explorerUrl: `${chainData.explorerUrl}/tx/${transaction_id}`
            };
        } else {
            return {
                namespace: 'stellar',
                reference: reference,
                chainName: chainData.chainName,
                transactionId: transaction_id,
                explorerUrl: `${chainData.explorerUrl}/tx/${transaction_id}`,
                verified: false,
                verificationError: 'Transaction not found on Stellar network'
            };
        }
    } else {
        throw new Error('Unsupported Stellar reference');
    }
}
