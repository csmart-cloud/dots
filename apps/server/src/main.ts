import { serve } from '@hono/node-server'
import { Hono } from 'hono'
import { APPLICATION_NAME } from '@dots/types'
const app = new Hono()

app.get('/', (c) => {
  return c.text('Hello Hono!')
})

serve({
  fetch: app.fetch,
  port: 5000
}, (info) => {
  console.log(`Server ${APPLICATION_NAME} is running on http://localhost:${info.port}`)
})
