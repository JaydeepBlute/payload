import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import { fileURLToPath } from 'node:url'
import path from 'path'

import { buildConfigWithDefaults } from '../buildConfigWithDefaults.js'
import { devUser } from '../credentials.js'
import { LinkedinPostsCollection } from './collections/LinkedinPosts/index.js'
import { MediaCollection, mediaSlug } from './collections/Media/index.js'
import { PostsCollection, postsSlug } from './collections/Posts/index.js'
import { MenuGlobal } from './globals/Menu/index.js'

const filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(filename)

export default buildConfigWithDefaults({
  // ...extend config here
  collections: [PostsCollection, MediaCollection, LinkedinPostsCollection],
  // The Blute marketing site reads linkedin-posts from the browser, so those
  // origins must be allowed explicitly — without this the API answers 200 but
  // the browser discards the response and the site renders an empty feed.
  cors: [
    'https://blute.co.in',
    'https://www.blute.co.in',
    'https://blute-dc0d6.web.app',
    'http://localhost:4200',
  ],
  admin: {
    importMap: {
      baseDir: path.resolve(dirname),
    },
  },
  editor: lexicalEditor({}),
  globals: [
    // ...add more globals here
    MenuGlobal,
  ],
  // Uploads default to writing under the collection slug on local disk, which
  // fails on Vercel because everything outside /tmp is read-only. The adapter
  // disables itself when the token is unset, so local dev and the test suites
  // keep using the filesystem.
  storage: [
    vercelBlobStorage({
      collections: {
        [mediaSlug]: true,
      },
      token: process.env.BLOB_READ_WRITE_TOKEN,
    }),
  ],
  // Seeding runs on every init, including `next build` prerenders, so it has to
  // tolerate a database that already holds the seed data — re-creating the dev
  // user throws on the unique email and fails the build.
  onInit: async (payload) => {
    const { docs: existingUsers } = await payload.find({
      collection: 'users',
      depth: 0,
      limit: 1,
      pagination: false,
      where: {
        email: {
          equals: devUser.email,
        },
      },
    })

    if (!existingUsers.length) {
      await payload.create({
        collection: 'users',
        data: {
          email: devUser.email,
          password: devUser.password,
        },
      })
    }

    const { docs: existingPosts } = await payload.find({
      collection: postsSlug,
      depth: 0,
      limit: 1,
      pagination: false,
    })

    if (!existingPosts.length) {
      await payload.create({
        collection: postsSlug,
        data: {
          title: 'example post',
        },
      })
    }
  },
  typescript: {
    outputFile: path.resolve(dirname, 'payload-types.ts'),
  },
})
