'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Redirect to the full visual bracket editor
export default function FormEditPage() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirect
    router.replace('/forms/bracket');
  }, [router]);

  return null;
}
