import dotenv from 'dotenv'
import { AtpAgent, BlobRef } from '@atproto/api'
import { ids } from '../src/lexicon/lexicons'
import feeds from './feeds.json'

const maybeStr = (val?: string) => {
  if (!val) return undefined
  return val
}

const run = async () => {
  dotenv.config()

  const handle = maybeStr(process.env['BSKY_HANDLE'])
  const password = maybeStr(process.env['BSKY_PASS'])
  const feedGenDid = maybeStr(process.env['FEED_DID'])

  if (
    handle === undefined ||
    password === undefined ||
    feedGenDid === undefined
  ) {
    throw new Error('Missing env vars')
  }

  for (let feed of feeds) {
    const recordName = feed.recordName

    const agent = new AtpAgent({ service: 'https://bsky.social' })
    await agent.login({ identifier: handle, password })

    await agent.api.com.atproto.repo.deleteRecord({
      repo: agent.session?.did ?? '',
      collection: ids.AppBskyFeedGenerator,
      rkey: recordName,
    })

    console.log(`Deleted feed ${recordName}`)
  }

  console.log('All done 🎉')
}

run()
