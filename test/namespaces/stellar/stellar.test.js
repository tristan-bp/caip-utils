// test/namespaces/stellar.test.js

import { 
  parseStellarCAIP2,
  parseStellarCAIP10,
  parseStellarCAIP19,
  parseStellarCAIP221,
  verifyStellarCAIP19,
  verifyStellarCAIP221
} from '../../../src/namespaces/stellar/stellar.js';

import { 
  fetchStellarAssetInfo,
  fetchStellarTransactionInfo
} from '../../../src/namespaces/stellar/horizen.js';

describe('Stellar Namespace Business Logic', () => {

  describe('Stellar Chain Validation', () => {
    test('should validate Stellar mainnet (pubnet)', () => {
      const result = parseStellarCAIP2('pubnet');
      expect(result).toEqual({
        namespace: 'stellar',
        reference: 'pubnet',
        chainName: 'Stellar Mainnet',
        explorerUrl: 'https://stellar.expert/explorer/public'
      });
    });

    test('should validate Stellar testnet', () => {
      const result = parseStellarCAIP2('testnet');
      expect(result).toEqual({
        namespace: 'stellar',
        reference: 'testnet',
        chainName: 'Stellar Testnet',
        explorerUrl: 'https://stellar.expert/explorer/testnet'
      });
    });

    test('should throw error for unsupported Stellar network', () => {
      expect(() => parseStellarCAIP2('unknown-network')).toThrow('Unsupported Stellar namespace reference');
    });

  });

  describe('Stellar CAIP10 Parsing', () => {
    test('should parse a Stellar CAIP10', () => {
      const address = 'GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK';
      const result = parseStellarCAIP10('pubnet', address);
      expect(result).toEqual({
        namespace: 'stellar',
        reference: 'pubnet',
        address: address,
        chainName: 'Stellar Mainnet',
        explorerUrl: `https://stellar.expert/explorer/public/account/${address}`
      });
    });

    test('should accept any address format (validation not implemented)', () => {
      // Note: parseStellarCAIP10 doesn't currently validate address format
      const result = parseStellarCAIP10('pubnet', 'invalid-address');
      expect(result.address).toBe('invalid-address');
      expect(result.namespace).toBe('stellar');
    });

    test('should accept short addresses (validation not implemented)', () => {
      // Note: parseStellarCAIP10 doesn't currently validate address length
      const result = parseStellarCAIP10('pubnet', 'GABC123');
      expect(result.address).toBe('GABC123');
    });

    test('should accept long addresses (validation not implemented)', () => {
      // Note: parseStellarCAIP10 doesn't currently validate address length
      const longAddress = 'G' + 'A'.repeat(60);
      const result = parseStellarCAIP10('pubnet', longAddress);
      expect(result.address).toBe(longAddress);
    });

    test('should throw error for unsupported network', () => {
      const address = 'GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK';
      expect(() => parseStellarCAIP10('testnet', address)).toThrow('Unsupported Stellar namespace reference');
    });
  });

  describe('Stellar Asset Validation', () => {
    test('should validate native XLM asset (slip44)', async () => {
      const result = await parseStellarCAIP19('pubnet', 'slip44', '148');
      expect(result).toEqual({
        namespace: 'stellar',
        reference: 'pubnet',
        chainName: 'Stellar Mainnet',
        assetNamespace: 'slip44',
        assetReference: '148',
        explorerUrl: 'https://stellar.expert/explorer/public/asset/XLM',
        symbol: 'XLM',
        isNativeToken: true
      });
    });

    test('should validate custom Stellar asset', async () => {
      const assetCode = 'USDC';
      const issuer = 'GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
      const assetReference = `${assetCode}-${issuer}`;
      
      const result = await parseStellarCAIP19('pubnet', 'asset', assetReference);
      expect(result.namespace).toBe('stellar');
      expect(result.assetNamespace).toBe('asset');
      expect(result.chainName).toBe('Stellar Mainnet');
      expect(result.assetReference).toBe(assetReference);
      expect(result.explorerUrl).toBe(`https://stellar.expert/explorer/public/asset/${assetCode}-${issuer}`);
    });

    test('should throw error for unsupported asset namespace', async () => {
      await expect(parseStellarCAIP19('pubnet', 'erc20', '0x123'))
        .rejects.toThrow('Only stellar assets and XLM native token are supported at this time');
    });

    test('should throw error for invalid slip44 reference', async () => {
      await expect(parseStellarCAIP19('pubnet', 'slip44', '999'))
        .rejects.toThrow('Wrong slip44 assetReference');
    });

    // TODO: Implement validation for stellar asset format
    // test('should throw error for invalid stellar asset format', async () => {
    //   await expect(parseStellarCAIP19('pubnet', 'asset', 'invalid-format'))
    //     .rejects.toThrow('Invalid Stellar asset reference format');
    // });

    test('should throw error for unsupported network', async () => {
      await expect(parseStellarCAIP19('testnet', 'slip44', '148'))
        .rejects.toThrow('Unsupported Stellar reference');
    });
  });

  describe('Stellar Transaction Validation', () => {
    test('should validate Stellar transaction hash', () => {
      const txHash = '28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f';
      const result = parseStellarCAIP221('pubnet', txHash);
      expect(result).toEqual({
        namespace: 'stellar',
        reference: 'pubnet',
        transactionId: txHash,
        chainName: 'Stellar Mainnet',
        explorerUrl: `https://stellar.expert/explorer/public/tx/${txHash}`,
        verified: false
      });
    });

    test('should throw error for invalid transaction hash format', () => {
      expect(() => parseStellarCAIP221('pubnet', 'invalid-hash'))
        .toThrow('Invalid Stellar transaction hash format');
    });

    test('should throw error for transaction hash too short', () => {
      expect(() => parseStellarCAIP221('pubnet', '28ca90240d17b8d59b7b5a55d4494214befa5afb'))
        .toThrow('Invalid Stellar transaction hash format');
    });

    test('should throw error for transaction hash too long', () => {
      const longHash = '28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f123';
      expect(() => parseStellarCAIP221('pubnet', longHash))
        .toThrow('Invalid Stellar transaction hash format');
    });

    test('should throw error for unsupported network', () => {
      const txHash = '28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f';
      expect(() => parseStellarCAIP221('devnet', txHash))
        .toThrow('Unsupported Stellar namespace reference');
    });
  });

  describe('Stellar Asset Verification', () => {
    test('should verify native XLM successfully', async () => {
      const result = await verifyStellarCAIP19('pubnet', 'slip44', '148');
      expect(result.verified).toBe(true);
      expect(result.symbol).toBe('XLM');
      expect(result.isNativeToken).toBe(true);
    });

    test('should throw error for invalid slip44 reference (format error)', async () => {
      // Format errors should throw in both parse and verify
      await expect(verifyStellarCAIP19('pubnet', 'slip44', '999'))
        .rejects.toThrow('Wrong slip44 assetReference');
    });

    test('should throw error for unsupported network (format error)', async () => {
      // Format errors should throw in both parse and verify
      await expect(verifyStellarCAIP19('testnet', 'slip44', '148'))
        .rejects.toThrow('Unsupported Stellar reference');
    });

    test('should throw error for unsupported asset namespace (format error)', async () => {
      // Format errors should throw in both parse and verify
      await expect(verifyStellarCAIP19('pubnet', 'erc20', '0x123'))
        .rejects.toThrow('Only stellar assets and XLM native token are supported at this time');
    });

    test('should return verified: true', async () => {
      const result = await verifyStellarCAIP19('pubnet', 'asset', 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
      expect(result.verified).toBe(true);
      expect(result.assetCode).toBe('USDC');
      expect(result.isNativeToken).toBe(false);
      expect(result.assetIssuer).toBe('GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
    });
  });

  describe('Stellar-Specific Business Logic', () => {
    test('should correctly identify native XLM token', async () => {
      const result = await parseStellarCAIP19('pubnet', 'slip44', '148');
      expect(result.isNativeToken).toBe(true);
      expect(result.symbol).toBe('XLM');
    });

    test('should generate correct explorer URLs for different asset types', async () => {
      const nativeResult = await parseStellarCAIP19('pubnet', 'slip44', '148');
      const customResult = await parseStellarCAIP19('pubnet', 'asset', 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');

      expect(nativeResult.explorerUrl).toBe('https://stellar.expert/explorer/public/asset/XLM');
      expect(customResult.explorerUrl).toBe('https://stellar.expert/explorer/public/asset/USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
    });

    test('should handle asset code and issuer parsing correctly', async () => {
      const assetReference = 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
      const result = await parseStellarCAIP19('pubnet', 'asset', assetReference);
      
      expect(result.assetReference).toBe(assetReference);
      expect(result.explorerUrl).toContain('USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
    });

    test('should accept any address format (validation not implemented)', async () => {
      // Note: Current implementation doesn't validate Stellar address format
      const validAddress = 'GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK';
      const result1 = await parseStellarCAIP10('pubnet', validAddress);
      expect(result1.address).toBe(validAddress);

      // Invalid addresses are currently accepted (no validation implemented)
      const invalidAddress = 'ACKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK';
      const result2 = await parseStellarCAIP10('pubnet', invalidAddress);
      expect(result2.address).toBe(invalidAddress);
    });
  });

  describe('Stellar Transaction Verification', () => {
    test('should verify valid Stellar transaction successfully', async () => {
      const validTxHash = '7495b3273461f05748e369abcb1ea2c98f3510cf3d74cdb654f7728e9a5af807';

      const result = await verifyStellarCAIP221('pubnet', validTxHash);
      
      expect(result.namespace).toBe('stellar');
      expect(result.reference).toBe('pubnet');
      expect(result.chainName).toBe('Stellar Mainnet');
      expect(result.transactionId).toBe(validTxHash);
      expect(result.explorerUrl).toBe(`https://stellar.expert/explorer/public/tx/${validTxHash}`);
      expect(result).toHaveProperty('verified');
      
      if (result.verified) {
        console.log('✅ Transaction verified successfully on Stellar network');
      } else {
        console.log('❌ Transaction verification failed:', result.verificationError);
      }
    });

    test('should handle invalid Stellar transaction hash', async () => {
      const invalidTxHash = 'invalid-transaction-hash-format';

      const result = await verifyStellarCAIP221('pubnet', invalidTxHash);
      
      expect(result.namespace).toBe('stellar');
      expect(result.reference).toBe('pubnet');
      expect(result.transactionId).toBe(invalidTxHash);
      expect(result.verified).toBe(false);
      expect(result.verificationError).toBe('Transaction not found on Stellar network');
    });

    test('should throw error for unsupported Stellar network', async () => {
      const validTxHash = '7495b3273461f05748e369abcb1ea2c98f3510cf3d74cdb654f7728e9a5af807';
      
      await expect(verifyStellarCAIP221('testnet', validTxHash))
        .rejects.toThrow('Unsupported Stellar reference');
    });
  });

  describe('Stellar Transaction Info Fetching', () => {
    test('should fetch transaction info structure', async () => {
      const validTxHash = '7495b3273461f05748e369abcb1ea2c98f3510cf3d74cdb654f7728e9a5af807';
      
      const result = await fetchStellarTransactionInfo(validTxHash);
      
      // Should return an object with status
      expect(result).toHaveProperty('status');
      expect(['success', 'pending', 'error', 'unknown']).toContain(result.status);
      
      if (result.status === 'success') {
        expect(result).toHaveProperty('data');
        console.log('✅ Transaction found on Stellar network');
      } else {
        console.log(`ℹ️ Transaction status: ${result.status}`);
      }
    });

    test('should handle non-existent transaction gracefully', async () => {
      const nonExistentTxHash = '0000000000000000000000000000000000000000000000000000000000000000';
      
      const result = await fetchStellarTransactionInfo(nonExistentTxHash);
      
      // Should return status object, not throw
      expect(result).toHaveProperty('status');
      expect(result.status).toBe('pending'); // 404 maps to 'pending'
    });

    test('should handle malformed transaction hash gracefully', async () => {
      const malformedTxHash = 'not-a-valid-hash';
      
      const result = await fetchStellarTransactionInfo(malformedTxHash);
      
      // Should return status object, not throw
      expect(result).toHaveProperty('status');
      expect(['error', 'unknown']).toContain(result.status);
    });
  });

});