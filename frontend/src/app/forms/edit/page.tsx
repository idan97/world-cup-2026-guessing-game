'use client';

import { redirect } from 'next/navigation';
import { useEffect } from 'react';

// Redirect to the full visual bracket editor
export default function FormEditPage() {
  useEffect(() => {
    // Client-side redirect
    window.location.href = '/forms/bracket';
  }, []);

  // Server-side redirect as fallback
  redirect('/forms/bracket');
}
