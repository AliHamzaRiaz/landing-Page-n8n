import { encryptSecret, decryptSecret } from './token-crypto';

describe('token-crypto', () => {
  const key = 'a'.repeat(64);

  it('encrypts and decrypts a Meta access token', () => {
    const token = 'EAAB-test-token';
    const encrypted = encryptSecret(token, key);
    expect(encrypted).not.toContain(token);
    expect(decryptSecret(encrypted, key)).toBe(token);
  });

  it('produces different ciphertext for the same token', () => {
    const token = 'EAAB-test-token';
    expect(encryptSecret(token, key)).not.toBe(encryptSecret(token, key));
  });
});
