import type { CollectionConfig } from 'payload'

import { mediaSlug } from '../Media/index.js'

export const linkedinPostsSlug = 'linkedin-posts'

export const LinkedinPostsCollection: CollectionConfig = {
  slug: linkedinPostsSlug,
  admin: {
    useAsTitle: 'title',
    defaultColumns: ['title', 'status', 'scheduledDate'],
  },
  access: {
    // Public: the Blute marketing site fetches posts anonymously.
    read: () => true,
    // Authenticated only — these were previously open, which let anyone on the
    // internet create, edit, or delete posts with an unauthenticated request.
    create: ({ req }) => Boolean(req.user),
    update: ({ req }) => Boolean(req.user),
    delete: ({ req }) => Boolean(req.user),
  },
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      admin: {
        placeholder: 'Internal title or description',
      },
    },
    {
      name: 'text',
      type: 'textarea',
      required: true,
      label: 'Post Content',
      admin: {
        placeholder: 'What do you want to share on LinkedIn?',
      },
    },
    {
      name: 'attachments',
      type: 'relationship',
      relationTo: mediaSlug,
      hasMany: true,
      label: 'Images or Documents',
      admin: {
        description: 'Upload and attach images, PDFs, or Word documents for this post.',
      },
    },
    {
      name: 'status',
      type: 'select',
      defaultValue: 'draft',
      options: [
        { label: 'Draft', value: 'draft' },
        { label: 'Scheduled', value: 'scheduled' },
        { label: 'Posted', value: 'posted' },
        { label: 'Failed', value: 'failed' },
      ],
      required: true,
    },
    {
      name: 'scheduledDate',
      type: 'date',
      admin: {
        date: {
          pickerAppearance: 'dayAndTime',
        },
      },
      label: 'Scheduled Date & Time',
    },
    {
      name: 'linkedinPostId',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
      label: 'LinkedIn Post ID',
    },
    {
      name: 'linkedinShareUrl',
      type: 'text',
      admin: {
        readOnly: true,
        position: 'sidebar',
      },
      label: 'LinkedIn Share URL',
    },
  ],
  versions: false,
}
