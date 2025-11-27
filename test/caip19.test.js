// test/caip19.test.js
import { parseCAIP19 } from '../src/caip19.js';

describe('CAIP19 Regex Validation Tests', () => {

  test('should throw error for invalid CAIP19 format (wrong structure)', async () => {
    await expect(parseCAIP19('stellar:pubnet:slip44:148')).rejects.toThrow('Invalid CAIP19 format: must contain exactly one forward slash');
    await expect(parseCAIP19('stellar/pubnet/slip44/148')).rejects.toThrow('Invalid CAIP19 format: must contain exactly one forward slash');
    await expect(parseCAIP19('stellar:pubnet/slip44')).rejects.toThrow('Invalid CAIP19 asset format: must be asset_namespace:asset_reference');
  });

  // Namespace validation tests
  test('should throw error for namespace too short (less than 3 characters)', async () => {
    await expect(parseCAIP19('ab:pubnet/slip44:148')).rejects.toThrow('Invalid CAIP19 namespace');
  });

  test('should throw error for namespace too long (more than 8 characters)', async () => {
    await expect(parseCAIP19('verylongname:pubnet/slip44:148')).rejects.toThrow('Invalid CAIP19 namespace');
  });

  test('should throw error for namespace with uppercase letters', async () => {
    await expect(parseCAIP19('Stellar:pubnet/slip44:148')).rejects.toThrow('Invalid CAIP19 namespace');
  });

  test('should throw error for namespace with invalid characters', async () => {
    await expect(parseCAIP19('stellar@:pubnet/slip44:148')).rejects.toThrow('Invalid CAIP19 namespace');
  });

  // Reference validation tests
  test('should throw error for empty reference', async () => {
    await expect(parseCAIP19('stellar:/slip44:148')).rejects.toThrow('Invalid CAIP19 reference');
  });

  test('should throw error for reference too long (more than 32 characters)', async () => {
    const longReference = 'a'.repeat(33);
    await expect(parseCAIP19(`stellar:${longReference}/slip44:148`)).rejects.toThrow('Invalid CAIP19 reference');
  });

  test('should throw error for reference with invalid characters', async () => {
    await expect(parseCAIP19('stellar:pubnet@/slip44:148')).rejects.toThrow('Invalid CAIP19 reference');
  });

  // Asset namespace validation tests
  test('should throw error for asset_namespace too short (less than 3 characters)', async () => {
    await expect(parseCAIP19('stellar:pubnet/ab:148')).rejects.toThrow('Invalid CAIP19 asset_namespace');
  });

  test('should throw error for asset_namespace too long (more than 8 characters)', async () => {
    await expect(parseCAIP19('stellar:pubnet/verylongname:148')).rejects.toThrow('Invalid CAIP19 asset_namespace');
  });

  test('should throw error for asset_namespace with uppercase letters', async () => {
    await expect(parseCAIP19('stellar:pubnet/Slip44:148')).rejects.toThrow('Invalid CAIP19 asset_namespace');
  });

  test('should throw error for asset_namespace with invalid characters', async () => {
    await expect(parseCAIP19('stellar:pubnet/slip44@:148')).rejects.toThrow('Invalid CAIP19 asset_namespace');
  });

  // Asset reference validation tests
  test('should throw error for empty asset_reference', async () => {
    await expect(parseCAIP19('stellar:pubnet/slip44:')).rejects.toThrow('Invalid CAIP19 asset_reference');
  });

  test('should throw error for asset_reference too long (more than 128 characters)', async () => {
    const longAssetReference = 'a'.repeat(129);
    await expect(parseCAIP19(`stellar:pubnet/slip44:${longAssetReference}`)).rejects.toThrow('Invalid CAIP19 asset_reference');
  });

  test('should throw error for asset_reference with invalid characters', async () => {
    await expect(parseCAIP19('stellar:pubnet/slip44:148@')).rejects.toThrow('Invalid CAIP19 asset_reference');
  });

  // Test successful parsing
  test('should successfully parse valid Stellar native token', async () => {
    const result = await parseCAIP19('stellar:pubnet/slip44:148');
    expect(result).toBeDefined();
    expect(result.namespace).toBe('stellar');
    expect(result.reference).toBe('pubnet');
    expect(result.assetNamespace).toBe('slip44');
    expect(result.assetReference).toBe('148');
    expect(result.symbol).toBe('XLM');
    expect(result.isNativeToken).toBe(true);
    expect(result.verifiedOnChain).toBe(true);
    expect(result.explorerUrl).toBe('https://stellar.expert/explorer/public/asset/XLM');
  });

  test('should successfully parse valid Stellar asset', async () => {
    const result = await parseCAIP19('stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
    expect(result).toBeDefined();
    expect(result.namespace).toBe('stellar');
    expect(result.reference).toBe('pubnet');
    expect(result.assetNamespace).toBe('asset');
    expect(result.assetReference).toBe('USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
    expect(result.symbol).toBe('USDC');
    expect(result.isNativeToken).toBe(false);
    expect(result.verifiedOnChain).toBe(true);
    expect(result.explorerUrl).toBe('https://stellar.expert/explorer/public/asset/USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
  });

  test('should successfully parse valid Stellar asset', async () => {
    const result = await parseCAIP19('stellar:pubnet/asset:SHX-GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH');
    expect(result).toBeDefined();
    expect(result.namespace).toBe('stellar');
    expect(result.reference).toBe('pubnet');
    expect(result.assetNamespace).toBe('asset');
    expect(result.assetReference).toBe('SHX-GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH');
    expect(result.symbol).toBe('SHX');
    expect(result.isNativeToken).toBe(false);
    expect(result.verifiedOnChain).toBe(true);
    expect(result.explorerUrl).toBe('https://stellar.expert/explorer/public/asset/SHX-GDSTRSHXHGJ7ZIVRBXEYE5Q74XUVCUSEKEBR7UCHEUUEK72N7I7KJ6JH');
  });

  // Test non-stellar namespaces return basic object
  test('should return basic object for non-stellar namespace', async () => {
    const result = await parseCAIP19('ethereum:mainnet/erc20:0x123');
    expect(result).toEqual({
      namespace: 'ethereum',
      reference: 'mainnet',
      asset_namespace: 'erc20',
      asset_reference: '0x123'
    });
  });

  test('should pass regex validation but fail on unsupported stellar reference', async () => {
    await expect(parseCAIP19('stellar:testnet/slip44:148')).rejects.toThrow('Unsupported Stellar reference');
  });

});
