// test/caip10.test.js

import { parseCAIP10 } from '../src/caip10.js';

describe('CAIP-10 Specification Compliance', () => {

  describe('Format Validation', () => {
    test('should throw error for invalid CAIP10 format with too few parts', async () => {
      const invalidCAIP10 = 'stellar:pubnet';
      await expect(parseCAIP10(invalidCAIP10)).rejects.toThrow('Invalid CAIP10');
    });

    test('should throw error for invalid CAIP10 format with too many parts', async () => {
      const invalidCAIP10 = 'did:pkh:stellar:pubnet:address:extra:parts';
      await expect(parseCAIP10(invalidCAIP10)).rejects.toThrow('Invalid CAIP10');
    });

    test('should throw error for plain address without chain info', async () => {
      const plainAddress = '1234567890abcdef1234567890abcdef1234567890';
      await expect(parseCAIP10(plainAddress)).rejects.toThrow('Invalid CAIP10');
    });

    test('should handle empty string', async () => {
      await expect(parseCAIP10('')).rejects.toThrow('Invalid CAIP10');
    });
  });

  describe('Namespace Validation', () => {
    test('should throw error for namespace too short (less than 3 characters)', async () => {
      await expect(parseCAIP10('ab:pubnet:GABC123')).rejects.toThrow('Invalid CAIP10 namespace');
    });

    test('should throw error for namespace too long (more than 8 characters)', async () => {
      await expect(parseCAIP10('verylongname:pubnet:GABC123')).rejects.toThrow('Invalid CAIP10 namespace');
    });

    test('should throw error for namespace with uppercase letters', async () => {
      await expect(parseCAIP10('Stellar:pubnet:GABC123')).rejects.toThrow('Invalid CAIP10 namespace');
    });

    test('should throw error for namespace with invalid characters', async () => {
      await expect(parseCAIP10('stellar@:pubnet:GABC123')).rejects.toThrow('Invalid CAIP10 namespace');
    });
  });

  describe('Reference Validation', () => {
    test('should throw error for empty reference', async () => {
      await expect(parseCAIP10('stellar::GABC123')).rejects.toThrow('Invalid CAIP10 reference');
    });

    test('should throw error for reference too long (more than 32 characters)', async () => {
      const longReference = 'a'.repeat(33);
      await expect(parseCAIP10(`stellar:${longReference}:GABC123`)).rejects.toThrow('Invalid CAIP10 reference');
    });

    test('should throw error for reference with invalid characters', async () => {
      await expect(parseCAIP10('stellar:pubnet@:GABC123')).rejects.toThrow('Invalid CAIP10 reference');
    });
  });

  describe('Address Validation', () => {
    test('should throw error for empty address', async () => {
      await expect(parseCAIP10('stellar:pubnet:')).rejects.toThrow('Invalid CAIP10 address');
    });

    test('should throw error for address too long (more than 128 characters)', async () => {
      const longAddress = 'a'.repeat(129);
      await expect(parseCAIP10(`stellar:pubnet:${longAddress}`)).rejects.toThrow('Invalid CAIP10 address');
    });

    test('should throw error for address with invalid characters', async () => {
      await expect(parseCAIP10('stellar:pubnet:GABC123@')).rejects.toThrow('Invalid CAIP10 address');
    });

    test('should accept address with dots and percent signs', async () => {
      const result = await parseCAIP10('stellar:pubnet:test.address%20encoded');
      expect(result).toEqual({
        namespace: 'stellar',
        reference: 'pubnet',
        address: 'test.address%20encoded',
        chainName: 'Stellar Mainnet',
        explorerUrl: 'https://stellar.expert/explorer/public/account/test.address%20encoded'
      });
    });

    test('should accept address at maximum length (128 characters)', async () => {
      const maxAddress = 'a'.repeat(128);
      const result = await parseCAIP10(`stellar:pubnet:${maxAddress}`);
      expect(result.address).toBe(maxAddress);
    });
  });

  describe('Cross-namespace Support', () => {
    test('should correctly parse a standard CAIP10 identifier for Stellar', async () => {
      const standardCAIP10 = 'stellar:pubnet:GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK';
      const result = await parseCAIP10(standardCAIP10);

      expect(result).toEqual({
        namespace: 'stellar',
        reference: 'pubnet',
        address: 'GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK',
        chainName: 'Stellar Mainnet',
        explorerUrl: 'https://stellar.expert/explorer/public/account/GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK'
      });
    });

    test('should correctly parse EIP155 account', async () => {
      const ethereumCAIP10 = 'eip155:1:0x742d35Cc6634C0532925a3b8D6Ac6c4c7c2e1166';
      const result = await parseCAIP10(ethereumCAIP10);

      expect(result).toEqual({
        namespace: 'eip155',
        reference: '1',
        address: '0x742d35Cc6634C0532925a3b8D6Ac6c4c7c2e1166',
        chainName: 'Ethereum Mainnet',
        explorerUrl: 'https://etherscan.io/address/0x742d35Cc6634C0532925a3b8D6Ac6c4c7c2e1166'
      });
    });

    test('should handle Bitcoin CAIP10', async () => {
      const bitcoinCAIP10 = 'bip122:000000000019d6689c085ae165831e93:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
      const result = await parseCAIP10(bitcoinCAIP10);

      expect(result).toEqual({
        namespace: 'bip122',
        reference: '000000000019d6689c085ae165831e93',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        chainName: 'Bip122 000000000019d6689c085ae165831e93',
        explorerUrl: undefined
      });
    });

    test('should return address info for Stellar with different chainId', async () => {
      const stellarTestnet = 'stellar:testnet:GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK';
      await expect(parseCAIP10(stellarTestnet)).rejects.toThrow('Unsupported Stellar namespace reference');
    });
  });

  describe('Return Structure Consistency', () => {
    test('should always return consistent field structure', async () => {
      const results = await Promise.all([
        parseCAIP10('stellar:pubnet:GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK'),
        parseCAIP10('eip155:1:0x742d35Cc6634C0532925a3b8D6Ac6c4c7c2e1166'),
        parseCAIP10('bitcoin:mainnet:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
      ]);

      results.forEach(result => {
        expect(result).toHaveProperty('namespace');
        expect(result).toHaveProperty('reference');
        expect(result).toHaveProperty('address');
        expect(result).toHaveProperty('chainName');
        expect(result).toHaveProperty('explorerUrl');
      });
    });

    test('should use camelCase field naming consistently', async () => {
      const result = await parseCAIP10('stellar:pubnet:GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK');
      const keys = Object.keys(result);
      
      // Check that no snake_case fields exist
      const hasSnakeCase = keys.some(key => key.includes('_'));
      expect(hasSnakeCase).toBe(false);
      
      // Check for expected camelCase fields
      expect(keys).toContain('chainName');
      expect(keys).toContain('explorerUrl');
    });
  });

});