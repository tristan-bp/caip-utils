// src/namespaces/eip155/eip155.js
import STATIC_CHAINS from './chains-snapshot.json' with { type: 'json' };
import { fetchERC20TokenInfo } from './rpc.js';

// Cache management
let chainlistCache = null;
let cacheTimestamp = 0;
const CACHE_TTL = 60 * 60 * 1000; // 1 hour

/**
 * Fetch chain data from chainlist.org
 * @returns {Promise<Object>} Chain data indexed by chainId
 */
async function fetchChainlistData() {
  try {
    const response = await fetch('https://chainlist.org/rpcs.json');
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const chains = await response.json();
    
    // Convert array to object indexed by chainId
    const chainMap = {};
    for (const chain of chains) {
      if (chain.chainId) {
        chainMap[chain.chainId.toString()] = {
          chainId: chain.chainId,
          name: chain.name,
          shortName: chain.shortName,
          nativeCurrency: chain.nativeCurrency,
          explorers: chain.explorers || [],
          rpc: chain.rpc || [],
          infoURL: chain.infoURL,
          slip44: chain.slip44
        };
      }
    }
    
    return chainMap;
  } catch (error) {
    console.warn('Failed to fetch chainlist data:', error.message);
    return null;
  }
}

/**
 * Get chain data with caching and fallback
 * @param {boolean} forceRefresh - Force refresh from API
 * @returns {Promise<Object>} Chain data indexed by chainId
 */
export async function getChainData(forceRefresh = false) {
  const now = Date.now();
  
  // Return cached data if valid and not forcing refresh
  if (!forceRefresh && chainlistCache && (now - cacheTimestamp) < CACHE_TTL) {
    return chainlistCache;
  }
  
  // Try to fetch fresh data
  const freshData = await fetchChainlistData();
  
  if (freshData) {
    // Merge with static chains (static chains take precedence for reliability)
    chainlistCache = { ...freshData, ...STATIC_CHAINS };
    cacheTimestamp = now;
    return chainlistCache;
  }
  
  // Fallback to static chains if fetch failed
  if (!chainlistCache) {
    console.warn('Using static chain fallback data');
    chainlistCache = STATIC_CHAINS;
    cacheTimestamp = now;
  }
  
  return chainlistCache;
}

/**
 * Validate EIP155 CAIP-2 identifier
 * @param {string} reference - The chain ID (e.g., "1", "137")
 * @param {Object} options - Options for chain data fetching
 * @returns {Promise<Object>} Rich chain data object
 */
export async function parseEIP155CAIP2(reference, options = {}) {
  const chains = await getChainData(options.forceRefresh);
  const chain = chains[reference];
  
  if (!chain) {
    throw new Error(`Unsupported EIP155 chain ID: ${reference}`);
  }
  
  return {
    namespace: 'eip155',
    reference: reference,
    chainName: chain.name,
    explorerUrl: chain.explorers?.[0]?.url
  };
}

/**
 * Validate EIP155 CAIP-10 identifier (account)
 * @param {string} reference - The chain ID
 * @param {string} address - The account address
 * @param {Object} options - Options for chain data fetching
 * @returns {Promise<Object>} Rich account data object
 */
export async function parseEIP155CAIP10(reference, address, options = {}) {
  const chainData = await parseEIP155CAIP2(reference, options);
  
  // Basic address validation (0x prefix, hex chars, 40 chars)
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error('Invalid EIP155 address format: must be 0x followed by 40 hex characters');
  }
  
  return {
    namespace: 'eip155',
    reference: reference,
    address: address,
    chainName: chainData.chainName,
    explorerUrl: chainData.explorerUrl ? `${chainData.explorerUrl}/address/${address}` : undefined
  };
}

/**
 * Parse EIP155 CAIP-19 identifier (asset)
 * @param {string} reference - The chain ID
 * @param {string} asset_namespace - Asset namespace (e.g., "erc20", "erc721")
 * @param {string} asset_reference - Asset reference (contract address)
 * @param {string} [tokenId] - Optional token ID for NFTs
 * @param {Object} options - Options for chain data fetching
 * @returns {Promise<Object>} Rich asset data object
 */
