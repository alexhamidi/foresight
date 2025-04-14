import { signInWithGoogleAction, signUpAction } from "@/app/actions";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import DynamicGrid from "@/components/background/DynamicGrid";
import GoogleSignInButton from "@/components/auth/GoogleSignInButton";

type SearchParams = {
  returnTo?: string;
  error?: string;
  success?: string;
  message?: string;
};

export default async function Signup(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const returnTo = searchParams.returnTo;

  // Convert search params to FormMessage format
  const message = searchParams.error
    ? { error: searchParams.error }
    : searchParams.success
    ? { success: searchParams.success }
    : searchParams.message
    ? { message: searchParams.message }
    : null;

  return (
    <main className="min-h-screen w-full flex items-center justify-center">
      {/* Background layer */}
      <div className="fixed inset-0 w-full h-full z-0">
        <DynamicGrid />
      </div>

      {/* Sign up div */}
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
        <h1 className="text-2xl font-medium">Sign up</h1>
        <p className="text-sm text-foreground">
          Already have an account?{" "}
          <Link
            className="text-foreground font-medium underline"
            href={`/sign-in${returnTo ? `?returnTo=${returnTo}` : ''}`}
          >
            Sign in
          </Link>
        </p>
        <div className="flex flex-col gap-2 w-full max-w-xs">
          <GoogleSignInButton
            signInWithGoogle={signInWithGoogleAction}
            returnTo={returnTo}
          />
          {message && <FormMessage message={message} />}
          <div className="relative my-2">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                or
              </span>
            </div>
          </div>
          <form className="flex-1 flex flex-col min-w-64">
            <div className="flex flex-col gap-2 [&>input]:mb-3 mt-8">
              <Label htmlFor="email">Email</Label>
              <Input
                name="email"
                placeholder="you@example.com"
                required
                type="email"
                autoComplete="email"
              />
              <Label htmlFor="password">Password</Label>
              <Input
                type="password"
                name="password"
                placeholder="Your password"
                minLength={6}
                required
                autoComplete="new-password"
              />
              {returnTo && (
                <input type="hidden" name="returnTo" value={returnTo} />
              )}
              <Button
                formAction={signUpAction}
                className="w-full"
              >
                Sign up
              </Button>
              {message && <FormMessage message={message} />}
            </div>
          </form>
        </div>
      </div>
    </main>
  );
}
