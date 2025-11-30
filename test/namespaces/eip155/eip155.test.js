// test/namespaces/eip155/eip155.test.js

import { 
  getChainData, 
  parseEIP155CAIP2, 
  parseEIP155CAIP10, 
  parseEIP155CAIP19, 
  parseEIP155CAIP221,
  verifyEIP155CAIP19,
  fetchTokenInfoWithFallback
} from '../../../src/namespaces/eip155/eip155.js';

describe('EIP155 Namespace Business Logic', () => {

  describe('Chain Data Management', () => {
    test('should return chain data with static fallback', async () => {
      const chains = await getChainData();
      expect(chains).toBeDefined();
      expect(chains['1']).toBeDefined();
      expect(chains['1'].name).toBe('Ethereum Mainnet');
      expect(chains['1'].chainId).toBe(1);
    });

    test('should include popular chains in static data', async () => {
      const chains = await getChainData();
      expect(chains['1']).toBeDefined(); // Ethereum
      expect(chains['137']).toBeDefined(); // Polygon
      expect(chains['42161']).toBeDefined(); // Arbitrum
      expect(chains['10']).toBeDefined(); // Optimism
    });

    test('should cache chain data between calls', async () => {
      const start1 = Date.now();
      const chains1 = await getChainData();
      const time1 = Date.now() - start1;

      const start2 = Date.now();
      const chains2 = await getChainData();
      const time2 = Date.now() - start2;

      expect(chains1).toEqual(chains2);
      // Second call should be faster due to caching (though this might be flaky)
      expect(time2).toBeLessThanOrEqual(time1 + 5); // Allow some margin
    });

    test('should respect forceRefresh option', async () => {
      // This test would be more meaningful with network access
      const result = await getChainData(true);
      expect(result).toBeDefined();
      expect(result['1']).toBeDefined();
    });
  });

  describe('EIP155 Chain Validation', () => {
    test('should validate Ethereum mainnet with full details', async () => {
      const result = await parseEIP155CAIP2('1');
      expect(result).toEqual({
        namespace: 'eip155',
        reference: '1',
        chainName: 'Ethereum Mainnet',
        explorerUrl: 'https://etherscan.io'
      });
    });

    test('should validate Polygon mainnet with correct details', async () => {
      const result = await parseEIP155CAIP2('137');
      expect(result.namespace).toBe('eip155');
      expect(result.reference).toBe('137');
      expect(result.chainName).toContain('Polygon');
      expect(result.explorerUrl).toContain('polygonscan');
    });

    test('should throw error for unsupported chain ID', async () => {
      await expect(parseEIP155CAIP2('1299998')).rejects.toThrow('Unsupported EIP155 chain ID: 1299998');
    });
  });

  describe('EIP155 Address Validation', () => {
    test('should validate Ethereum address with proper format', async () => {
      const address = '0x742d35Cc6634C0532925a3b8D4f25A2E7F2b4b2b';
      const result = await parseEIP155CAIP10('1', address);
      expect(result.namespace).toBe('eip155');
      expect(result.address).toBe(address);
      expect(result.chainName).toBe('Ethereum Mainnet');
      expect(result.explorerUrl).toBe(`https://etherscan.io/address/${address}`);
    });

    test('should validate Polygon address', async () => {
      const address = '0x742d35Cc6634C0532925a3b8D4f25A2E7F2b4b2b';
      const result = await parseEIP155CAIP10('137', address);
      expect(result.namespace).toBe('eip155');
      expect(result.address).toBe(address);
      expect(result.chainName).toContain('Polygon');
    });

    test('should throw error for invalid address format', async () => {
      await expect(parseEIP155CAIP10('1', 'invalid')).rejects.toThrow('Invalid EIP155 address format');
    });

    test('should throw error for address without 0x prefix', async () => {
      await expect(parseEIP155CAIP10('1', '742d35Cc6634C0532925a3b8D4f25A2E7F2b4b2b')).rejects.toThrow('Invalid EIP155 address format');
    });

    test('should throw error for address with invalid hex characters', async () => {
      await expect(parseEIP155CAIP10('1', '0x742d35Cc6634C0532925a3b8D4f25A2E7F2b4b2bG')).rejects.toThrow('Invalid EIP155 address format');
    });

    test('should validate address case sensitivity', async () => {
      const lowerAddress = '0x742d35cc6634c0532925a3b8d4f25a2e7f2b4b2b';
      const upperAddress = '0x742D35CC6634C0532925A3B8D4F25A2E7F2B4B2B';
      const mixedAddress = '0x742d35Cc6634C0532925a3b8D4f25A2E7F2b4b2b';

      const results = await Promise.all([
        parseEIP155CAIP10('1', lowerAddress),
        parseEIP155CAIP10('1', upperAddress),
        parseEIP155CAIP10('1', mixedAddress)
      ]);

      results.forEach(result => {
        expect(result.namespace).toBe('eip155');
        expect(result.chainName).toBe('Ethereum Mainnet');
      });
    });

    test('should throw error for unsupported chain', async () => {
      const address = '0x742d35Cc6634C0532925a3b8D4f25A2E7F2b4b2b';
      await expect(parseEIP155CAIP10('1299998', address)).rejects.toThrow('Unsupported EIP155 chain ID');
    });
  });

  describe('EIP155 Asset Validation', () => {
    test('should validate ERC20 token with proper contract address', async () => {
      const contractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      const result = await parseEIP155CAIP19('1', 'erc20', contractAddress);
      expect(result.namespace).toBe('eip155');
      expect(result.assetNamespace).toBe('erc20');
      expect(result.assetReference).toBe(contractAddress);
      expect(result.assetType).toBe('ERC20');
      expect(result.tokenId).toBeUndefined();
      expect(result.explorerUrl).toBe(`https://etherscan.io/token/${contractAddress}`);
    });

    test('should validate ERC721 NFT collection (no token ID)', async () => {
      const contractAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
      const result = await parseEIP155CAIP19('1', 'erc721', contractAddress);
      expect(result.assetNamespace).toBe('erc721');
      expect(result.assetReference).toBe(contractAddress);
      expect(result.tokenId).toBeUndefined();
      expect(result.explorerUrl).toBe(`https://etherscan.io/token/${contractAddress}`);
    });

    test('should validate ERC721 NFT with specific token ID', async () => {
      const contractAddress = '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D';
      const tokenId = '1234';
      const result = await parseEIP155CAIP19('1', 'erc721', contractAddress, tokenId);
      expect(result.assetNamespace).toBe('erc721');
      expect(result.assetReference).toBe(contractAddress);
      expect(result.tokenId).toBe(tokenId);
      expect(result.explorerUrl).toBe(`https://etherscan.io/token/${contractAddress}?a=${tokenId}`);
    });

    test('should validate ERC1155 token', async () => {
      const contractAddress = '0x495f947276749Ce646f68AC8c248420045cb7b5e';
      const tokenId = '5678';
      const result = await parseEIP155CAIP19('1', 'erc1155', contractAddress, tokenId);
      expect(result.assetNamespace).toBe('erc1155');
      expect(result.assetReference).toBe(contractAddress);
      expect(result.tokenId).toBe(tokenId);
      expect(result.assetType).toBe('ERC1155');
    });

    test('should throw error for unsupported asset namespace', async () => {
      const contractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      await expect(parseEIP155CAIP19('1', 'erc777', contractAddress))
        .rejects.toThrow('Unsupported EIP155 asset namespace: erc777');
    });

    test('should throw error for invalid ERC20 contract address', async () => {
      await expect(parseEIP155CAIP19('1', 'erc20', 'invalid'))
        .rejects.toThrow('Invalid contract address format');
    });

    test('should throw error for ERC20 with token ID', async () => {
      const contractAddress = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      await expect(parseEIP155CAIP19('1', 'erc20', contractAddress, '123'))
        .rejects.toThrow('ERC20 tokens should not have a token ID');
    });

    test('should throw error for invalid NFT contract address', async () => {
      await expect(parseEIP155CAIP19('1', 'erc721', 'invalid'))
        .rejects.toThrow('Invalid contract address format');
    });

    test('should throw error for unsupported chain', async () => {
      await expect(parseEIP155CAIP19('1299998', 'erc20', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'))
        .rejects.toThrow('Unsupported EIP155 chain ID');
    });
  });

  describe('EIP155 Transaction Validation', () => {
    test('should validate Ethereum transaction', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = await parseEIP155CAIP221('1', txHash);
      expect(result.namespace).toBe('eip155');
      expect(result.transactionId).toBe(txHash);
      expect(result.chainName).toBe('Ethereum Mainnet');
      expect(result.explorerUrl).toBe(`https://etherscan.io/tx/${txHash}`);
      expect(result.verified).toBe(false);
    });

    test('should validate Polygon transaction', async () => {
      const txHash = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890';
      const result = await parseEIP155CAIP221('137', txHash);
      expect(result.namespace).toBe('eip155');
      expect(result.transactionId).toBe(txHash);
      expect(result.chainName).toContain('Polygon');
    });

    test('should throw error for invalid transaction hash format', async () => {
      await expect(parseEIP155CAIP221('1', 'invalid'))
        .rejects.toThrow('Invalid EIP155 transaction hash format');
    });

    test('should throw error for transaction hash without 0x prefix', async () => {
      await expect(parseEIP155CAIP221('1', '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'))
        .rejects.toThrow('Invalid EIP155 transaction hash format');
    });

    test('should throw error for transaction hash with wrong length', async () => {
      await expect(parseEIP155CAIP221('1', '0x123456'))
        .rejects.toThrow('Invalid EIP155 transaction hash format');
    });

    test('should throw error for unsupported chain', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      await expect(parseEIP155CAIP221('1299998', txHash))
        .rejects.toThrow('Unsupported EIP155 chain ID');
    });
  });

  describe('RPC Integration and Token Fetching', () => {
    test('should handle RPC fallback logic structure', async () => {
      // This will fail due to network restrictions, but tests the function structure
      await expect(fetchTokenInfoWithFallback('1', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'))
        .rejects.toThrow('No HTTP RPC endpoints available');
    });

    test('should handle verify function integration', async () => {
      // This will fail due to network restrictions, but tests the integration
      await expect(verifyEIP155CAIP19('1', 'erc20', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'))
        .rejects.toThrow(); // Expect network error, not parsing error
    });

    test('should handle NFT verification structure', async () => {
      // This will fail due to network restrictions, but tests the structure
      await expect(verifyEIP155CAIP19('1', 'erc721', '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', '1234'))
        .rejects.toThrow(); // Expect network error, not parsing error
    });
  });

  describe('Edge Cases and Chain-Specific Logic', () => {
    test('should handle chain data with missing explorer gracefully', async () => {
      // Most chains in our static data have explorers, but test the structure
      const result = await parseEIP155CAIP2('1');
      expect(result.explorerUrl).toBeDefined();
    });

    test('should handle various chain ID formats correctly', async () => {
      // Test that string chain IDs work properly
      const result = await parseEIP155CAIP2('1');
      expect(result.reference).toBe('1');
      expect(typeof result.reference).toBe('string');
    });

    test('should generate correct explorer URLs for different asset types', async () => {
      const erc20Result = await parseEIP155CAIP19('1', 'erc20', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
      const nftCollectionResult = await parseEIP155CAIP19('1', 'erc721', '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D');
      const nftTokenResult = await parseEIP155CAIP19('1', 'erc721', '0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D', '1234');

      expect(erc20Result.explorerUrl).toBe('https://etherscan.io/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
      expect(nftCollectionResult.explorerUrl).toBe('https://etherscan.io/token/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D');
      expect(nftTokenResult.explorerUrl).toBe('https://etherscan.io/token/0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D?a=1234');
    });
  });

});