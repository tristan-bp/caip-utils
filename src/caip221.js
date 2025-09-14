// src/caip221.js
import { validateStellarCAIP221 } from './namespaces/stellar.js';


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
        throw new Error('Invalid CAIP19 format: must contain exactly one forward slash');
    }

    const [prefix, transactionId] = parts;


    const chainParts = prefix.split(':');
    if (chainParts.length !== 3) {
        throw new Error('Invalid CAIP221 chain format: namespace:reference:tx');
    }

    const [namespace, reference, ] = chainParts;

    if (namespace === "stellar") {
        return await validateStellarCAIP221(reference, transactionId );
    }

    return {
        namespace: namespace,
        reference: reference,
        transactionId: transactionId,
    };
}