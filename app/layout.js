import './globals.css';
import Providers from '../components/Providers';
export const metadata = { title: 'Template Studio', description: 'Turn any design image into a reusable template, then fill it with your photos and text.' };
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@400;700&family=Dancing+Script:wght@400;700&family=Great+Vibes&family=Playfair+Display:wght@400;700;800&family=Poppins:wght@400;500;600&display=swap" />
      </head>
      <body><Providers>{children}</Providers></body>
    </html>
  );
}
