'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton, useAuth } from '@clerk/nextjs';

export function Header() {
  const pathname = usePathname();
  const { isSignedIn, isLoaded } = useAuth();
  const isAuthPage = pathname.includes('/sign-in') || pathname.includes('/sign-up');

  if (isAuthPage) {
    return null;
  }

  return (
    <header className="flex items-center gap-4 w-full justify-end px-6 py-4 ">
      <button className="z-50" onClick={() => {
            throw new Error('Test error');
          }}>Test Error</button>
      {process.env.NODE_ENV === 'development' && <>
        {isLoaded && (

            isSignedIn ? <div className="z-50">
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: 'w-8 h-8',
                  },
                }}
              />
            </div>
            : (
              <>
                <Link
                  href="/sign-up"
                  className="px-2 py-1 text-xs rounded-full bg-zinc-200/50 z-50 transition-colors"
                >
                        Sign Up
                      </Link>
                      <Link
                        href="/sign-in"
                      className="px-2 py-1 text-xs rounded-full bg-zinc-200/50  z-50 transition-colors"
                            >
                      Sign In
                      </Link>
              </>
            )
          )}
        </>}
    </header>
  );
}
