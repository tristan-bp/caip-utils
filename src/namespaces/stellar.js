export function validateStellarCAIP2(reference) {
    if (reference === "pubnet") {
        return {
            namespace: 'stellar',
            reference: 'pubnet',
            humaneReadableName: 'Stellar Mainnet'
        };
    }
    else {
        throw new Error('Unsupported Stellar namespace reference');
    }
}

export function validateStellarCAIP10(reference, address) {
    if (reference !== 'pubnet') {
        throw new Error('Unsupported Stellar namespace reference');
    }
    return {
        namespace: 'stellar',
        reference: 'pubnet',
        address: address,
        humanReadableName: `Stellar Mainnet Account: ${address}`,
        explorerUrl: `https://stellar.expert/explorer/public/account/${address}`
    };
}

export async function fetchStellarAssetInfo(asset_reference) {
    const [assetCode, assetIssuer] = asset_reference.split('-');
    try {
        const response = await fetch(`https://horizon.stellar.org/assets?asset_issuer=${assetIssuer}&asset_code=${assetCode}`);
        const data = await response.json();
        if (data._embedded && data._embedded.records && data._embedded.records.length > 0) {
            return data._embedded.records[0];
        }
        return null;
    } catch (error) {
        console.error('Error fetching Stellar asset info:', error);
        return null;
    }
}

export async function validateStellarCAIP19(reference, asset_namespace, asset_reference) {
    if (reference === "pubnet") {
        if (asset_namespace === "slip44") {
            if (asset_reference === "148") {
                return {
                    namespace: 'stellar',
                    reference: reference,
                    assetNamespace: asset_namespace,
                    assetReference: asset_reference,
                    explorerUrl: `https://stellar.expert/explorer/public/asset/XLM`,
                    symbol: 'XLM',
                    isNativeToken: true,
                    verified: true
                };
            }
            else {
                throw new Error('Wrong slip44 asset_reference');
            }
        }
        else if (asset_namespace === "asset") {
            try {
                const assetInfo = await fetchStellarAssetInfo(asset_reference);
                if (assetInfo === null) {
                    throw new Error('No asset info found');
                }
                return {
                    namespace: 'stellar',
                    reference: reference,
                    assetNamespace: asset_namespace,
                    assetReference: asset_reference,
                    explorerUrl: `https://stellar.expert/explorer/public/asset/${asset_reference}`, // fails for native tokens
                    symbol: assetInfo.asset_code,
                    isNativeToken: false,
                    verified: true
                };
            } catch (error) {
                throw new Error('Cannot fetch asset info');
            }
        }
        else {
            throw new Error('Only stellar assets and native token are supported at this time');
        }
    }
    else {
        throw new Error('Unsupported Stellar reference');
    }
}

export async function fetchStellarTransactionInfo(txHash) {
    try {
        const response = await fetch(`https://horizon.stellar.org/transactions/${txHash}`);
        if (response.status === 200) {
            return { status: 'success', data: await response.json() };
        } else if (response.status === 404) {
            return { status: 'pending' };
        } else if (response.status === 400) {
            return { status: 'error' };
        }
        return { status: 'unknown' };
    } catch (error) {
        return { status: 'unknown' };
    }
}

export async function validateStellarCAIP221(reference, transaction_id) {
    if (reference === "pubnet") {
            if((await fetchStellarTransactionInfo(transaction_id)).status === 'success'){
                return {
                    namespace: 'stellar',
                    reference: reference,
                    explorerUrl: `https://stellar.expert/explorer/public/tx/${transaction_id}`,
                    verified: true
                };
            }
            else{
                return {
                    namespace: 'stellar',
                    reference: reference,
                    verified: false
                };
            }
    }
    else {
        throw new Error('Unsupported Stellar reference');
    }
}
