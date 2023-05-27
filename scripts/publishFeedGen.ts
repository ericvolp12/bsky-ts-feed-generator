import dotenv from 'dotenv'
import { AtpAgent, BlobRef } from '@atproto/api'
import fs from 'fs/promises'
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
    // A short name for the record that will show in urls
    // Lowercase with no spaces.
    // Ex: whats-hot
    const recordName = feed.recordName

    // A display name for your feed
    // Ex: What's Hot
    const displayName = feed.displayName

    // (Optional) A description of your feed
    // Ex: Top trending content from the whole network
    const description = feed.description

    // (Optional) The path to an image to be used as your feed's avatar
    // Ex: ~/path/to/avatar.jpeg
    const avatar: string = feed.avatar ?? ''

    // -------------------------------------
    // NO NEED TO TOUCH ANYTHING BELOW HERE
    // -------------------------------------

    const agent = new AtpAgent({ service: 'https://bsky.social' })
    await agent.login({ identifier: handle, password })

    let avatarRef: BlobRef | undefined
    if (avatar && avatar !== '') {
      let encoding: string
      if (avatar.endsWith('png')) {
        encoding = 'image/png'
      } else if (avatar.endsWith('jpg') || avatar.endsWith('jpeg')) {
        encoding = 'image/jpeg'
      } else {
        throw new Error('expected png or jpeg')
      }
      const img = await fs.readFile(avatar)
      const blobRes = await agent.api.com.atproto.repo.uploadBlob(img, {
        encoding,
      })
      avatarRef = blobRes.data.blob
    }

    await agent.api.com.atproto.repo.putRecord({
      repo: agent.session?.did ?? '',
      collection: ids.AppBskyFeedGenerator,
      rkey: recordName,
      record: {
        did: feedGenDid,
        displayName: displayName,
        description: description,
        avatar: avatarRef,
        createdAt: new Date().toISOString(),
      },
    })

    console.log(`Published feed ${recordName}`)
  }

  console.log('All done 🎉')
}

run()
