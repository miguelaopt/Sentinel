"use client";
import './globals.css';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

export default function RootLayout({ children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Se não houver sessão e não estivermos já no login, manda para login
      if (!session && pathname !== '/login') {
        router.push('/login');
      }
      setIsChecking(false);
    };

    checkUser();
  }, [pathname, router]);

  if (isChecking) return <html lang="pt"><body></body></html>; // Tela branca enquanto verifica

  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
