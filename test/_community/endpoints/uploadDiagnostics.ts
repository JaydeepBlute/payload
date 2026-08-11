import type { Endpoint, PayloadHandler } from 'payload'

import { mediaSlug } from '../collections/Media/index.js'

/**
 * TEMPORARY diagnostic — delete once media uploads are fixed.
 *
 * Upload failures on Vercel surface as an opaque `{"errors":[{"message":"Something
 * went wrong."}]}` 500, because Payload masks unexpected errors. That hides which
 * layer actually broke, and the two candidates are indistinguishable from outside:
 * the blob adapter silently disables itself when `BLOB_READ_WRITE_TOKEN` is unset
 * (Payload then tries to `fs.mkdir` on Vercel's read-only filesystem), or the
 * adapter is active and the blob write is what fails.
 *
 * So this runs the real create path against a tiny in-memory file and returns the
 * unmasked error. `disableLocalStorage` is the tell for which path ran: the
 * adapter sets it on the media collection only when it actually engaged.
 */
const handler: PayloadHandler = async (req) => {
  const { payload } = req
  const upload = payload.config.collections.find(({ slug }) => slug === mediaSlug)?.upload

  const config = {
    blobTokenPresent: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    disableLocalStorage: Boolean(upload?.disableLocalStorage),
    isVercel: Boolean(process.env.VERCEL),
    staticDir: upload?.staticDir ?? null,
    vercelEnv: process.env.VERCEL_ENV ?? null,
  }

  const filename = `upload-diagnostics-${Date.now()}.txt`

  try {
    const doc = await payload.create({
      collection: mediaSlug,
      data: {},
      file: {
        name: filename,
        data: Buffer.from('upload diagnostics probe'),
        mimetype: 'text/plain',
        size: 24,
      },
    })

    // Clean up so the probe does not leave documents behind on every call.
    await payload.delete({ id: doc.id, collection: mediaSlug })

    return Response.json({ config, ok: true, url: doc.url ?? null })
  } catch (err) {
    return Response.json(
      {
        config,
        error: {
          name: err instanceof Error ? err.name : typeof err,
          cause:
            err instanceof Error && err.cause instanceof Error
              ? { message: err.cause.message, name: err.cause.name }
              : null,
          message: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : null,
        },
        ok: false,
      },
      { status: 500 },
    )
  }
}

export const uploadDiagnosticsEndpoint: Endpoint = {
  handler,
  method: 'get',
  path: '/upload-diagnostics',
}
