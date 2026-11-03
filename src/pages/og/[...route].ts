// Preview images for og:image and twitter:image, drawn at build time by astro-og-canvas.
import { getCollection } from 'astro:content'
import { OGImageRoute } from 'astro-og-canvas'
import { products } from '../../products'

const posts = await getCollection('blog', ({ data }) => !data.draft)

const pages = {
  default: { title: 'Sphericon', description: 'Open-source marketing automation platform.' },
  ...Object.fromEntries(products.map((p) => [`product-${p.slug}`, { title: p.name, description: p.short }])),
  ...Object.fromEntries(posts.map((p) => [`blog-${p.id}`, { title: p.data.title, description: p.data.description }])),
}

export const { getStaticPaths, GET } = await OGImageRoute({
  pages,
  getImageOptions: (_path, page) => ({
    title: page.title,
    description: page.description,
    logo: { path: './src/assets/logo.png', size: [96] },
    bgGradient: [
      [15, 23, 42],
      [30, 27, 75],
    ],
    padding: 80,
    font: {
      title: { size: 72, weight: 'Bold', color: [255, 255, 255], families: ['Inter'] },
      description: { size: 34, color: [199, 210, 254], families: ['Inter'] },
    },
    fonts: [
      './node_modules/@fontsource/inter/files/inter-latin-400-normal.woff2',
      './node_modules/@fontsource/inter/files/inter-latin-700-normal.woff2',
    ],
  }),
})
