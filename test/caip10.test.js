// test/caip10.test.js

import { parseCAIP10 } from '../src/caip10.js';

describe('CAIP10 Tests', () => {

  test('should correctly parse a standard CAIP10 identifier for Stellar', () => {
    const standardCAIP10 = 'stellar:pubnet:GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK';
    const result = parseCAIP10(standardCAIP10);

    expect(result).toEqual({
      namespace: 'stellar',
      reference: 'pubnet',
      address: 'GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK',
      humanReadableName: 'Stellar Mainnet Account: GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK',
      explorerUrl: 'https://stellar.expert/explorer/public/account/GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK'
    });
  });

  test('should return address info for non-Stellar chains', () => {
    const ethereumCAIP10 = 'eip155:1:0x1234567890123456789012345678901234567890';
    const result = parseCAIP10(ethereumCAIP10);

    expect(result).toEqual({
      namespace: 'eip155',
      reference: '1',
      address: '0x1234567890123456789012345678901234567890'
    });
  });

  test('should return address info for Stellar with different chainId', () => {
    const stellarTestnet = 'stellar:testnet:GCKFBEIYTKP5RDBKX6XVQQ2YBZJQKJ4XQMF7XJKFBKJQKJ4XQMF7XJK';

    expect(() => parseCAIP10(stellarTestnet)).toThrow('Unsupported Stellar namespace reference');
  });

  test('should throw error for invalid CAIP10 format with too few parts', () => {
    const invalidCAIP10 = 'stellar:pubnet';
    
    expect(() => parseCAIP10(invalidCAIP10)).toThrow('Invalid CAIP10');
  });

  test('should throw error for invalid CAIP10 format with too many parts', () => {
    const invalidCAIP10 = 'did:pkh:stellar:pubnet:address:extra:parts';
    
    expect(() => parseCAIP10(invalidCAIP10)).toThrow('Invalid CAIP10');
  });

  test('should throw error for plain address without chain info', () => {
    const plainAddress = '1234567890abcdef1234567890abcdef1234567890';
    
    expect(() => parseCAIP10(plainAddress)).toThrow('Invalid CAIP10');
  });

  test('should handle empty string', () => {
    expect(() => parseCAIP10('')).toThrow('Invalid CAIP10');
  });

  test('should handle Bitcoin CAIP10', () => {
    const bitcoinCAIP10 = 'bip122:000000000019d6689c085ae165831e93:1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa';
    const result = parseCAIP10(bitcoinCAIP10);

    expect(result).toEqual({
      namespace: 'bip122',
      reference: '000000000019d6689c085ae165831e93',
      address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
    });
  });

  // Namespace validation tests
  test('should throw error for namespace too short (less than 3 characters)', () => {
    expect(() => parseCAIP10('ab:pubnet:GABC123')).toThrow('Invalid CAIP10 namespace');
  });

  test('should throw error for namespace too long (more than 8 characters)', () => {
    expect(() => parseCAIP10('verylongname:pubnet:GABC123')).toThrow('Invalid CAIP10 namespace');
  });

  test('should throw error for namespace with uppercase letters', () => {
    expect(() => parseCAIP10('Stellar:pubnet:GABC123')).toThrow('Invalid CAIP10 namespace');
  });

  test('should throw error for namespace with invalid characters', () => {
    expect(() => parseCAIP10('stellar@:pubnet:GABC123')).toThrow('Invalid CAIP10 namespace');
  });

  // Reference validation tests
  test('should throw error for empty reference', () => {
    expect(() => parseCAIP10('stellar::GABC123')).toThrow('Invalid CAIP10 reference');
  });

  test('should throw error for reference too long (more than 32 characters)', () => {
    const longReference = 'a'.repeat(33);
    expect(() => parseCAIP10(`stellar:${longReference}:GABC123`)).toThrow('Invalid CAIP10 reference');
  });

  test('should throw error for reference with invalid characters', () => {
    expect(() => parseCAIP10('stellar:pubnet@:GABC123')).toThrow('Invalid CAIP10 reference');
  });

  // Address validation tests
  test('should throw error for empty address', () => {
    expect(() => parseCAIP10('stellar:pubnet:')).toThrow('Invalid CAIP10 address');
  });

  test('should throw error for address too long (more than 128 characters)', () => {
    const longAddress = 'a'.repeat(129);
    expect(() => parseCAIP10(`stellar:pubnet:${longAddress}`)).toThrow('Invalid CAIP10 address');
  });

  test('should throw error for address with invalid characters', () => {
    expect(() => parseCAIP10('stellar:pubnet:GABC123@')).toThrow('Invalid CAIP10 address');
  });

  test('should accept address with dots and percent signs', () => {
    const result = parseCAIP10('stellar:pubnet:test.address%20encoded');
    expect(result).toEqual({
      namespace: 'stellar',
      reference: 'pubnet',
      address: 'test.address%20encoded',
      humanReadableName: 'Stellar Mainnet Account: test.address%20encoded',
      explorerUrl: 'https://stellar.expert/explorer/public/account/test.address%20encoded'
    });
  });

  test('should accept address at maximum length (128 characters)', () => {
    const maxAddress = 'a'.repeat(128);
    const result = parseCAIP10(`stellar:pubnet:${maxAddress}`);
    expect(result.address).toBe(maxAddress);
  });

});
