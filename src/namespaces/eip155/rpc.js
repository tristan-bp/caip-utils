/**
 * EIP155/Ethereum RPC utilities for fetching token and transaction information
 */

/**
 * Fetch ERC20 token information from RPC node using batch calls
 * @param {string} contractAddress - The ERC20 contract address
 * @param {string} rpcUrl - The RPC endpoint URL
 * @returns {Promise<Object>} Token information (name, symbol, decimals, totalSupply)
 */
export async function fetchERC20TokenInfo(contractAddress, rpcUrl) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify([
      {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: contractAddress, data: '0x06fdde03' }, 'latest'], // name()
        id: 1
      },
      {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: contractAddress, data: '0x95d89b41' }, 'latest'], // symbol()
        id: 2
      },
      {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: contractAddress, data: '0x313ce567' }, 'latest'], // decimals()
        id: 3
      },
      {
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: contractAddress, data: '0x18160ddd' }, 'latest'], // totalSupply()
        id: 4
      }
    ])
  });
  
  const results = await response.json();
  
  const resultMap = {};
  results.forEach(result => {
    resultMap[result.id] = result;
  });
  
  return {
    name: decodeString(resultMap[1].result),
    symbol: decodeString(resultMap[2].result),
    decimals: parseInt(resultMap[3].result, 16),
    totalSupply: BigInt(resultMap[4].result)
  };
}

/**
 * Fetch EIP155 transaction information from RPC node
 * @param {string} transactionHash - The transaction hash (0x prefixed)
 * @param {string} rpcUrl - The RPC endpoint URL
 * @returns {Promise<Object>} Transaction information
 */
export async function fetchEIP155Transaction(transactionHash, rpcUrl) {
  const response = await fetch(rpcUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      method: 'eth_getTransactionByHash',
      params: [transactionHash],
      id: 1
    })
  });
  
  if (!response.ok) {
    throw new Error(`RPC request failed: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  
  if (result.error) {
    throw new Error(`RPC error: ${result.error.message}`);
  }
  
  if (!result.result) {
    throw new Error('Transaction not found');
  }
  
  const tx = result.result;
  
  return {
    hash: tx.hash,
    blockNumber: tx.blockNumber ? parseInt(tx.blockNumber, 16) : null,
    blockHash: tx.blockHash,
    transactionIndex: tx.transactionIndex ? parseInt(tx.transactionIndex, 16) : null,
    from: tx.from,
    to: tx.to,
    value: tx.value ? BigInt(tx.value) : BigInt(0),
    gas: tx.gas ? parseInt(tx.gas, 16) : null,
    gasPrice: tx.gasPrice ? BigInt(tx.gasPrice) : null,
    maxFeePerGas: tx.maxFeePerGas ? BigInt(tx.maxFeePerGas) : null,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas ? BigInt(tx.maxPriorityFeePerGas) : null,
    nonce: tx.nonce ? parseInt(tx.nonce, 16) : null,
    input: tx.input,
    type: tx.type ? parseInt(tx.type, 16) : 0,
    // Status info (requires transaction receipt for confirmation status)
    isPending: tx.blockNumber === null,
    isConfirmed: tx.blockNumber !== null
  };
}

/**
 * Decode ABI-encoded string from hex
 * @param {string} hex - Hex encoded string
 * @returns {string} Decoded string
 */
function decodeString(hex) {
  if (!hex || hex === '0x') return '';
  // Remove 0x prefix and decode
  const cleanHex = hex.slice(2);
  // Skip first 64 chars (offset) and next 64 chars (length), then decode the actual string
  const lengthHex = cleanHex.slice(64, 128);
  const length = parseInt(lengthHex, 16) * 2; // length in hex chars
  const stringHex = cleanHex.slice(128, 128 + length);
  return Buffer.from(stringHex, 'hex').toString('utf8');
}
