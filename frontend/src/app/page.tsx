'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUser } from '@/services/auth';

export default function HomePage() {
  const router = useRouter();

  useEffect(() => {
    const user = getUser();
    router.replace(user ? '/dashboard' : '/login');
  }, [router]);

  return <div className="min-h-screen" />;
}
