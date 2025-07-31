import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://your-username.github.io', // 替换为你的GitHub Pages地址
  base: '/my-blog', // 替换为你的仓库名称，如果是根仓库则可以省略
  integrations: [mdx(), sitemap()],
  content: {
    collections: {
      posts: {
        schema: ({ z }) => z.object({
          title: z.string(),
          date: z.string().transform(str => new Date(str)),
          description: z.string(),
          tags: z.array(z.string()),
          slug: z.string(),
          cover: z.string().optional(),
        }),
      },
    },
  },
});
