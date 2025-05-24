"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "../ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

export function Header() {
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const [isHeaderOpen, setIsHeaderOpen] = useState(true);
  const isAuthPage =

    pathname.includes("/sign-in") || pathname.includes("/sign-up");

  if (isAuthPage) {
    return null;
  }

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
          className={`flex items-center w-full justify-between z-100 px-4 h-[50px] transition-all`}
        >
          {process.env.NODE_ENV === "development" && (
            <>
              <nav className="flex items-center gap-3">
                <Link
                  href="/"
                  title="Home"
                  className={`px-3 py-1.5 text-sm rounded-full z-50 text-white transition-colors ${
                    pathname === "/"
                      ? "bg-zinc-800/60 hover:bg-zinc-800/60"
                      : "bg-zinc-400/50 hover:bg-zinc-500/50"
                  }`}
                >
                  search
                </Link>
                <Link
                  href="/agent"
                  title="Browser Search"
                  className={`px-3 py-1.5 text-sm rounded-full z-50 text-white transition-colors ${
                    pathname === "/agent"
                      ? "bg-zinc-800/60 hover:bg-zinc-800/60"
                      : "bg-zinc-400/50 hover:bg-zinc-500/50"
                  }`}
                >
                  agent
                </Link>
                <Link
                  href="/ideas"
                  title="Open Ideas"
                  className={`px-3 py-1.5 text-sm rounded-full z-50 text-white transition-colors ${
                    pathname === "/ideas" || pathname.includes("/ideas/")
                      ? "bg-zinc-800/60 hover:bg-zinc-800/60"
                      : "bg-zinc-400/50 hover:bg-zinc-500/50"
                  }`}
                >
                  ideas
                </Link>
                <Link
                  href="/pro"
                  title="Open Pro"
                  className={`px-3 py-1.5 text-sm rounded-full z-50 text-white transition-colors ${
                    pathname === "/pro"
                      ? "bg-purple-600/60 hover:bg-purple-600/60"
                      : "bg-purple-400/50 hover:bg-purple-500/50"
                  }`}
                >
                  pro
                </Link>
              </nav>

              <div className="z-50 mr-4">
                {user ? (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/settings"
                      title="Settings"
                      className={`px-3 py-1.5 text-sm rounded-full bg-zinc-200/50 z-50 hover:bg-zinc-300/50 transition-colors ${
                        pathname === "/settings"
                          ? "bg-zinc-400/60 hover:bg-zinc-400/60"
                          : "bg-zinc-300/50 hover:bg-zinc-400/50"
                      }`}
                    >
                      settings
                    </Link>
                    <button
                      onClick={signOut}
                      className="cursor-pointer px-3 py-1.5 text-sm rounded-full bg-zinc-200/50 hover:bg-zinc-300/50 transition-colors"
                    >
                      sign out
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Link
                      href="/sign-up"
                      title="Create an account"
                      className="px-3 py-1.5 text-sm rounded-full bg-zinc-200/50 z-50 hover:bg-zinc-300/50 transition-colors"
                    >
                      sign up
                    </Link>
                    <Link
                      href="/sign-in"
                      title="Login to your account"
                      className="px-3 py-1.5 text-sm rounded-full bg-zinc-200/50 z-50 hover:bg-zinc-300/50 transition-colors"
                    >
                      sign in
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
