# Personal Portfolio

A minimal, elegant portfolio site built with Next.js 14, Tailwind CSS, and MDX.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Customization

### Update Your Info

1. **Name & Links**: Edit `components/Header.tsx` to update your name and social links
2. **Landing Page**: Edit `app/page.tsx` to update your intro text and quote
3. **Metadata**: Edit `app/layout.tsx` to update the site title and description

### Writing Blog Posts

Create `.mdx` files in `content/posts/` with frontmatter:

```mdx
---
title: "Your Post Title"
date: "2024-12-06"
description: "A brief description of your post."
---

Your content here...
```

### Adding Portfolio Projects

Edit `app/portfolio/page.tsx` and add to the `projects` array:

```typescript
const projects: Project[] = [
  {
    title: "Project Name",
    description: "What the project does.",
    tags: ["Python", "ML"],
    link: "https://github.com/you/project"
  },
];
```

## Deploy to Vercel

1. Push this code to a GitHub repository
2. Go to [vercel.com](https://vercel.com) and sign in
3. Click "New Project" and import your repository
4. Click "Deploy" - Vercel auto-detects Next.js

Your site will be live at `your-project.vercel.app`.

## Design

- **Background**: Warm cream (#F5F0E8)
- **Text**: Dark charcoal (#2D2A26)
- **Accent**: Muted gold (#8B7355)
- **Font**: Geist Mono

