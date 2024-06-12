import fetch from 'node-fetch'
import fs from 'node:fs'

const engineId = 'stable-diffusion-xl-beta-v2-2-2'
const apiHost = process.env.API_HOST ?? 'https://api.stability.ai'
const apiKey = 'sk-7h0i4JIXITwFc2FIh2b4gHqZQjyyIi0kWHWrtPomPKEk13qv'

if (!apiKey) throw new Error('Missing Stability API key.')

const start = Date.now()

const response = await fetch(`${apiHost}/v1/generation/${engineId}/text-to-image`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${apiKey}`,
  },
  body: JSON.stringify({
    text_prompts: [
      {
        text: 'dogwifhat',
      },
    ],
    cfg_scale: 7,
    height: 512,
    width: 512,
    steps: 30,
    samples: 1,
  }),
})

if (!response.ok) {
  throw new Error(`Non-200 response: ${await response.text()}`)
}

console.log(`Time taken: ${Date.now() - start}ms`)

interface GenerationResponse {
  artifacts: Array<{
    base64: string
    seed: number
    finishReason: string
  }>
}

const responseJSON = (await response.json()) as GenerationResponse

responseJSON.artifacts.forEach((image, index) => {
  fs.writeFileSync(`./out/v1_txt2img_${index}.png`, Buffer.from(image.base64, 'base64'))
})
