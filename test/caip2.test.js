// test/caip2.test.js

import { parseCAIP2 } from '../src/caip2.js';

describe('CAIP-2 Specification Compliance', () => {

  describe('Format Validation', () => {
    test('should throw an error for invalid CAIP2 format (no colon)', async () => {
      const invalidCAIP2 = "dsifjaoefeowajrfioewjro";
      await expect(parseCAIP2(invalidCAIP2)).rejects.toThrow('Invalid CAIP2 format');
    });

    test('should throw error for too many parts', async () => {
      await expect(parseCAIP2('stellar:pubnet:extra')).rejects.toThrow('Invalid CAIP2 format');
    });
  });

  describe('Namespace Validation', () => {
    test('should throw error for namespace too short (less than 3 characters)', async () => {
      await expect(parseCAIP2('ab:pubnet')).rejects.toThrow('Invalid CAIP2 namespace');
    });

    test('should throw error for namespace too long (more than 8 characters)', async () => {
      await expect(parseCAIP2('verylongname:pubnet')).rejects.toThrow('Invalid CAIP2 namespace');
    });

    test('should throw error for namespace with uppercase letters', async () => {
      await expect(parseCAIP2('Stellar:pubnet')).rejects.toThrow('Invalid CAIP2 namespace');
    });

    test('should throw error for namespace with invalid characters', async () => {
      await expect(parseCAIP2('stellar@:pubnet')).rejects.toThrow('Invalid CAIP2 namespace');
    });
  });

  describe('Reference Validation', () => {
    test('should throw error for empty reference', async () => {
      await expect(parseCAIP2('stellar:')).rejects.toThrow('Invalid CAIP2 reference');
    });

    test('should throw error for reference too long (more than 32 characters)', async () => {
      const longReference = 'a'.repeat(33);
      await expect(parseCAIP2(`stellar:${longReference}`)).rejects.toThrow('Invalid CAIP2 reference');
    });

    test('should throw error for reference with invalid characters', async () => {
      await expect(parseCAIP2('stellar:pubnet@')).rejects.toThrow('Invalid CAIP2 reference');
    });

    test('should accept valid reference with mixed case, numbers, hyphens, and underscores', async () => {
      await expect(parseCAIP2('stellar:Test_Net-123')).rejects.toThrow('Unsupported Stellar namespace reference'); // Should pass reference validation but fail on unknown
    });

    test('should accept reference at maximum length (32 characters)', async () => {
      const maxReference = 'a'.repeat(32);
      await expect(parseCAIP2(`stellar:${maxReference}`)).rejects.toThrow('Unsupported Stellar namespace reference'); // Should pass reference validation
    });

    test('should accept reference at minimum length (1 character)', async () => {
      await expect(parseCAIP2('stellar:a')).rejects.toThrow('Unsupported Stellar namespace reference'); // Should pass reference validation
    });
  });

  describe('Cross-namespace Support', () => {
    test('should correctly parse a valid Stellar CAIP-2 id', async () => {
      const validCAIP2 = "stellar:pubnet";
      const parsed = await parseCAIP2(validCAIP2);

      expect(parsed).toEqual({
        namespace: 'stellar',
        reference: 'pubnet',
        chainName: 'Stellar Mainnet',
        explorerUrl: 'https://stellar.expert/explorer/public'
      });
    });

    test('should correctly parse a valid EIP155 CAIP-2 id', async () => {
      const validCAIP2 = "eip155:1";
      const parsed = await parseCAIP2(validCAIP2);

      expect(parsed).toEqual({
        namespace: 'eip155',
        reference: '1',
        chainName: 'Ethereum Mainnet',
        explorerUrl: 'https://etherscan.io'
      });
    });

    test('should return basic structure for unknown namespace', async () => {
      const unknownCAIP2 = "unknown:test";
      const parsed = await parseCAIP2(unknownCAIP2);

      expect(parsed).toEqual({
        namespace: 'unknown',
        reference: 'test',
        chainName: 'Unknown test',
        explorerUrl: undefined
      });
    });
  });

  describe('Return Structure Consistency', () => {
    test('should always return consistent field structure', async () => {
      const results = await Promise.all([
        parseCAIP2('stellar:pubnet'),
        parseCAIP2('eip155:1'),
        parseCAIP2('bitcoin:mainnet')
      ]);

      results.forEach(result => {
        expect(result).toHaveProperty('namespace');
        expect(result).toHaveProperty('reference');
        expect(result).toHaveProperty('chainName');
        expect(result).toHaveProperty('explorerUrl');
      });
    });

    test('should use camelCase field naming consistently', async () => {
      const result = await parseCAIP2('stellar:pubnet');
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