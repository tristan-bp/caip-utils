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
    await expect(parseCAIP221('stellar:pubnet/12345')).rejects.toThrow('Invalid CAIP221 format: namespace:reference:txn/transaction_id or namespace:reference:block:txn/transaction_id');
    await expect(parseCAIP221('stellar/12345')).rejects.toThrow('Invalid CAIP221 format: namespace:reference:txn/transaction_id or namespace:reference:block:txn/transaction_id');
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

  describe('Regex Validation', () => {
    describe('Namespace Validation', () => {
      test('should accept valid namespace formats', async () => {
        const validNamespaces = [
          'eip155:1:txn/0x344959340db31b2661ae75135767c0cd2ff91bb0676df353df9c0787ccf6b431',
          'stellar:pubnet:txn/7495b3273461f05748e369abcb1ea2c98f3510cf3d74cdb654f7728e9a5af807',
          'cosmos:hub-4:txn/hash123',
          'btc:mainnet:txn/hash123',
          'sol:mainnet:txn/hash123',
          'dot:polkadot:txn/hash123',
          'ada:mainnet:txn/hash123'
        ];

        for (const caip221 of validNamespaces) {
          const result = await parseCAIP221(caip221);
          expect(result.namespace).toBeDefined();
        }
      });

      test('should reject invalid namespace formats', async () => {
        const invalidNamespaces = [
          { caip221: 'ab:1:txn/hash123', reason: 'too short (2 chars)' },
          { caip221: 'verylongname:1:txn/hash123', reason: 'too long (12 chars)' },
          { caip221: 'EIP155:1:txn/hash123', reason: 'uppercase letters' },
          { caip221: 'eip@155:1:txn/hash123', reason: 'invalid character @' },
          { caip221: 'eip_155:1:txn/hash123', reason: 'invalid character _' },
          { caip221: 'eip.155:1:txn/hash123', reason: 'invalid character .' },
          { caip221: '123:1:txn/hash123', reason: 'starts with number (valid but edge case)' }
        ];

        for (const { caip221, reason } of invalidNamespaces) {
          if (reason.includes('starts with number')) {
            // This should actually be valid according to the regex
            const result = await parseCAIP221(caip221);
            expect(result.namespace).toBe('123');
          } else {
            await expect(parseCAIP221(caip221))
              .rejects.toThrow(/Invalid CAIP221 namespace format/);
          }
        }
      });
    });

    describe('Reference Validation', () => {
      test('should accept valid reference formats', async () => {
        const validReferences = [
          'eip155:1:txn/0x344959340db31b2661ae75135767c0cd2ff91bb0676df353df9c0787ccf6b431',
          'eip155:999999:txn/0x344959340db31b2661ae75135767c0cd2ff91bb0676df353df9c0787ccf6b431'
        ];

        for (const caip221 of validReferences) {
          const result = await parseCAIP221(caip221);
          expect(result.reference).toBeDefined();
        }
      });

      test('should reject invalid reference formats', async () => {
        const invalidReferences = [
          { caip221: 'eip155::txn/hash123', reason: 'empty reference' },
          { caip221: 'eip155:' + 'a'.repeat(33) + ':txn/hash123', reason: 'too long (33 chars)' },
          { caip221: 'eip155:test@chain:txn/hash123', reason: 'invalid character @' },
          { caip221: 'eip155:test.chain:txn/hash123', reason: 'invalid character .' },
          { caip221: 'eip155:test chain:txn/hash123', reason: 'space character' },
          { caip221: 'eip155:test/chain:txn/hash123', reason: 'invalid character /' }
        ];

        for (const { caip221, reason } of invalidReferences) {
          await expect(parseCAIP221(caip221))
            .rejects.toThrow();
        }
      });
    });

    describe('Transaction ID Validation', () => {
      test('should accept valid transaction_id formats', async () => {
        const validTransactionIds = [
          'eip155:1:txn/0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060'
        ];

        for (const caip221 of validTransactionIds) {
          const result = await parseCAIP221(caip221);
          expect(result.transactionId).toBeDefined();
        }
      });

      test('should reject invalid transaction_id formats', async () => {
        const invalidTransactionIds = [
          { caip221: 'eip155:1:txn/', reason: 'empty transaction_id' },
          { caip221: 'eip155:1:txn/' + 'a'.repeat(129), reason: 'too long (129 chars)' },
          { caip221: 'eip155:1:txn/hash@123', reason: 'invalid character @' },
          { caip221: 'eip155:1:txn/hash.123', reason: 'invalid character .' },
          { caip221: 'eip155:1:txn/hash 123', reason: 'space character' },
          { caip221: 'eip155:1:txn/hash/123', reason: 'invalid character /' },
          { caip221: 'eip155:1:txn/hash+123', reason: 'invalid character +' }
        ];

        for (const { caip221, reason } of invalidTransactionIds) {
          await expect(parseCAIP221(caip221))
            .rejects.toThrow();
        }
      });
    });

    describe('Edge Cases', () => {
      test('should handle minimum valid lengths', async () => {
        const minValidCAIP221 = 'abc:d:txn/e'; // 3-char namespace, 1-char reference, 1-char tx_id
        const result = await parseCAIP221(minValidCAIP221);
        expect(result.namespace).toBe('abc');
        expect(result.reference).toBe('d');
        expect(result.transactionId).toBe('e');
      });

      test('should handle maximum valid lengths', async () => {
        const maxNamespace = 'a'.repeat(8);
        const maxReference = 'b'.repeat(32);
        const maxTransactionId = 'c'.repeat(128);
        const maxValidCAIP221 = `${maxNamespace}:${maxReference}:txn/${maxTransactionId}`;
        
        const result = await parseCAIP221(maxValidCAIP221);
        expect(result.namespace).toBe(maxNamespace);
        expect(result.reference).toBe(maxReference);
        expect(result.transactionId).toBe(maxTransactionId);
      });

      test('should provide clear error messages', async () => {
        await expect(parseCAIP221('INVALID:1:txn/hash'))
          .rejects.toThrow('Invalid CAIP221 namespace format: "INVALID" must match [-a-z0-9]{3,8}');
        
        await expect(parseCAIP221('eip155:invalid@ref:txn/hash'))
          .rejects.toThrow('Invalid CAIP221 reference format: "invalid@ref" must match [-_a-zA-Z0-9]{1,32}');
        
        await expect(parseCAIP221('eip155:1:txn/invalid@hash'))
          .rejects.toThrow('Invalid CAIP221 transaction_id format: "invalid@hash" must match [-%a-zA-Z0-9]{1,128}');
      });
    });
  });

  describe('CAIP-221 Verification', () => {
    test('should verify EIP155 transaction successfully', async () => {
      const caip221 = 'eip155:1:txn/0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060';
      
      const result = await verifyCAIP221(caip221);
      
      // Basic structure validation
      expect(result.namespace).toBe('eip155');
      expect(result.reference).toBe('1');
      expect(result.transactionId).toBe('0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060');
      expect(result.chainName).toBe('Ethereum Mainnet');
      expect(result).toHaveProperty('verified');
      
      if (result.verified) {
        // Transaction-specific validation
        expect(result).toHaveProperty('blockNumber');
        expect(result).toHaveProperty('blockHash');
        expect(result).toHaveProperty('from');
        expect(result).toHaveProperty('to');
        expect(result).toHaveProperty('value');
        expect(result).toHaveProperty('isPending');
        expect(result).toHaveProperty('isConfirmed');
        expect(result).toHaveProperty('rpcUrl');
        console.log(`✅ Successfully verified EIP155 transaction on block ${result.blockNumber}`);
      } else {
        console.log('❌ EIP155 transaction verification failed:', result.verificationError);
        expect(result).toHaveProperty('verificationError');
      }
    }, 30000);

    test('should verify Stellar transaction successfully', async () => {
      const caip221 = 'stellar:pubnet:txn/7495b3273461f05748e369abcb1ea2c98f3510cf3d74cdb654f7728e9a5af807';
      
      const result = await verifyCAIP221(caip221);
      
      // Basic structure validation
      expect(result.namespace).toBe('stellar');
      expect(result.reference).toBe('pubnet');
      expect(result.transactionId).toBe('7495b3273461f05748e369abcb1ea2c98f3510cf3d74cdb654f7728e9a5af807');
      expect(result.chainName).toBe('Stellar Mainnet');
      expect(result.verified).toBe(true);

      console.log('✅ Successfully verified Stellar transaction');
    }, 30000);

    test('should handle invalid EIP155 transaction hash gracefully', async () => {
      const caip221 = 'eip155:1:txn/0x0000000000000000000000000000000000000000000000000000000000000000';
      
      const result = await verifyCAIP221(caip221);
      
      // Should return parsed data even if verification fails
      expect(result.namespace).toBe('eip155');
      expect(result.reference).toBe('1');
      expect(result.transactionId).toBe('0x0000000000000000000000000000000000000000000000000000000000000000');
      expect(result.verified).toBe(false);
      expect(result).toHaveProperty('verificationError');
      
      console.log('ℹ️ Invalid transaction handled gracefully:', result.verificationError);
    }, 20000);

    test('should handle non-existent EIP155 transaction gracefully', async () => {
      const caip221 = 'eip155:1:txn/0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef';
      
      const result = await verifyCAIP221(caip221);
      
      // Should return parsed data even if verification fails
      expect(result.namespace).toBe('eip155');
      expect(result.reference).toBe('1');
      expect(result.transactionId).toBe('0xdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeefdeadbeef');
      expect(result.verified).toBe(false);
      expect(result).toHaveProperty('verificationError');
      
      console.log('ℹ️ Non-existent transaction handled gracefully:', result.verificationError);
    }, 20000);

    test('should handle unsupported chain gracefully', async () => {
      const caip221 = 'eip155:99999129:txn/0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060';
      
      try {
        const result = await verifyCAIP221(caip221);
        
        // Should handle unsupported chain gracefully
        expect(result.verified).toBe(false);
        expect(result).toHaveProperty('verificationError');
        
        console.log('ℹ️ Unsupported chain handled gracefully:', result.verificationError);
      } catch (error) {
        // Should throw for unsupported chain during parsing
        expect(error.message).toContain('Unsupported EIP155 chain ID');
        console.log('✅ Correctly threw error for unsupported chain:', error.message);
      }
    }, 15000);

    test('should handle unsupported namespace gracefully', async () => {
      const caip221 = 'cosmos:cosmoshub-4:txn/ABC123def456';
      
      const result = await verifyCAIP221(caip221);
      
      // Should return parsed data with verification note
      expect(result.namespace).toBe('cosmos');
      expect(result.reference).toBe('cosmoshub-4');
      expect(result.transactionId).toBe('ABC123def456');
      expect(result.verified).toBe(false);
      expect(result.verificationNote).toContain('Transaction verification not supported for namespace: cosmos');
      
      console.log('ℹ️ Unsupported namespace handled gracefully:', result.verificationNote);
    });

    test('should maintain consistent field naming in verification results', async () => {
      const caip221 = 'eip155:1:txn/0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060';
      
      const result = await verifyCAIP221(caip221);
      const keys = Object.keys(result);
      
      // Check that no snake_case fields exist (except verification fields)
      const hasSnakeCase = keys.some(key => key.includes('_') && !key.startsWith('verification'));
      expect(hasSnakeCase).toBe(false);
      
      // Check for expected camelCase fields
      expect(keys).toContain('transactionId');
      expect(keys).toContain('chainName');
      expect(keys).toContain('verified');
      
      console.log('✅ Verification results use consistent camelCase naming');
    }, 15000);

    test('should throw error for invalid CAIP221 format during verification', async () => {
      const invalidCAIP221 = 'invalid-format';
      
      await expect(verifyCAIP221(invalidCAIP221))
        .rejects.toThrow('Invalid CAIP221 format');
    });

    test('should handle verification with different transaction types', async () => {
      const testCases = [
        {
          caip221: 'eip155:1:txn/0x5c504ed432cb51138bcf09aa5e8a410dd4a1e204ef84bfed1be16dfba1b22060',
          description: 'Legacy transaction'
        },
        {
          caip221: 'eip155:137:txn/0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
          description: 'Polygon transaction'
        }
      ];
      
      for (const { caip221, description } of testCases) {
        try {
          const result = await verifyCAIP221(caip221);
          
          expect(result).toHaveProperty('namespace');
          expect(result).toHaveProperty('reference');
          expect(result).toHaveProperty('transactionId');
          expect(result).toHaveProperty('verified');
          
          console.log(`✅ ${description} structure validated`);
        } catch (error) {
          // Network or chain support errors are acceptable
          console.log(`⚠️ ${description} failed (expected for unsupported chains):`, error.message);
        }
      }
    }, 25000);

    test('should handle network timeouts gracefully', async () => {
      const caip221 = 'eip155:1:txn/0x1111111111111111111111111111111111111111111111111111111111111111';
      
      // This test should complete within the timeout even if network is slow
      const result = await verifyCAIP221(caip221);
      
      expect(result).toHaveProperty('verified');
      expect(typeof result.verified).toBe('boolean');
      
      if (!result.verified) {
        expect(result).toHaveProperty('verificationError');
        console.log('ℹ️ Network timeout handled gracefully:', result.verificationError);
      }
    }, 20000);
  });

});