export async function parseEIP155CAIP19(reference, asset_namespace, asset_reference, tokenId, options = {}) {
  // Handle the case where tokenId is actually the options object (for backwards compatibility)
  if (typeof tokenId === 'object' && tokenId !== null && !options) {
    options = tokenId;
    tokenId = undefined;
  }
  const chainData = await parseEIP155CAIP2(reference, options);
  
  // Validate asset namespace
  const validAssetNamespaces = ['slip44', 'erc20', 'erc721', 'erc1155'];
  if (!validAssetNamespaces.includes(asset_namespace)) {
    throw new Error(`Unsupported EIP155 asset namespace: ${asset_namespace}. Supported: ${validAssetNamespaces.join(', ')}`);
  }
  if (asset_namespace === 'slip44') {
    if (!chainData.slip44) {
      throw new Error('Slip44 number not found for this chain');
    }
    if (asset_reference !== chainData.slip44) {
      throw new Error('Invalid slip44 number, should be ' + chainData.slip44);
    }
    return {
      ...chainData,
      assetNamespace: asset_namespace,
      assetReference: asset_reference,
      tokenId: tokenId, // Use the tokenId parameter
      explorerUrl: chainData.explorerUrl,
      isNativeToken: true
    };
  }
  
  // For ERC20, asset_reference should be a contract address and tokenId should not be present
  if (asset_namespace === 'erc20') {
    if (!/^0x[a-fA-F0-9]{40}$/.test(asset_reference)) {
      throw new Error('Invalid ERC20 contract address format');
    }
    if (tokenId !== undefined) {
      throw new Error('ERC20 tokens should not have a token ID');
    }
  }
  
  // For ERC721/ERC1155, asset_reference should be a contract address, tokenId is optional
  if (asset_namespace === 'erc721' || asset_namespace === 'erc1155') {
    if (!/^0x[a-fA-F0-9]{40}$/.test(asset_reference)) {
      throw new Error('Invalid contract address format in asset reference');
    }
    
    // Validate tokenId if present (already validated by CAIP-19 parser, but double-check format for NFTs)
    if (tokenId !== undefined) {
      // For NFTs, token IDs are typically numeric, but allow the broader CAIP-19 format
      if (!/^[-.%a-zA-Z0-9]+$/.test(tokenId)) {
        throw new Error('Invalid token ID format');
      }
    }
  }
  
  let explorerUrl;
  
  if (chainData.explorerUrl) {
    if (asset_namespace === 'erc20') {
      explorerUrl = `${chainData.explorerUrl}/token/${asset_reference}`;
    } else if (asset_namespace === 'erc721' || asset_namespace === 'erc1155') {
      if (tokenId) {
        // Specific token: link to the specific NFT
        explorerUrl = `${chainData.explorerUrl}/token/${asset_reference}?a=${tokenId}`;
      } else {
        // Collection reference: link to the contract
        explorerUrl = `${chainData.explorerUrl}/token/${asset_reference}`;
      }
    }
  }
  
  return {
    ...chainData,
    assetNamespace: asset_namespace,
    assetReference: asset_reference,
    tokenId: tokenId, // Use the tokenId parameter
    explorerUrl,
    isNativeToken: false
  };
}

/**
 * Verify EIP155 CAIP-19 identifier with on-chain data
 * @param {string} reference - The chain ID
 * @param {string} asset_namespace - Asset namespace (e.g., "erc20", "erc721")
 * @param {string} asset_reference - Asset reference (contract address)
 * @param {string} [tokenId] - Optional token ID for NFTs
 * @param {Object} options - Options for chain data fetching
 * @returns {Promise<Object>} Rich asset data object with on-chain verification
 */
export async function verifyEIP155CAIP19(reference, asset_namespace, asset_reference, tokenId, options = {}) {
  // Handle the case where tokenId is actually the options object (for backwards compatibility)
  if (typeof tokenId === 'object' && tokenId !== null && !options) {
    options = tokenId;
    tokenId = undefined;
  }
  
  const parsedData = await parseEIP155CAIP19(reference, asset_namespace, asset_reference, tokenId, options);
  
  if (asset_namespace === 'erc20') {
    // For ERC20, fetch token info using the contract address
    try {
      const tokenInfo = await fetchTokenInfoWithFallback(reference, asset_reference, options);
      return {
        ...parsedData,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        decimals: tokenInfo.decimals,
        totalSupply: tokenInfo.totalSupply,
        verified: true
      };
    } catch (error) {
      return {
        ...parsedData,
        verified: false,
        verificationError: error.message
      };
    }
  } else if (asset_namespace === 'erc721' || asset_namespace === 'erc1155') {
    // For NFTs, use the contract address (asset_reference is already the contract address)
    try {
      // Try to fetch basic token info from the contract (name, symbol)
      const tokenInfo = await fetchTokenInfoWithFallback(reference, asset_reference, options);
      return {
        ...parsedData,
        name: tokenInfo.name,
        symbol: tokenInfo.symbol,
        verified: true,
        verificationNote: "Contract info verified, but individual token existence not checked"
        // Note: decimals and totalSupply may not be meaningful for NFTs
      };
    } catch (error) {
      // If token info fetch fails, still return parsed data but mark as unverified
      return {
        ...parsedData,
        verified: false,
        verificationError: error.message,
        verificationNote: "Could not fetch contract info - contract may not exist or RPC unavailable"
      };
    }
  }
  
  // For unsupported asset namespaces, return parsed data only
  return {
    ...parsedData,
    verified: false,
    verificationNote: `Verification not supported for asset namespace: ${asset_namespace}`
  };
}

