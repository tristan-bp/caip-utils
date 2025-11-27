// test/namespaces/stellar.test.js

import { fetchStellarAssetInfo, fetchStellarTransactionInfo, validateStellarCAIP19 } from '../../src/namespaces/stellar.js';

describe('Stellar Tests', () => {

  test('should correctly fetch a valid Stellar asset info', async () => {
    const validAssetInfo = await fetchStellarAssetInfo('USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');

    expect(validAssetInfo).toBeDefined();
  });

  test('should return null for unknown Stellar asset info', async () => {
    const result = await fetchStellarAssetInfo("USDC-GINVALIDISSUER");
    expect(result).toBeNull();
  });

  test('should correctly check a valid Stellar transaction', async () => {
    const transactionHash = '28ca90240d17b8d59b7b5a55d4494214befa5afb4feeb09bc43676c5e734e81f';

    const result = await fetchStellarTransactionInfo(transactionHash);
    
    expect(result).toBeDefined();
    expect(result.status).toBeDefined();
  });

  // validateStellarCAIP19 Tests
  describe('validateStellarCAIP19', () => {
    
    test('should validate native Stellar token (slip44) correctly', async () => {
      const result = await validateStellarCAIP19('pubnet', 'slip44', '148');
      expect(result).toEqual({
        namespace: 'stellar',
        reference: 'pubnet',
        assetNamespace: 'slip44',
        assetReference: '148',
        explorerUrl: 'https://stellar.expert/explorer/public/asset/XLM',
        symbol: 'XLM',
        isNativeToken: true,
        verifiedOnChain: true
      });
    });

    test('should throw error for wrong slip44 asset_reference', async () => {
      await expect(validateStellarCAIP19('pubnet', 'slip44', '60'))
        .rejects.toThrow('Wrong slip44 asset_reference');
    });

    test('should validate valid Stellar asset', async () => {
      const result = await validateStellarCAIP19('pubnet', 'asset', 'USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
      expect(result.namespace).toBe('stellar');
      expect(result.reference).toBe('pubnet');
      expect(result.assetNamespace).toBe('asset');
      expect(result.assetReference).toBe('USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
      expect(result.symbol).toBe('USDC');
      expect(result.isNativeToken).toBe(false);
      expect(result.verifiedOnChain).toBe(true);
      expect(result.explorerUrl).toBeDefined();
    });

    test('should throw error for invalid asset reference', async () => {
      await expect(validateStellarCAIP19('pubnet', 'asset', 'INVALID-INVALIDISSUER'))
        .rejects.toThrow('Cannot fetch asset info');
    });

    test('should throw error for unsupported asset namespace', async () => {
      await expect(validateStellarCAIP19('pubnet', 'unsupported', 'anything'))
        .rejects.toThrow('Only stellar assets and XLM native token are supported at this time');
    });

    test('should throw error for unsupported chainId', async () => {
      await expect(validateStellarCAIP19('testnet', 'slip44', '148'))
        .rejects.toThrow('Unsupported Stellar reference');
    });

    test('should throw error for invalid chainId', async () => {
      await expect(validateStellarCAIP19('invalid', 'slip44', '148'))
        .rejects.toThrow('Unsupported Stellar reference');
    });

    test('should throw error for empty chainId', async () => {
      await expect(validateStellarCAIP19('', 'slip44', '148'))
        .rejects.toThrow('Unsupported Stellar reference');
    });

  });

});
