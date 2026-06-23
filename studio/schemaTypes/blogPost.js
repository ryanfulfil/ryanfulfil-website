import { defineField, defineType } from 'sanity'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: Rule => Rule.required().min(5).max(100),
    }),

    defineField({
      name: 'slug',
      title: 'Slug (URL)',
      type: 'slug',
      description: 'Auto-generated from title. This becomes the URL of the post — e.g. /blog/how-to-source-from-china',
      options: {
        source: 'title',
        maxLength: 80,
      },
      validation: Rule => Rule.required(),
    }),

    defineField({
      name: 'publishedAt',
      title: 'Publish Date',
      type: 'datetime',
      initialValue: () => new Date().toISOString(),
      validation: Rule => Rule.required(),
    }),

    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Sourcing Tips', value: 'sourcing-tips' },
          { title: 'Shipping & Logistics', value: 'shipping' },
          { title: 'Product Quality', value: 'quality' },
          { title: 'Branding & Private Label', value: 'branding' },
          { title: 'Q&A', value: 'qa' },
          { title: 'News & Updates', value: 'news' },
        ],
      },
    }),

    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 3,
      description: 'A short summary shown on the blog listing page (1-2 sentences).',
      validation: Rule => Rule.max(200),
    }),

    defineField({
      name: 'coverImage',
      title: 'Cover Image',
      type: 'image',
      description: 'Optional. Displayed at the top of the post and in the listing card.',
      options: {
        hotspot: true,
      },
    }),

    defineField({
      name: 'body',
      title: 'Post Content',
      type: 'array',
      of: [
        {
          type: 'block',
          styles: [
            { title: 'Normal', value: 'normal' },
            { title: 'Heading 2', value: 'h2' },
            { title: 'Heading 3', value: 'h3' },
            { title: 'Quote', value: 'blockquote' },
          ],
          marks: {
            decorators: [
              { title: 'Bold', value: 'strong' },
              { title: 'Italic', value: 'em' },
            ],
          },
        },
        {
          type: 'image',
          options: { hotspot: true },
          fields: [
            {
              name: 'caption',
              type: 'string',
              title: 'Caption',
            },
          ],
        },
      ],
    }),
  ],

  preview: {
    select: {
      title: 'title',
      category: 'category',
      media: 'coverImage',
      date: 'publishedAt',
    },
    prepare({ title, category, media, date }) {
      const d = date ? new Date(date).toLocaleDateString('en-GB') : 'No date'
      return {
        title,
        subtitle: `${category || 'Uncategorised'}  ·  ${d}`,
        media,
      }
    },
  },
})
