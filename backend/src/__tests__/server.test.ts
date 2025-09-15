import request from 'supertest'
import { app } from '../index'

describe('Server Basic Tests', () => {
  describe('Health Check', () => {
    it('should respond with 200 and status ok', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.body).toEqual({
        status: 'ok',
        timestamp: expect.any(String)
      })
    })
  })

  describe('CORS', () => {
    it('should include CORS headers', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200)

      expect(response.headers['access-control-allow-origin']).toBeDefined()
    })
  })

  describe('404 Handler', () => {
    it('should respond with 404 for unknown routes', async () => {
      const response = await request(app)
        .get('/unknown-route')
        .expect(404)

      expect(response.body).toEqual({
        error: 'Route not found'
      })
    })
  })

  describe('JSON Parsing', () => {
    it('should parse JSON requests', async () => {
      // This will test JSON parsing when we create a recipe endpoint
      const response = await request(app)
        .post('/api/recipes')
        .send({
          name: 'Test Recipe',
          description: 'Test Description',
          ingredients: ['1 cup flour'],
          instructions: ['Mix ingredients']
        })

      // Should not error on JSON parsing, even if recipe creation fails
      expect(response.status).not.toBe(413) // Payload too large
      expect(response.status).not.toBe(400) // Bad JSON
    })
  })
})