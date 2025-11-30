/**
 * EIP155/Ethereum RPC utilities for fetching token information
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
