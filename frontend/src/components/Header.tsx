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
    <header className="fixed top-0 left-0 flex items-center w-full justify-between z-[40] px-4 ">


      {process.env.NODE_ENV === 'development' && (
        <>
         <nav className="flex items-center gap-3 my-4">
        <Link
          href="/"
          title="Home"
          className={`px-3 py-1.5 text-xs rounded-full z-50 text-white transition-colors ${
            pathname === '/'
              ? 'bg-zinc-800/60 hover:bg-zinc-800/60'
              : 'bg-zinc-400/50 hover:bg-zinc-500/50'
          }`}
        >
          Foresight
        </Link>
        <Link
          href="/chat"
          title="Open Chat"
          className={`px-3 py-1.5 text-xs rounded-full z-50 text-white transition-colors ${
            pathname === '/chat'
              ? 'bg-zinc-800/60 hover:bg-zinc-800/60'
              : 'bg-zinc-400/50 hover:bg-zinc-500/50'
          }`}
        >
          Chat
          <span className={`text-xs text-zinc-400 font-mono ${pathname === '/chat' ? 'text-purple-300' : 'text-purple-500'}`}>
            &nbsp;(Beta)
          </span>
        </Link>
        <Link
          href="/pricing"
          title="Pricing"
          className={`px-3 py-1.5 text-xs rounded-full z-50 text-white transition-colors ${
            pathname === '/pricing'
              ? 'bg-zinc-800/60 hover:bg-zinc-800/60'
              : 'bg-zinc-400/50 hover:bg-zinc-500/50'
          }`}
        >
          Pricing
        </Link>
        {/* <Link
          href="/business"
          title="Business Solutions"
          className={`px-3 py-1.5 text-xs rounded-full z-50 text-white transition-colors ${
            pathname === '/business'
              ? 'bg-zinc-800/60 hover:bg-zinc-800/60'
              : 'bg-zinc-500/50 hover:bg-zinc-500/50'
          }`}
        >
          For Business
        </Link> */}
      </nav>
          {isLoaded && (
            isSignedIn ? (
              <div className="z-50 mr-4">
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: 'w-8 h-8',
                      userButtonTrigger: 'hover:opacity-80 transition-opacity'
                    },
                  }}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 mr-4 my-4">
                <Link
                  href="/sign-up"
                  title="Create an account"
                  className="px-3 py-1.5 text-xs rounded-full bg-zinc-200/50 z-50 hover:bg-zinc-300/50 transition-colors"
                >
                  Sign Up
                </Link>
                <Link
                  href="/sign-in"
                  title="Login to your account"
                  className="px-3 py-1.5 text-xs rounded-full bg-zinc-200/50 z-50 hover:bg-zinc-300/50 transition-colors"
                >
                  Sign In
                </Link>
              </div>
            )
          )}
        </>
      )}
    </header>
  );
}
