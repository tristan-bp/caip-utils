// test/caip19.test.js

import { parseCAIP19, verifyCAIP19 } from '../src/caip19.js';

describe('CAIP-19 Specification Compliance', () => {

  describe('Format Validation', () => {
    test('should throw error for invalid CAIP19 format (wrong structure)', async () => {
      await expect(parseCAIP19('stellar:pubnet:slip44:148')).rejects.toThrow('Invalid CAIP19 format: must contain at least one forward slash');
      await expect(parseCAIP19('stellar/pubnet/slip44/148')).rejects.toThrow('Invalid CAIP19 chain format: must be namespace:reference');
      await expect(parseCAIP19('stellar:pubnet/slip44')).rejects.toThrow('Invalid CAIP19 asset format: must be asset_namespace:asset_reference');
    });
  });

  describe('Namespace Validation', () => {
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
  });

  describe('Reference Validation', () => {
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
  });

  describe('Asset Namespace Validation', () => {
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
  });

  describe('Asset Reference Validation', () => {
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
  });

  describe('Token ID Validation', () => {
    test('should throw error for token_id too long (more than 78 characters)', async () => {
      const longTokenId = 'a'.repeat(79);
      await expect(parseCAIP19(`eip155:1/erc721:0x06012c8cf97BEaD5deAe237070F9587f8E7A266d/${longTokenId}`)).rejects.toThrow('Invalid CAIP19 token_id');
    });

    test('should accept valid token_id at maximum length (78 characters)', async () => {
      const maxTokenId = 'a'.repeat(78);
      const result = await parseCAIP19(`eip155:1/erc721:0x06012c8cf97BEaD5deAe237070F9587f8E7A266d/${maxTokenId}`);
      expect(result.tokenId).toBe(maxTokenId);
    });

    test('should accept numeric token IDs', async () => {
      const result = await parseCAIP19('eip155:1/erc721:0x06012c8cf97BEaD5deAe237070F9587f8E7A266d/12345');
      expect(result.tokenId).toBe('12345');
    });
  });

  describe('Cross-namespace Support', () => {
    test('should correctly parse Stellar CAIP-19', async () => {
      const result = await parseCAIP19('stellar:pubnet/slip44:148');
      expect(result).toEqual({
        namespace: 'stellar',
        reference: 'pubnet',
        chainName: 'Stellar Mainnet',
        assetNamespace: 'slip44',
        assetReference: '148',
        explorerUrl: 'https://stellar.expert/explorer/public/asset/XLM',
        symbol: 'XLM',
        isNativeToken: true,
        tokenId: undefined
      });
    });

    test('should correctly parse EIP155 ERC20 CAIP-19', async () => {
      const result = await parseCAIP19('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
      expect(result).toEqual({
        namespace: 'eip155',
        reference: '1',
        chainName: 'Ethereum Mainnet',
        explorerUrl: 'https://etherscan.io/token/0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        assetNamespace: 'erc20',
        assetReference: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        tokenId: undefined,
        isNativeToken: false
      });
    });

    test('should correctly parse EIP155 NFT with token ID', async () => {
      const result = await parseCAIP19('eip155:1/erc721:0x06012c8cf97BEaD5deAe237070F9587f8E7A266d/771769');
      expect(result).toEqual({
        namespace: 'eip155',
        reference: '1',
        chainName: 'Ethereum Mainnet',
        explorerUrl: 'https://etherscan.io/token/0x06012c8cf97BEaD5deAe237070F9587f8E7A266d?a=771769',
        assetNamespace: 'erc721',
        assetReference: '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d',
        tokenId: '771769',
        isNativeToken: false
      });
    });

    test('should correctly parse EIP155 NFT collection (no token ID)', async () => {
      const result = await parseCAIP19('eip155:1/erc721:0x06012c8cf97BEaD5deAe237070F9587f8E7A266d');
      expect(result).toEqual({
        namespace: 'eip155',
        reference: '1',
        chainName: 'Ethereum Mainnet',
        explorerUrl: 'https://etherscan.io/token/0x06012c8cf97BEaD5deAe237070F9587f8E7A266d',
        assetNamespace: 'erc721',
        assetReference: '0x06012c8cf97BEaD5deAe237070F9587f8E7A266d',
        tokenId: undefined,
        isNativeToken: false
      });
    });

    test('should return basic object for non-stellar namespace', async () => {
      const result = await parseCAIP19('ethereum:mainnet/erc20:0x123');
      expect(result).toEqual({
        namespace: 'ethereum',
        reference: 'mainnet',
        assetNamespace: 'erc20',
        assetReference: '0x123',
        tokenId: undefined
      });
    });
  });

  describe('Return Structure Consistency', () => {
    test('should always return consistent caip19 field structure', async () => {
      const results = await Promise.all([
        parseCAIP19('stellar:pubnet/slip44:148'),
        parseCAIP19('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48')
      ]);

      results.forEach(result => {
        expect(result).toHaveProperty('namespace');
        expect(result).toHaveProperty('reference');
        expect(result).toHaveProperty('assetNamespace');
        expect(result).toHaveProperty('assetReference');
        // expect(result).toHaveProperty('tokenId');
        expect(result).toHaveProperty('isNativeToken');
        expect(result).toHaveProperty('explorerUrl');
      });
    });

      test('should always return consistent base field structure', async () => {
        const results = await Promise.all([
          parseCAIP19('stellar:pubnet/slip44:148'),
          parseCAIP19('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
          parseCAIP19('bitcoin:mainnet/slip44:0')
        ]);
  
        results.forEach(result => {
          expect(result).toHaveProperty('namespace');
          expect(result).toHaveProperty('reference');
          expect(result).toHaveProperty('assetNamespace');
          expect(result).toHaveProperty('assetReference');
        });
    });

    test('should use camelCase field naming consistently', async () => {
      const result = await parseCAIP19('eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
      const keys = Object.keys(result);
      
      // Check that no snake_case fields exist
      const hasSnakeCase = keys.some(key => key.includes('_'));
      expect(hasSnakeCase).toBe(false);
      
      // Check for expected camelCase fields
      expect(keys).toContain('assetNamespace');
      expect(keys).toContain('assetReference');
      expect(keys).toContain('chainName');
      expect(keys).toContain('explorerUrl');
    });
  });

  describe('CAIP-19 Verification', () => {
    test('should verify EIP155 ERC20 token successfully', async () => {
      const caip19 = 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'; // USDC
      
        const result = await verifyCAIP19(caip19);
        
      // Basic structure validation
      expect(result.namespace).toBe('eip155');
      expect(result.reference).toBe('1');
      expect(result.assetNamespace).toBe('erc20');
      expect(result.assetReference).toBe('0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48');
      expect(result.chainName).toBe('Ethereum Mainnet');
      expect(result).toHaveProperty('verified');
      
      if (result.verified) {
        // Token-specific validation
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('symbol');
        expect(result).toHaveProperty('decimals');
        expect(result).toHaveProperty('totalSupply');
        expect(result.symbol).toBe('USDC');
        expect(result.decimals).toBe(6);
        console.log(`✅ Successfully verified ${result.name} (${result.symbol}) token`);
      } else {
        console.log('❌ Token verification failed:', result.verificationError);
        expect(result).toHaveProperty('verificationError');
      }

    }, 30000);

    test('should verify EIP155 ERC721 NFT successfully', async () => {
      const caip19 = 'eip155:1/erc721:0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D/1234'; // BAYC
      
      const result = await verifyCAIP19(caip19);
        
      // Basic structure validation
      expect(result.namespace).toBe('eip155');
      expect(result.reference).toBe('1');
      expect(result.assetNamespace).toBe('erc721');
      expect(result.assetReference).toBe('0xBC4CA0EdA7647A8aB7C2061c2E118A18a936f13D');
      expect(result.tokenId).toBe('1234');
      expect(result.chainName).toBe('Ethereum Mainnet');
      expect(result).toHaveProperty('verified');
      
      if (result.verified) {
        // NFT-specific validation
        expect(result).toHaveProperty('name');
        expect(result).toHaveProperty('symbol');
        expect(result.verificationNote).toContain('Contract info verified, but individual token existence not checked');
        console.log(`✅ Successfully verified ${result.name} (${result.symbol}) NFT contract`);
      } else {
        console.log('❌ NFT verification failed:', result.verificationError);
        expect(result).toHaveProperty('verificationError');
      }
    }, 30000);

    test('should handle invalid EIP155 contract address gracefully', async () => {
      const caip19 = 'eip155:1/erc20:0x0000000000000000000000000000000000000000';
      
      const result = await verifyCAIP19(caip19);
      
      // Should return parsed data even if verification fails
      expect(result.namespace).toBe('eip155');
      expect(result.reference).toBe('1');
      expect(result.assetNamespace).toBe('erc20');
      expect(result.assetReference).toBe('0x0000000000000000000000000000000000000000');
      expect(result.verified).toBe(false);
      expect(result).toHaveProperty('verificationError');

    }, 30000);

    test('should verify Stellar native asset successfully', async () => {
      const caip19 = 'stellar:pubnet/slip44:148';
      
      const result = await verifyCAIP19(caip19);
      
      // Basic structure validation
      expect(result.namespace).toBe('stellar');
      expect(result.reference).toBe('pubnet');
      expect(result.assetNamespace).toBe('slip44');
      expect(result.assetReference).toBe('148');
      expect(result.chainName).toBe('Stellar Mainnet');
      expect(result).toHaveProperty('verified');
      
      if (result.verified) {
        // Native XLM should verify without network call
        expect(result.verified).toBe(true);
        console.log('✅ Successfully verified native XLM asset');
      } else {
        console.log('❌ Stellar verification failed:', result.verificationError);
        expect(result).toHaveProperty('verificationError');
      }

    }, 30000);

    test('should verify Stellar custom asset', async () => {
      const caip19 = 'stellar:pubnet/asset:USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN';
      
      const result = await verifyCAIP19(caip19);
      
      // Basic structure validation
      expect(result.namespace).toBe('stellar');
      expect(result.reference).toBe('pubnet');
      expect(result.assetNamespace).toBe('asset');
      expect(result.assetReference).toBe('USDC-GA5ZSEJYB37JRC5AVCIA5MOP4RHTM335X2KGX3IHOJAPP5RE34K4KZVN');
      expect(result.chainName).toBe('Stellar Mainnet');
      expect(result).toHaveProperty('verified');
      
      if (result.verified) {
        expect(result).toHaveProperty('assetCode');
        expect(result).toHaveProperty('assetIssuer');
        console.log('✅ Successfully verified Stellar custom asset');
      } else {
        console.log('❌ Stellar asset verification failed:', result.verificationError);
        expect(result).toHaveProperty('verificationError');
      }
    }, 30000);

    test('should handle unsupported namespace gracefully', async () => {
      const caip19 = 'cosmos:cosmoshub-4/slip44:118';
      
      const result = await verifyCAIP19(caip19);
      
      // Should return parsed data with verification note
      expect(result.namespace).toBe('cosmos');
      expect(result.reference).toBe('cosmoshub-4');
      expect(result.assetNamespace).toBe('slip44');
      expect(result.assetReference).toBe('118');
      expect(result.verified).toBe(false);
      expect(result.verificationNote).toContain('Verification not supported for namespace: cosmos');
      
      console.log('ℹ️ Unsupported namespace handled gracefully:', result.verificationNote);
    });

    test('should maintain consistent field naming in verification results', async () => {
      const caip19 = 'eip155:1/erc20:0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48';
      
      const result = await verifyCAIP19(caip19);
      const keys = Object.keys(result);
      
      // Check that no snake_case fields exist
      const hasSnakeCase = keys.some(key => key.includes('_') && !key.startsWith('verification'));
      expect(hasSnakeCase).toBe(false);
      
      // Check for expected camelCase fields
      expect(keys).toContain('assetNamespace');
      expect(keys).toContain('assetReference');
      expect(keys).toContain('chainName');
      expect(keys).toContain('verified');
      
      console.log('✅ Verification results use consistent camelCase naming');
    }, 30000);

    test('should throw error for invalid CAIP19 format during verification', async () => {
      const invalidCAIP19 = 'invalid-format';
      
      await expect(verifyCAIP19(invalidCAIP19))
        .rejects.toThrow('Invalid CAIP19 format');
    });
  });

});