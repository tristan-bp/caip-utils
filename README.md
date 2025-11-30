# CAIP Utils

A comprehensive JavaScript library for parsing and verifying [CAIP (Chain Agnostic Improvement Proposals)](https://github.com/ChainAgnostic/CAIPs) identifiers across multiple blockchain networks.

## Features

- ✅ **CAIP-2**: Chain ID parsing and validation
- ✅ **CAIP-10**: Account ID parsing and validation  
- ✅ **CAIP-19**: Asset ID parsing and on-chain verification
- ✅ **CAIP-221**: Transaction ID parsing and on-chain verification
- 🌐 **Multi-chain support**: EIP155 (Ethereum), Stellar, and extensible architecture
- 🔗 **On-chain verification**: Real-time validation using RPC nodes and APIs
- 🛡️ **Robust error handling**: Graceful fallbacks and comprehensive validation
- 📝 **TypeScript-ready**: Consistent return types and clear interfaces

## Installation

```bash
npm install caip-utils
```

## Quick Start

```javascript
import { parseCAIP2, parseCAIP10, parseCAIP19, verifyCAIP19, parseCAIP221, verifyCAIP221 } from 'caip-utils';

// Parse a chain identifier
const chain = await parseCAIP2('eip155:1');
console.log(chain.chainName); // "Ethereum Mainnet"

// Parse an account identifier
const account = await parseCAIP10('eip155:1:0x742d35Cc6634C0532925a3b8D4C1B4E7c5B4E8C0');
console.log(account.explorerUrl); // "https://etherscan.io/address/0x742d..."

// Parse and verify an asset identifier
const asset = await verifyCAIP19('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
if (asset.verified) {
  console.log(`${asset.name} (${asset.symbol})`); // "USD Coin (USDC)"
}
```

## API Reference

### parseCAIP2(caip2)

Parses a CAIP-2 chain identifier and returns chain information.

**Parameters:**
- `caip2` (string): Chain identifier in format `namespace:reference`

**Returns:** `Promise<Object>`
```javascript
{
  namespace: string,      // e.g., "eip155"
  reference: string,      // e.g., "1" 
  chainName: string,      // e.g., "Ethereum Mainnet"
  explorerUrl?: string    // e.g., "https://etherscan.io"
}
```

**Example:**
```javascript
const result = await parseCAIP2('eip155:1');
// {
//   namespace: "eip155",
//   reference: "1", 
//   chainName: "Ethereum Mainnet",
//   explorerUrl: "https://etherscan.io"
// }
```

**Supported Networks:**
- `eip155:*` - Ethereum and EVM-compatible chains
- `stellar:pubnet` - Stellar Mainnet
- Generic fallback for other namespaces

---

### parseCAIP10(caip10)

Parses a CAIP-10 account identifier and returns account information.

**Parameters:**
- `caip10` (string): Account identifier in format `namespace:reference:address`

**Returns:** `Promise<Object>`
```javascript
{
  namespace: string,      // e.g., "eip155"
  reference: string,      // e.g., "1"
  address: string,        // e.g., "0x742d35Cc..."
  chainName: string,      // e.g., "Ethereum Mainnet"
  explorerUrl?: string    // e.g., "https://etherscan.io/address/0x742d35Cc..."
}
```

**Example:**
```javascript
const result = await parseCAIP10('eip155:1:0x742d35Cc6634C0532925a3b8D4C1B4E7c5B4E8C0');
// {
//   namespace: "eip155",
//   reference: "1",
//   address: "0x742d35Cc6634C0532925a3b8D4C1B4E7c5B4E8C0",
//   chainName: "Ethereum Mainnet", 
//   explorerUrl: "https://etherscan.io/address/0x742d35Cc6634C0532925a3b8D4C1B4E7c5B4E8C0"
// }
```

---

### parseCAIP19(caip19)

Parses a CAIP-19 asset identifier and returns asset information.

**Parameters:**
- `caip19` (string): Asset identifier in format `namespace:reference/asset_namespace:asset_reference[/token_id]`

**Returns:** `Promise<Object>`
```javascript
{
  namespace: string,        // e.g., "eip155"
  reference: string,        // e.g., "1"
  chainName: string,        // e.g., "Ethereum Mainnet"
  explorerUrl?: string,     // e.g., "https://etherscan.io/token/0xA0b..."
  assetNamespace: string,   // e.g., "erc20", "erc721", "slip44"
  assetReference: string,   // e.g., "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"
  tokenId?: string,         // For NFTs, e.g., "1234"
  isNativeToken: boolean    // true for native tokens like ETH
}
```

**Example:**
```javascript
// ERC20 Token
const erc20 = await parseCAIP19('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');

// ERC721 NFT with token ID
const nft = await parseCAIP19('eip155:1/erc721:0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D/1234');

// Stellar asset
const stellar = await parseCAIP19('stellar:pubnet/slip44:148');
```

---

### verifyCAIP19(caip19)

Parses a CAIP-19 asset identifier and verifies it exists on-chain.

**Parameters:**
- `caip19` (string): Asset identifier in format `namespace:reference/asset_namespace:asset_reference[/token_id]`

**Returns:** `Promise<Object>`
```javascript
{
  // All fields from parseCAIP19, plus:
  verified: boolean,           // true if verified on-chain
  verificationError?: string,  // Error message if verification failed
  verificationNote?: string,   // Additional verification context
  
  // For verified ERC20 tokens:
  name?: string,              // e.g., "USD Coin"
  symbol?: string,            // e.g., "USDC"  
  decimals?: number,          // e.g., 6
  totalSupply?: string,       // e.g., "52000000000000"
  
  // For verified NFT contracts:
  name?: string,              // e.g., "BoredApeYachtClub"
  symbol?: string,            // e.g., "BAYC"
  
  // For verified Stellar assets:
  assetCode?: string,         // e.g., "USDC"
  assetIssuer?: string        // e.g., "GA5ZSEJYB37JRC..."
}
```

**Example:**
```javascript
const result = await verifyCAIP19('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');

if (result.verified) {
  console.log(`${result.name} (${result.symbol})`); // "USD Coin (USDC)"
  console.log(`Decimals: ${result.decimals}`);      // "Decimals: 6"
} else {
  console.log(`Verification failed: ${result.verificationError}`);
}
```

**Verification Features:**
- **ERC20**: Fetches name, symbol, decimals, totalSupply from contract
- **ERC721/ERC1155**: Verifies contract exists and fetches metadata
- **Stellar**: Verifies native XLM or custom assets via Horizon API
- **RPC Resilience**: Automatically tries multiple RPC endpoints
- **Graceful Failures**: Returns `verified: false` instead of throwing

---

### parseCAIP221(caip221)

Parses a CAIP-221 transaction identifier and returns transaction information.

**Parameters:**
- `caip221` (string): Transaction identifier in format `namespace:reference:txn/transaction_id`

**Returns:** `Promise<Object>`
```javascript
{
  namespace: string,        // e.g., "eip155"
  reference: string,        // e.g., "1"
  chainName: string,        // e.g., "Ethereum Mainnet"
  transactionId: string,    // e.g., "0x5c504ed432cb..."
  explorerUrl?: string,     // e.g., "https://etherscan.io/tx/0x5c504ed..."
  verified: boolean         // false for parse-only
}
```

**Example:**
```javascript
const result = await parseCAIP221('eip155:1:txn/0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060');
// {
//   namespace: "eip155",
//   reference: "1",
//   chainName: "Ethereum Mainnet",
//   transactionId: "0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
//   explorerUrl: "https://etherscan.io/tx/0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060",
//   verified: false
// }
```

---

### verifyCAIP221(caip221)

Parses a CAIP-221 transaction identifier and verifies it exists on-chain.

**Parameters:**
- `caip221` (string): Transaction identifier in format `namespace:reference:txn/transaction_id`

**Returns:** `Promise<Object>`
```javascript
{
  // All fields from parseCAIP221, plus:
  verified: boolean,           // true if verified on-chain
  verificationError?: string,  // Error message if verification failed
  verificationNote?: string,   // Additional verification context
  
  // For verified EIP155 transactions:
  blockNumber?: number,        // e.g., 12345678
  blockHash?: string,          // e.g., "0xabc123..."
  from?: string,               // e.g., "0x742d35Cc..."
  to?: string,                 // e.g., "0xA0b86991..."
  value?: string,              // e.g., "1000000000000000000"
  gasPrice?: string,           // e.g., "20000000000"
  nonce?: number,              // e.g., 42
  input?: string,              // e.g., "0xa9059cbb..."
  type?: number,               // e.g., 2 (EIP-1559)
  isPending?: boolean,         // false if confirmed
  isConfirmed?: boolean,       // true if in block
  rpcUrl?: string              // Which RPC endpoint was used
}
```

**Example:**
```javascript
const result = await verifyCAIP221('eip155:1:txn/0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060');

if (result.verified) {
  console.log(`Transaction confirmed in block ${result.blockNumber}`);
  console.log(`From: ${result.from} → To: ${result.to}`);
  console.log(`Value: ${result.value} wei`);
} else {
  console.log(`Verification failed: ${result.verificationError}`);
}
```

**Verification Features:**
- **EIP155**: Fetches full transaction data via RPC calls
- **Stellar**: Verifies transactions via Horizon API (when implemented)
- **RPC Resilience**: Automatically tries multiple RPC endpoints
- **Pending Detection**: Distinguishes between pending and confirmed transactions

## Error Handling

All functions follow consistent error handling patterns:

### Parse Functions
- **Throw errors** for invalid format/syntax
- **Return objects** for valid but unknown chains/namespaces

### Verify Functions  
- **Throw errors** for invalid format/syntax
- **Return `verified: false`** for network/API failures
- **Include error context** in `verificationError` or `verificationNote`

```javascript
try {
  const result = await verifyCAIP19('eip155:1/erc20:0xInvalidAddress');
  
  if (result.verified) {
    // Use verified data
  } else {
    // Handle verification failure
    console.log(result.verificationError);
  }
} catch (error) {
  // Handle format/syntax errors
  console.log('Invalid CAIP format:', error.message);
}
```

## Supported Networks

### EIP155 (Ethereum & EVM Chains)
- **Ethereum**: `eip155:1`
- **Polygon**: `eip155:137` 
- **Arbitrum**: `eip155:42161`
- **Optimism**: `eip155:10`
- **And 1000+ other EVM chains**

### Stellar
- **Mainnet**: `stellar:pubnet`
- **Testnet**: `stellar:testnet` (parsing only)

### Extensible Architecture
The library is designed to easily add support for new blockchain networks. Each namespace implements its own parsing and verification logic.

## Advanced Usage

### Custom RPC Options

```javascript
// Force refresh chain data cache
const result = await parseCAIP19('eip155:1/erc20:0xA0b...', { forceRefresh: true });

// Verification automatically handles RPC fallbacks
const verified = await verifyCAIP19('eip155:1/erc20:0xA0b...');
```

### NFT Support

```javascript
// Parse NFT collection
const collection = await parseCAIP19('eip155:1/erc721:0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D');

// Parse specific NFT
const nft = await parseCAIP19('eip155:1/erc721:0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D/1234');
console.log(nft.tokenId); // "1234"
```

## Development

### Running Tests

```bash
npm test
```

### Updating Chain Data

```bash
npm run update-chains
```

This fetches the latest chain information from [chainlist.org](https://chainlist.org) and updates the local snapshot.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality  
4. Ensure all tests pass
5. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Links

- [CAIP Standards](https://github.com/ChainAgnostic/CAIPs)
- [CAIP-2: Chain ID](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-2.md)
- [CAIP-10: Account ID](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-10.md)  
- [CAIP-19: Asset ID](https://github.com/ChainAgnostic/CAIPs/blob/master/CAIPs/caip-19.md)
- [CAIP-221: Transaction ID](https://github.com/ChainAgnostic/CAIPs/pull/221)