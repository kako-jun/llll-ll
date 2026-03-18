# llll-ll

Personal portfolio website for kako-jun, a game and app developer based in Kanazawa.

## Features

- **Multi-language Support**: English, Chinese, Japanese, and Spanish
- **Pixel Art Design**: Dark retro aesthetic with cyberpunk elements
- **Mobile-First**: Responsive design optimized for mobile devices
- **No Page Transitions**: Single-page application with smooth interactions
- **JSON-Based Content**: Easy content management through JSON files
- **SPA Architecture**: Built with Vite + React for fast loading

## Tech Stack

- **Vite + React** - Fast SPA with HMR
- **TypeScript** - Type-safe development
- **CSS3** - Custom pixel art styling
- **JSON** - Content management system

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:5173](http://localhost:5173) in your browser

## Adding Products

To add a new product:

1. Create a new entry in `public/data/products.json`
2. Follow the structure of existing product files
3. Include all required fields (id, title, description, etc.)
4. Add any images to the `public/images/` directory

## Project Structure

```
src/
├── components/    # React components
├── data/         # JSON product data
├── lib/          # Utility functions
└── types/        # TypeScript definitions
```

## Deployment

This project is designed to be deployed on Vercel with a custom domain (llll-ll.com).

```bash
npm run build
npm run dev
```

## License

© 2024 kako-jun. All rights reserved.