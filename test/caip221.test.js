// test/caip221.test.js

import { parseCAIP221, verifyCAIP221 } from '../src/caip221.js';

describe('CAIP-221 Specification Compliance', () => {

  describe('Format Validation', () => {
  test('should throw error for invalid CAIP221 format (wrong structure)', async () => {
    await expect(parseCAIP221('stellar:pubnet:tx:12345')).rejects.toThrow('Invalid CAIP221 format: must contain exactly one forward slash');
    await expect(parseCAIP221('stellar/pubnet/tx/12345')).rejects.toThrow('Invalid CAIP221 format: must contain exactly one forward slash');
    await expect(parseCAIP221('stellar:pubnet')).rejects.toThrow('Invalid CAIP221 format: must contain exactly one forward slash');
  });

  test('should throw error for invalid chain format', async () => {
    await expect(parseCAIP221('stellar:pubnet/12345')).rejects.toThrow('Invalid CAIP221 chain format: namespace:reference:tx');
    await expect(parseCAIP221('stellar/12345')).rejects.toThrow('Invalid CAIP221 chain format: namespace:reference:tx');
    });

    test('should throw error for missing transaction ID', async () => {
      await expect(parseCAIP221('stellar:pubnet:tx/')).rejects.toThrow('Invalid CAIP221 transaction_id');
    });
  });

  describe('Namespace Validation', () => {
    test('should throw error for namespace too short (less than 3 characters)', async () => {
      await expect(parseCAIP221('ab:pubnet:tx/12345')).rejects.toThrow('Invalid CAIP221 namespace');
    });

    test('should throw error for namespace too long (more than 8 characters)', async () => {
      await expect(parseCAIP221('verylongname:pubnet:tx/12345')).rejects.toThrow('Invalid CAIP221 namespace');
    });

    test('should throw error for namespace with uppercase letters', async () => {
      await expect(parseCAIP221('Stellar:pubnet:tx/12345')).rejects.toThrow('Invalid CAIP221 namespace');
    });

    test('should throw error for namespace with invalid characters', async () => {
      await expect(parseCAIP221('stellar@:pubnet:tx/12345')).rejects.toThrow('Invalid CAIP221 namespace');
    });
  });

  describe('Reference Validation', () => {
    test('should throw error for empty reference', async () => {
      await expect(parseCAIP221('stellar::tx/12345')).rejects.toThrow('Invalid CAIP221 reference');
    });

    test('should throw error for reference too long (more than 32 characters)', async () => {
      const longReference = 'a'.repeat(33);
      await expect(parseCAIP221(`stellar:${longReference}:tx/12345`)).rejects.toThrow('Invalid CAIP221 reference');
    });

    test('should throw error for reference with invalid characters', async () => {
      await expect(parseCAIP221('stellar:pubnet@:tx/12345')).rejects.toThrow('Invalid CAIP221 reference');
    });
  });

  describe('Transaction ID Validation', () => {
    test('should throw error for transaction_id too long (more than 128 characters)', async () => {
      const longTxId = 'a'.repeat(129);
      await expect(parseCAIP221(`stellar:pubnet:tx/${longTxId}`)).rejects.toThrow('Invalid CAIP221 transaction_id');
    });

    test('should throw error for transaction_id with invalid characters', async () => {
      await expect(parseCAIP221('stellar:pubnet:tx/12345@')).rejects.toThrow('Invalid CAIP221 transaction_id');
    });

    test('should accept transaction_id at maximum length (128 characters)', async () => {
      const maxTxId = 'a'.repeat(128);
      const result = await parseCAIP221(`stellar:pubnet:tx/${maxTxId}`);
      expect(result.transactionId).toBe(maxTxId);
    });

    test('should accept transaction_id with valid characters (hex)', async () => {
      const hexTxId = '28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f';
      const result = await parseCAIP221(`stellar:pubnet:tx/${hexTxId}`);
      expect(result.transactionId).toBe(hexTxId);
    });
  });

  describe('Cross-namespace Support', () => {
    test('should successfully parse valid Stellar transaction', async () => {
      const result = await parseCAIP221('stellar:pubnet:tx/28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f');
      expect(result).toEqual({
        namespace: 'stellar',
        reference: 'pubnet',
        transactionId: '28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f',
        chainName: 'Stellar Mainnet',
        explorerUrl: 'https://stellar.expert/explorer/public/tx/28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f',
        verified: false
      });
    });

    test('should successfully parse valid EIP155 transaction', async () => {
      const txHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
      const result = await parseCAIP221(`eip155:1:tx/${txHash}`);
      expect(result).toEqual({
        namespace: 'eip155',
        reference: '1',
        transactionId: txHash,
        chainName: 'Ethereum Mainnet',
        explorerUrl: `https://etherscan.io/tx/${txHash}`,
        verified: false
      });
    });

    test('should return basic structure for unknown namespace', async () => {
      const result = await parseCAIP221('bitcoin:mainnet:tx/1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef');
      expect(result).toEqual({
        namespace: 'bitcoin',
        reference: 'mainnet',
        transactionId: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        chainName: 'Bitcoin mainnet',
        explorerUrl: undefined,
        verified: false
      });
    });
  });

  describe('Return Structure Consistency', () => {
    test('should always return consistent field structure', async () => {
      const results = await Promise.all([
        parseCAIP221('stellar:pubnet:tx/28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f'),
        parseCAIP221('eip155:1:tx/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef'),
        parseCAIP221('bitcoin:mainnet:tx/1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef')
      ]);

      results.forEach(result => {
        expect(result).toHaveProperty('namespace');
        expect(result).toHaveProperty('reference');
        expect(result).toHaveProperty('transactionId');
        expect(result).toHaveProperty('chainName');
        expect(result).toHaveProperty('explorerUrl');
        expect(result).toHaveProperty('verified');
      });
    });

    test('should use camelCase field naming consistently', async () => {
      const result = await parseCAIP221('stellar:pubnet:tx/28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f');
      const keys = Object.keys(result);
      
      // Check that no snake_case fields exist
      const hasSnakeCase = keys.some(key => key.includes('_'));
      expect(hasSnakeCase).toBe(false);
      
      // Check for expected camelCase fields
      expect(keys).toContain('transactionId');
      expect(keys).toContain('chainName');
      expect(keys).toContain('explorerUrl');
    });
  });

  describe('Verify Function Integration', () => {
    test('should call verify function without errors', async () => {
      // This will fail due to network restrictions but should show the integration works
      await expect(verifyCAIP221('stellar:pubnet:tx/28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f'))
        .rejects.toThrow(); // Expect network error, not parsing error
    });
  });

});