"use client";

import { Button } from "../ui/button";

interface GoogleSignInButtonProps {
  signInWithGoogle: (returnTo?: string) => Promise<any>;
  returnTo?: string;
}

export default function GoogleSignInButton({ signInWithGoogle, returnTo }: GoogleSignInButtonProps) {
  const handleClick = async () => {
    await signInWithGoogle(returnTo);
  };

  return (
    <Button onClick={handleClick} className="w-full">
      Continue with Google
    </Button>
  );
}
