import { createApp } from './app.js'
import { env } from './config/env.js'

const app = createApp()

const host = '127.0.0.1'

app.listen(env.port, host, () => {
  console.log(`SAAJ API listening on http://${host}:${env.port}`)
})
