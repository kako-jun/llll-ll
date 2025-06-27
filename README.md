# llll-ll

Personal portfolio website for kako-jun, a game and app developer based in Kanazawa.

## Features

- **Multi-language Support**: English, Chinese, and Japanese
- **Pixel Art Design**: Dark retro aesthetic with cyberpunk elements
- **Mobile-First**: Responsive design optimized for mobile devices
- **No Page Transitions**: Single-page application with smooth interactions
- **YAML-Based Content**: Easy content management through YAML files
- **SSR Optimized**: Built with Next.js for fast loading

## Tech Stack

- **Next.js 15** - React framework with SSR
- **TypeScript** - Type-safe development
- **CSS3** - Custom pixel art styling
- **YAML** - Content management system

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Adding Products

To add a new product:

1. Create a new YAML file in `src/data/products/`
2. Follow the structure of existing product files
3. Include all required fields (id, title, description, etc.)
4. Add any images to the `public/images/` directory

## Project Structure

```
src/
├── app/           # Next.js app directory
├── components/    # React components
├── data/         # YAML product data
├── lib/          # Utility functions
└── types/        # TypeScript definitions
```

## Deployment

This project is designed to be deployed on Vercel with a custom domain (llll-lll.com).

```bash
npm run build
npm start
```

## License

© 2024 kako-jun. All rights reserved.