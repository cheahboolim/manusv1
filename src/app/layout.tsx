import { AuthProvider } from '@/context/auth';
import './globals.css';

export const metadata = {
  title: 'Next.js + Supabase + Storj Boilerplate',
  description: 'A boilerplate for Next.js with Supabase and Storj integration',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
