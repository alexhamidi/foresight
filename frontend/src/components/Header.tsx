"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "../../utils/supabase/client";
import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "./ui/button";

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const isAuthPage =
    pathname.includes("/sign-in") || pathname.includes("/sign-up");
  const supabase = createClient();

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      console.log("user", user);
      setUser(user);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (isAuthPage) {
    return null;
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <>
      {/* Toggle header button */}
      <Button
        onClick={() => setIsHeaderOpen((prev) => !prev)}
        size="icon"
        variant="ghost"
        className="fixed top-0 left-1/2 transform -translate-x-1/2 z-50"
      >
        {isHeaderOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </Button>

      {isHeaderOpen && (
        <header
          className={`flex items-center w-full  justify-between z-100 px-4 h-[50px] transition-all `}
        >
          {process.env.NODE_ENV === "development" && (
            <>
              <nav className="flex items-center gap-3 ">
                <Link
                  href="/"
                  title="Home"
                  className={`px-3 py-1.5 text-xs rounded-full z-50 text-white transition-colors ${
                    pathname === "/"
                      ? "bg-zinc-800/60 hover:bg-zinc-800/60"
                      : "bg-zinc-400/50 hover:bg-zinc-500/50"
                  }`}
                >
                  Search
                </Link>
                <Link
                  href="/explore"
                  title="Open Explore"
                  className={`px-3 py-1.5 text-xs rounded-full z-50 text-white transition-colors ${
                    pathname === "/explore"
                      ? "bg-zinc-800/60 hover:bg-zinc-800/60"
                      : "bg-zinc-400/50 hover:bg-zinc-500/50"
                  }`}
                >
                  Explore
                </Link>

                <Link
                  href="/notes"
                  title="Open Notes"
                  className={`px-3 py-1.5 text-xs rounded-full z-50 text-white transition-colors ${
                    pathname === "/notes"
                      ? "bg-zinc-800/60 hover:bg-zinc-800/60"
                      : "bg-zinc-400/50 hover:bg-zinc-500/50"
                  }`}
                >
                  Notes
                </Link>
              </nav>

              <div className="z-50 mr-4">
                {user ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/settings"
                      title="ktings"
                      className="px-3 py-1.5 text-xs rounded-full bg-zinc-200/50 z-50 hover:bg-zinc-300/50 transition-colors"
                    >
                      Settings
                    </Link>
                    <div
                      onClick={handleSignOut}
                      className="cursor-pointer px-3 py-1.5 text-xs rounded-full bg-zinc-200/50 hover:bg-zinc-300/50 transition-colors"
                    >
                      Sign Out
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 ">
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
                )}
              </div>
            </>
          )}
        </header>
      )}
    </>
  );
}
