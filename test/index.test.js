// test/index.test.js

import { 
  parseCAIP2, 
  parseCAIP10, 
  parseCAIP19, 
  parseCAIP221,
  verifyCAIP19,
  verifyCAIP221
} from '../src/index.js';

describe('CAIP Utils Library Integration', () => {

  describe('Library Exports', () => {
    test('should export all main parsing functions', () => {
      expect(parseCAIP2).toBeDefined();
      expect(parseCAIP10).toBeDefined();
      expect(parseCAIP19).toBeDefined();
      expect(parseCAIP221).toBeDefined();
    });

    test('should export verification functions', () => {
      expect(verifyCAIP19).toBeDefined();
      expect(verifyCAIP221).toBeDefined();
    });
  });

  describe('Cross-CAIP Integration', () => {
    test('should handle all CAIP types with consistent field naming', async () => {
      const results = await Promise.all([
        parseCAIP2('eip155:1'),
        parseCAIP10('eip155:1:0x742d35Cc6634C0532925a3b8D6Ac6c4c7c2e1166'),
        parseCAIP19('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
        parseCAIP221('eip155:1:tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
      ]);

      // All results should use camelCase consistently
      results.forEach(result => {
        const keys = Object.keys(result);
        const hasSnakeCase = keys.some(key => key.includes('_'));
        expect(hasSnakeCase).toBe(false);
      });
    });

    test('should handle Stellar namespace across all CAIP types', async () => {
      const results = await Promise.all([
        parseCAIP2('stellar:pubnet'),
        parseCAIP10('stellar:pubnet:GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK'),
        parseCAIP19('stellar:pubnet/slip44:148'),
        parseCAIP221('stellar:pubnet:tx/28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f')
      ]);

      results.forEach(result => {
        expect(result.namespace).toBe('stellar');
        expect(result.reference).toBe('pubnet');
        expect(result.chainName).toBe('Stellar Mainnet');
        expect(result.explorerUrl).toContain('stellar.expert');
      });
    });

    test('should handle EIP155 namespace across all CAIP types', async () => {
      const results = await Promise.all([
        parseCAIP2('eip155:1'),
        parseCAIP10('eip155:1:0x742d35Cc6634C0532925a3b8D6Ac6c4c7c2e1166'),
        parseCAIP19('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
        parseCAIP221('eip155:1:tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
      ]);

      results.forEach(result => {
        expect(result.namespace).toBe('eip155');
        expect(result.reference).toBe('1');
        expect(result.chainName).toBe('Ethereum Mainnet');
        expect(result.explorerUrl).toContain('etherscan.io');
      });
    });
  });

  describe('Library Consistency', () => {
    test('should return consistent base fields across all CAIP types', async () => {
      const caip2 = await parseCAIP2('eip155:1');
      const caip10 = await parseCAIP10('eip155:1:0x742d35Cc6634C0532925a3b8D6Ac6c4c7c2e1166');
      const caip19 = await parseCAIP19('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
      const caip221 = await parseCAIP221('eip155:1:tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');

      // All should have these base fields
      [caip2, caip10, caip19, caip221].forEach(result => {
        expect(result).toHaveProperty('namespace');
        expect(result).toHaveProperty('reference');
        expect(result).toHaveProperty('chainName');
        expect(result).toHaveProperty('explorerUrl');
      });

      // CAIP-10 should have address
      expect(caip10).toHaveProperty('address');

      // CAIP-19 should have asset fields
      expect(caip19).toHaveProperty('assetNamespace');
      expect(caip19).toHaveProperty('assetReference');

      // CAIP-221 should have transaction fields
      expect(caip221).toHaveProperty('transactionId');
      expect(caip221).toHaveProperty('verified');
    });

    test('should handle unknown namespaces gracefully across all types', async () => {
      const results = await Promise.all([
        parseCAIP2('unknown:test'),
        parseCAIP10('unknown:test:address123'),
        parseCAIP19('unknown:test/asset:reference'),
        parseCAIP221('unknown:test:tx/transaction123')
      ]);

      results.forEach(result => {
        expect(result.namespace).toBe('unknown');
        expect(result.reference).toBe('test');
        expect(result.chainName).toContain('Unknown test');
      });
    });
  });

  describe('Error Handling Consistency', () => {
    test('should throw consistent error types for invalid formats', async () => {
      await expect(parseCAIP2('invalid')).rejects.toThrow('Invalid CAIP2 format');
      await expect(parseCAIP10('invalid')).rejects.toThrow('Invalid CAIP10');
      await expect(parseCAIP19('invalid')).rejects.toThrow('Invalid CAIP19 format');
      await expect(parseCAIP221('invalid')).rejects.toThrow('Invalid CAIP221 format');
    });

    test('should throw consistent error types for invalid namespaces', async () => {
      await expect(parseCAIP2('ab:test')).rejects.toThrow('Invalid CAIP2 namespace');
      await expect(parseCAIP10('ab:test:address')).rejects.toThrow('Invalid CAIP10 namespace');
      await expect(parseCAIP19('ab:test/asset:ref')).rejects.toThrow('Invalid CAIP19 namespace');
      await expect(parseCAIP221('ab:test:tx/hash')).rejects.toThrow('Invalid CAIP221 namespace');
    });
  });

});