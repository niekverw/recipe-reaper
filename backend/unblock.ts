import { config } from 'dotenv'
import { join } from 'path'
import { PostgreSQLDatabase } from './src/models/database-pg'
import { unblockIP } from './src/middleware/ipBlocker'

// Load .env
config({ path: join(__dirname, '../.env') })

async function main() {
  try {
    // Initialize database
    await PostgreSQLDatabase.getInstance().initialize()

    const success = await unblockIP('24.193.76.157')
    if (success) {
      console.log('IP unblocked successfully')
    } else {
      console.log('Failed to unblock IP')
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    await PostgreSQLDatabase.getInstance().close()
  }
}

main()