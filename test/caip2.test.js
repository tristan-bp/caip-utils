// test/caip2.index.test.js

import { parseCAIP2 } from '../src/caip2.js';

describe('CAIP2 Tests', () => {

  test('should correctly parse a valid CAIP2 id', () => {
    const validCAIP2 = "stellar:pubnet";
    const parsed = parseCAIP2(validCAIP2);

    expect(parsed).toEqual({
      namespace: 'stellar',
      reference: 'pubnet',
      humaneReadableName: 'Stellar Mainnet'
    });
  });

  test('should throw an error for invalid CAIP2 format (no colon)', () => {
    const invalidCAIP2 = "dsifjaoefeowajrfioewjro";

    expect(() => parseCAIP2(invalidCAIP2)).toThrow('Invalid CAIP2 format');
  });

  test('should throw an error for unknown CAIP2 id', () => {
    const validCAIP2 = "ethereum:mainnet";
    const parsed = parseCAIP2(validCAIP2);

    expect(parsed).toEqual({
      namespace: 'ethereum',
      reference: 'mainnet',
    });
  });

  // Namespace validation tests
  test('should throw error for namespace too short (less than 3 characters)', () => {
    expect(() => parseCAIP2('ab:pubnet')).toThrow('Invalid CAIP2 namespace');
  });

  test('should throw error for namespace too long (more than 8 characters)', () => {
    expect(() => parseCAIP2('verylongname:pubnet')).toThrow('Invalid CAIP2 namespace');
  });

  test('should throw error for namespace with uppercase letters', () => {
    expect(() => parseCAIP2('Stellar:pubnet')).toThrow('Invalid CAIP2 namespace');
  });

  test('should throw error for namespace with invalid characters', () => {
    expect(() => parseCAIP2('stellar@:pubnet')).toThrow('Invalid CAIP2 namespace');
  });

  // Reference validation tests
  test('should throw error for empty reference', () => {
    expect(() => parseCAIP2('stellar:')).toThrow('Invalid CAIP2 reference');
  });

  test('should throw error for reference too long (more than 32 characters)', () => {
    const longReference = 'a'.repeat(33);
    expect(() => parseCAIP2(`stellar:${longReference}`)).toThrow('Invalid CAIP2 reference');
  });

  test('should throw error for reference with invalid characters', () => {
    expect(() => parseCAIP2('stellar:pubnet@')).toThrow('Invalid CAIP2 reference');
  });

  test('should accept valid reference with mixed case, numbers, hyphens, and underscores', () => {
    expect(() => parseCAIP2('stellar:Test_Net-123')).toThrow('Unsupported Stellar namespace reference'); // Should pass reference validation but fail on unknown
  });

  test('should accept reference at maximum length (32 characters)', () => {
    const maxReference = 'a'.repeat(32);
    expect(() => parseCAIP2(`stellar:${maxReference}`)).toThrow('Unsupported Stellar namespace reference'); // Should pass reference validation
  });

  test('should accept reference at minimum length (1 character)', () => {
    expect(() => parseCAIP2('stellar:a')).toThrow('Unsupported Stellar namespace reference'); // Should pass reference validation
  });

  test('should throw error for too many parts', () => {
    expect(() => parseCAIP2('stellar:pubnet:extra')).toThrow('Invalid CAIP2 format');
  });

});
