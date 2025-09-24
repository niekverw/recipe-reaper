import { Request, Response, NextFunction } from 'express'
import { PostgreSQLDatabase } from '../models/database-pg'

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development'

// Common paths used by hackers/scanners
const SUSPICIOUS_PATHS = [
  // WordPress paths
  '/wp-admin',
  '/wp-login',
  '/wp-content',
  '/wp-includes',
  '/wordpress',
  '/wp-admin/setup-config.php',
  '/wordpress/wp-admin/setup-config.php',

  // Common CMS paths
  '/admin',
  '/administrator',
  '/login',
  '/phpmyadmin',
  '/pma',
  '/mysql',
  '/dbadmin',
  '/webmail',
  '/roundcube',
  '/squirrelmail',
  '/horde',

  // Common vulnerability scan paths
  '/.env',
  '/.git',
  '/.svn',
  '/.DS_Store',
  '/backup',
  '/bak',
  '/old',
  '/config',
  '/configuration',
  '/install',
  '/setup',
  '/test',
  '/demo',
  '/example',

  // SQL injection attempts
  '/union',
  '/select',
  '/script',

  // XSS attempts
  '/script',
  '/javascript',
  '/alert',
  '/onload',
  '/onerror',

  // Directory traversal
  '/../../../',
  '/../../',
  '/../',
  '/..\\',
  '/....//',

  // Common bot/scanner paths
  '/xmlrpc.php',
  '/readme.txt',
  '/changelog.txt',
  '/license.txt',
  '/wp-config.php',
  '/wp-config-sample.php',
]

