'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/profile');
  }, [router]);

  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center font-vazirmatn text-gray-500">
      در حال انتقال به حساب کاربری...
    </div>
  );
}
