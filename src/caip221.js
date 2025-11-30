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

    // Validate namespace format: [-a-z0-9]{3,8}
    const namespaceRegex = /^[-a-z0-9]{3,8}$/;
    if (!namespaceRegex.test(namespace)) {
        throw new Error(`Invalid CAIP221 namespace format: "${namespace}" must match [-a-z0-9]{3,8}`);
    }

    // Validate reference format: [-_a-zA-Z0-9]{1,32}
    const referenceRegex = /^[-_a-zA-Z0-9]{1,32}$/;
    if (!referenceRegex.test(reference)) {
        throw new Error(`Invalid CAIP221 reference format: "${reference}" must match [-_a-zA-Z0-9]{1,32}`);
    }

    // Validate transaction_id format: [-%a-zA-Z0-9]{1,128}
    const transactionIdRegex = /^[-%a-zA-Z0-9]{1,128}$/;
    if (!transactionIdRegex.test(transactionId)) {
        throw new Error(`Invalid CAIP221 transaction_id format: "${transactionId}" must match [-%a-zA-Z0-9]{1,128}`);
    }

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
        return await verifyStellarCAIP221(parsedData.reference, parsedData.transactionId);
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