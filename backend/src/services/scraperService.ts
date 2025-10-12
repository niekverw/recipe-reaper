import { spawn } from 'child_process'
import { join } from 'path'

/**
 * Interface for scraped recipe data
 */
export interface ScrapedRecipeData {
  name?: string
  description?: string
  ingredients?: string[] | string
  instructions?: string[] | string
  image?: string | any
  prepTimeMinutes?: number
  cookTimeMinutes?: number
  totalTimeMinutes?: number
  yields?: string
  category?: string
  cuisine?: string
  language?: string
  error?: string
  [key: string]: any
}

/**
 * Service for scraping recipe data from URLs using Python
 */
export class ScraperService {
  private pythonExecutable: string
  private scraperScript: string

  constructor() {
    this.pythonExecutable = join(__dirname, '../../../.venv/bin/python')
    this.scraperScript = join(__dirname, '../../scraper.py')
  }

  /**
   * Scrape recipe data from a URL using the Python scraper
   * @param url - URL to scrape
   * @returns Scraped recipe data
   * @throws Error if scraping fails
   */
  async scrapeRecipe(url: string): Promise<ScrapedRecipeData> {
    return new Promise((resolve, reject) => {
      const pythonProcess = spawn(this.pythonExecutable, [this.scraperScript, url], {
        cwd: join(__dirname, '../..')
      })

      let stdout = ''
      let stderr = ''

      pythonProcess.stdout.on('data', (data) => {
        stdout += data.toString()
      })

      pythonProcess.stderr.on('data', (data) => {
        stderr += data.toString()
      })

      pythonProcess.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Python scraper failed: ${stderr}`))
          return
        }

        try {
          const result = JSON.parse(stdout.trim())
          if (result.error) {
            reject(new Error(result.error))
            return
          }
          resolve(result)
        } catch (error) {
          reject(new Error(`Failed to parse Python output: ${error}`))
        }
      })

      pythonProcess.on('error', (error) => {
        reject(new Error(`Failed to start Python process: ${error.message}`))
      })
    })
  }
}

// Export singleton instance
export const scraperService = new ScraperService()
