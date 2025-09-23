/**
 * PKCE (Proof Key for Code Exchange) utilities for OAuth 2.0
 * Implements RFC 7636 for enhanced security in public clients
 */

/**
 * Generates a cryptographically secure random string for use as code verifier
 * @param length Length of the verifier (between 43-128 characters)
 * @returns Random string using allowed characters
 */
export function generateCodeVerifier(length: number = 64): string {
  if (length < 43 || length > 128) {
    throw new Error('Code verifier length must be between 43 and 128 characters')
  }

  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~'
  let result = ''

  // Use crypto.getRandomValues for secure random generation
  const array = new Uint8Array(length)
  crypto.getRandomValues(array)

  for (let i = 0; i < length; i++) {
    result += chars[array[i] % chars.length]
  }

  return result
}

/**
 * Generates a code challenge from a code verifier using SHA-256
 * @param codeVerifier The code verifier string
 * @returns Base64URL-encoded SHA-256 hash of the verifier
 */
export async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  // Convert string to Uint8Array
  const encoder = new TextEncoder()
  const data = encoder.encode(codeVerifier)

  // Hash with SHA-256
  const hash = await crypto.subtle.digest('SHA-256', data)

  // Convert to base64url
  const hashArray = new Uint8Array(hash)
  let base64 = btoa(String.fromCharCode(...hashArray))

  // Convert to base64url format (RFC 4648)
  return base64
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '')
}

/**
 * Generates a PKCE pair (code verifier and code challenge)
 * @param verifierLength Length of the code verifier
 * @returns Object containing both verifier and challenge
 */
export async function generatePKCEPair(verifierLength: number = 64): Promise<{
  codeVerifier: string
  codeChallenge: string
}> {
  const codeVerifier = generateCodeVerifier(verifierLength)
  const codeChallenge = await generateCodeChallenge(codeVerifier)

  return {
    codeVerifier,
    codeChallenge
  }
}