import { describe, it, expect } from 'vitest'
import { generateCodeVerifier, generateCodeChallenge, generatePKCEPair } from '../utils/pkce'

describe('PKCE Utilities', () => {
  describe('generateCodeVerifier', () => {
    it('should generate a string of the correct length', () => {
      const verifier = generateCodeVerifier(64)
      expect(verifier).toHaveLength(64)
      expect(typeof verifier).toBe('string')
    })

    it('should generate strings within valid length range', () => {
      expect(() => generateCodeVerifier(43)).not.toThrow()
      expect(() => generateCodeVerifier(128)).not.toThrow()
      expect(() => generateCodeVerifier(42)).toThrow()
      expect(() => generateCodeVerifier(129)).toThrow()
    })

    it('should only contain valid characters', () => {
      const verifier = generateCodeVerifier(100)
      const validChars = /^[A-Za-z0-9\-._~]+$/
      expect(validChars.test(verifier)).toBe(true)
    })

    it('should generate different values on each call', () => {
      const verifier1 = generateCodeVerifier(64)
      const verifier2 = generateCodeVerifier(64)
      expect(verifier1).not.toBe(verifier2)
    })
  })

  describe('generateCodeChallenge', () => {
    it('should generate a base64url-encoded challenge', async () => {
      const verifier = 'test-verifier-string'
      const challenge = await generateCodeChallenge(verifier)

      // Should be base64url encoded (no +, /, =)
      expect(challenge).not.toContain('+')
      expect(challenge).not.toContain('/')
      expect(challenge).not.toContain('=')

      // Should be a string
      expect(typeof challenge).toBe('string')
      expect(challenge.length).toBeGreaterThan(0)
    })

    it('should generate consistent challenges for the same input', async () => {
      const verifier = 'consistent-test-input'
      const challenge1 = await generateCodeChallenge(verifier)
      const challenge2 = await generateCodeChallenge(verifier)
      expect(challenge1).toBe(challenge2)
    })

    it('should generate different challenges for different inputs', async () => {
      const challenge1 = await generateCodeChallenge('input1')
      const challenge2 = await generateCodeChallenge('input2')
      expect(challenge1).not.toBe(challenge2)
    })
  })

  describe('generatePKCEPair', () => {
    it('should generate a valid PKCE pair', async () => {
      const pair = await generatePKCEPair()

      expect(pair).toHaveProperty('codeVerifier')
      expect(pair).toHaveProperty('codeChallenge')
      expect(typeof pair.codeVerifier).toBe('string')
      expect(typeof pair.codeChallenge).toBe('string')
      expect(pair.codeVerifier.length).toBeGreaterThanOrEqual(43)
      expect(pair.codeVerifier.length).toBeLessThanOrEqual(128)
    })

    it('should generate matching verifier and challenge', async () => {
      const pair = await generatePKCEPair()
      const expectedChallenge = await generateCodeChallenge(pair.codeVerifier)
      expect(pair.codeChallenge).toBe(expectedChallenge)
    })
  })
})