/**
 * Parse EIP155 CAIP-221 identifier (transaction)
 * @param {string} reference - The chain ID
 * @param {string} transactionId - The transaction hash
 * @param {Object} options - Options for chain data fetching
 * @returns {Promise<Object>} Rich transaction data object
 */
export async function parseEIP155CAIP221(reference, transactionId, options = {}) {
  const chainData = await parseEIP155CAIP2(reference, options);
  
  // Basic transaction hash validation (0x prefix, 64 hex chars)
  if (!/^0x[a-fA-F0-9]{64}$/.test(transactionId)) {
    throw new Error('Invalid EIP155 transaction hash format: must be 0x followed by 64 hex characters');
  }
  
  return {
    ...chainData,
    transactionId: transactionId,
    explorerUrl: chainData.explorerUrl ? `${chainData.explorerUrl}/tx/${transactionId}` : undefined,
    verified: false
  };
}

/**
 * Validate EIP155 CAIP-221 identifier (transaction) - alias for parseEIP155CAIP221
 * @param {string} reference - The chain ID
 * @param {string} transactionId - The transaction hash
 * @param {Object} options - Options for chain data fetching
 * @returns {Promise<Object>} Rich transaction data object
 */
export async function validateEIP155CAIP221(reference, transactionId, options = {}) {
  const chainData = await validateEIP155CAIP2(reference, options);
  
  // Basic transaction hash validation (0x prefix, 64 hex chars)
  if (!/^0x[a-fA-F0-9]{64}$/.test(transactionId)) {
    throw new Error('Invalid EIP155 transaction hash format: must be 0x followed by 64 hex characters');
  }
  
  return {
    ...chainData,
    transactionId: transactionId,
    explorerUrl: chainData.explorerUrl ? `${chainData.explorerUrl}/tx/${transactionId}` : undefined,
    // Note: We don't verify transaction existence like Stellar does
    // as it would require RPC calls to each chain
    verified: false
  };
}

/**
 * Update chains snapshot programmatically
 * @returns {Promise<Object>} Updated chain data with all chains
 */
export async function updateChainsSnapshot() {
  // Force refresh to get latest data
  const freshData = await fetchChainlistData();
  if (!freshData) {
    throw new Error('Failed to fetch fresh chain data');
  }
  
  // Update cache with all chains + static fallbacks
  chainlistCache = { ...freshData, ...STATIC_CHAINS };
  cacheTimestamp = Date.now();
  
  return chainlistCache;
}

/**
 * Fetch ERC20 token information with RPC fallback resilience
 * @param {string} chainId - The EIP155 chain ID (e.g., "1", "137")
 * @param {string} contractAddress - The ERC20 contract address
 * @param {Object} options - Options for chain data fetching and RPC behavior
 * @returns {Promise<Object>} Token information (name, symbol, decimals, totalSupply)
 */
export async function fetchTokenInfoWithFallback(chainId, contractAddress, options = {}) {
  // Get chain data to find RPC URLs
  const chains = await getChainData(options.forceRefresh);
  const chain = chains[chainId];
  
  if (!chain) {
    throw new Error(`Unsupported EIP155 chain ID: ${chainId}`);
  }
  
  // Get RPC URLs from chain data
  let rpcUrls = chain.rpc || [];
  
  // Filter to only HTTP/HTTPS URLs (no WebSocket)
  rpcUrls = rpcUrls.filter(url => 
    typeof url === 'string' && (url.startsWith('http://') || url.startsWith('https://'))
  );
  
  if (rpcUrls.length === 0) {
    throw new Error(`No HTTP RPC endpoints available for chain ${chainId}`);
  }
  
  // Limit to first 3 RPC URLs for fallback attempts
  const maxAttempts = Math.min(3, rpcUrls.length);
  const attemptsToTry = rpcUrls.slice(0, maxAttempts);
  
  let lastError;
  
  // Try each RPC URL until one succeeds
  for (let i = 0; i < attemptsToTry.length; i++) {
    const rpcUrl = attemptsToTry[i];
    
    try {
      console.log(`Attempting to fetch token info from RPC ${i + 1}/${attemptsToTry.length}: ${rpcUrl}`);
      
      const tokenInfo = await fetchERC20TokenInfo(contractAddress, rpcUrl);
      
      // Add chain context to the response
      return {
        ...tokenInfo,
        chainId: chain.chainId,
        chainName: chain.name,
        contractAddress,
        rpcUrl // Include which RPC was successful
      };
      
    } catch (error) {
      lastError = error;
      console.warn(`RPC attempt ${i + 1} failed for ${rpcUrl}:`, error.message);
      
      // If this isn't the last attempt, continue to next RPC
      if (i < attemptsToTry.length - 1) {
        console.log(`Trying next RPC endpoint...`);
        continue;
      }
    }
  }
  
  // If we get here, all RPC attempts failed
  throw new Error(
    `Failed to fetch token info after ${attemptsToTry.length} RPC attempts. ` +
    `Last error: ${lastError?.message || 'Unknown error'}`
  );
}