export async function ipBlocker(req: Request, res: Response, next: NextFunction) {
  // More robust IP detection
  let clientIP = 'unknown'
  
  // First try X-Forwarded-For header (commonly set by proxies)
  const forwardedIps = req.headers['x-forwarded-for']
  if (forwardedIps) {
    // X-Forwarded-For can be comma-separated list - the leftmost is the original client
    clientIP = (Array.isArray(forwardedIps) ? forwardedIps[0] : forwardedIps.split(',')[0]).trim()
  } else {
    // Fall back to standard Express IP detection
    clientIP = req.ip || req.connection.remoteAddress || 'unknown'
  }
  
  // Check if IP is localhost/private IPs
  const isLocalhost = clientIP === '127.0.0.1' ||
                     clientIP === '::1' ||
                     clientIP === '::ffff:127.0.0.1' ||
                     clientIP.startsWith('192.168.') ||
                     clientIP.startsWith('10.') ||
                     (clientIP.startsWith('172.') && 
                      parseInt(clientIP.split('.')[1]) >= 16 && 
                      parseInt(clientIP.split('.')[1]) <= 31) ||
                     clientIP.startsWith('127.')
  
  // Check if path is suspicious
  const isSuspicious = SUSPICIOUS_PATHS.some(suspiciousPath => {
    return req.path.toLowerCase().includes(suspiciousPath.toLowerCase()) ||
           req.path.toLowerCase().startsWith(suspiciousPath.toLowerCase())
  })

  // Log additional headers to help diagnose IP detection issues
  // Only log for suspicious paths or blocked IPs to reduce noise
  const shouldLogDetails = isSuspicious || isLocalhost

  if (shouldLogDetails) {
    console.log(`🔍 IP Blocker - Client IP: ${clientIP}, Path: ${req.path}, User-Agent: ${req.headers['user-agent']}`)
    console.log(`   └─ Express req.ip: ${req.ip || 'undefined'}`)
    console.log(`   └─ X-Forwarded-For: ${req.headers['x-forwarded-for'] || 'not set'}`)
    console.log(`   └─ Remote Address: ${req.connection.remoteAddress || 'undefined'}`)
  }

  // For localhost/private IPs, allow access but log suspicious attempts
  if (isLocalhost) {
    if (isSuspicious) {
      console.log(`⚠️ DEV NOTICE - Suspicious path accessed from localhost/private IP: ${clientIP}`)
      console.log(`   └─ Path: ${req.path}`)
      console.log(`   └─ User-Agent: ${req.get('User-Agent') || 'Unknown'}`)
      console.log(`   └─ This would normally be blocked in production`)
    }
    return next()
  }

  try {
    const db = PostgreSQLDatabase.getInstance()

    // Check if IP is already blocked
    const blockedIP = await db.get('SELECT * FROM blocked_ips WHERE ip_address = $1', [clientIP]) as any
    if (blockedIP) {
      console.log(`🚫 BLOCKED REQUEST - IP: ${clientIP}`)
      console.log(`   └─ Reason: ${blockedIP.blocked_reason}`)
      console.log(`   └─ Total attempts: ${blockedIP.attempt_count}`)
      console.log(`   └─ First blocked: ${blockedIP.blocked_at}`)
      console.log(`   └─ Requested path: ${req.path}`)
      console.log(`   └─ User-Agent: ${req.get('User-Agent') || 'Unknown'}`)
      console.log(`   └─ STATUS: PERMANENT BAN ACTIVE`)
      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address has been permanently blocked due to suspicious activity. If you believe this is an error, please contact the administrator.',
        blocked_since: blockedIP.blocked_at,
        reason: blockedIP.blocked_reason
      })
    }

    // Path check already done above for localhost IPs
    if (isSuspicious) {
      // Block this IP permanently
      await db.run(`
        INSERT INTO blocked_ips (ip_address, blocked_reason, first_attempt_path, attempt_count)
        VALUES ($1, $2, $3, 1)
        ON CONFLICT (ip_address)
        DO UPDATE SET
          attempt_count = blocked_ips.attempt_count + 1,
          blocked_at = CURRENT_TIMESTAMP
        WHERE blocked_ips.ip_address = $1
      `, [clientIP, 'Suspicious path access', req.path])

      console.log(`🚨 SECURITY ALERT - IP BLOCKED: ${clientIP}`)
      console.log(`   └─ Suspicious path accessed: ${req.path}`)
      console.log(`   └─ This IP is now permanently banned from the server`)
      console.log(`   └─ User-Agent: ${req.get('User-Agent') || 'Unknown'}`)

      return res.status(403).json({
        error: 'Access denied',
        message: 'Your IP address has been permanently blocked due to suspicious activity. Access to this server is not permitted.',
        blocked_at: new Date().toISOString(),
        reason: 'Suspicious path access'
      })
    }

    next()
  } catch (error) {
    console.error('Error in IP blocker middleware:', error)
    // Continue processing if database error occurs
    next()
  }
}

// Periodic summary of blocked IPs (every 100 requests)
let requestCount = 0
setInterval(async () => {
  try {
    const db = PostgreSQLDatabase.getInstance()
    const result = await db.get('SELECT COUNT(*) as count FROM blocked_ips') as any
    if (result && result.count > 0) {
      console.log(`🛡️  Security Status: ${result.count} IP address${result.count === 1 ? '' : 'es'} currently blocked`)
    }
  } catch (error) {
    // Silently ignore errors in the periodic check
  }
}, 300000) // Check every 5 minutes

// Utility function to check blocked IPs (for admin use)
export async function getBlockedIPs() {
  try {
    const db = PostgreSQLDatabase.getInstance()
    return await db.all(`
      SELECT ip_address, blocked_reason, blocked_at, first_attempt_path, attempt_count
      FROM blocked_ips
      ORDER BY blocked_at DESC
    `)
  } catch (error) {
    console.error('Error fetching blocked IPs:', error)
    return []
  }
}

// Utility function to unblock an IP (for admin use)
export async function unblockIP(ipAddress: string) {
  try {
    const db = PostgreSQLDatabase.getInstance()
    await db.run('DELETE FROM blocked_ips WHERE ip_address = $1', [ipAddress])
    console.log(`✅ IP ${ipAddress} has been unblocked`)
    return true
  } catch (error) {
    console.error('Error unblocking IP:', error)
    return false
  }
}