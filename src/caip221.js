// src/caip221.js
import { parseStellarCAIP221, verifyStellarCAIP221 } from './namespaces/stellar/stellar.js';
import { parseEIP155CAIP221, verifyEIP155CAIP221 } from './namespaces/eip155/eip155.js';


/*
caip221 proposal: https://github.com/ChainAgnostic/CAIPs/pull/221
regex from the caip221 proposal
block_address:        chain_id + ":" [ + "block:"]? + "txn/" + transaction_id + ["." + property]?
chain_id:             [-a-z0-9]{3,8}:[-_a-zA-Z0-9]{1,32} (See [CAIP-2][])
transaction_id:       [-%a-zA-Z0-9]{1,128}
regex enforced in this implementation
doesn't include optional block prefix
*/
export async function parseCAIP221(caip221) {
    const parts = caip221.split('/');
    if (parts.length !== 2) {
        throw new Error('Invalid CAIP221 format: must contain exactly one forward slash');
    }

    const [prefix, transactionId] = parts;

    const chainParts = prefix.split(':');
    if (chainParts.length !== 3 && chainParts.length !== 4) {
        throw new Error('Invalid CAIP221 format: namespace:reference:txn/transaction_id or namespace:reference:block:txn/transaction_id');
    }

    const [namespace, reference] = chainParts;

    if (namespace === "stellar") {
        return parseStellarCAIP221(reference, transactionId);
    }
    if (namespace === 'eip155') {
        return await parseEIP155CAIP221(reference, transactionId);
    }

    return {
        namespace: namespace,
        reference: reference,
        transactionId: transactionId,
        chainName: `${namespace.charAt(0).toUpperCase() + namespace.slice(1)} ${reference}`,
        explorerUrl: undefined,
        verified: false
    };
}

export async function verifyCAIP221(caip221) {
    const parsedData = await parseCAIP221(caip221);
    
    if (parsedData.namespace === 'stellar') {
        // For Stellar, we could verify the transaction exists on-chain via Horizon API
        // TODO: Implement actual verification using fetchStellarTransactionInfo
        return {
            ...parsedData,
            verified: false,
            verificationNote: "Stellar transaction verification not yet implemented - would require Horizon API call"
        };
    } else if (parsedData.namespace === 'eip155') {
        // For EIP155, verify the transaction exists on-chain via RPC
        return await verifyEIP155CAIP221(parsedData.reference, parsedData.transactionId);
    }
    
    return {
        ...parsedData,
        verified: false,
        verificationNote: `Transaction verification not supported for namespace: ${parsedData.namespace}`
    };
}