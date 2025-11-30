export async function fetchStellarAssetInfo(assetReference) {
    const [assetCode, assetIssuer] = assetReference.split('-');
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