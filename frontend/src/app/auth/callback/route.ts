import { createClient } from "../../../../utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  // The `/auth/callback` route is required for the server-side auth flow implemented
  // by the SSR package. It exchanges an auth code for the user's session.
  // https://supabase.com/docs/guides/auth/server-side/nextjs
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const redirectTo = requestUrl.searchParams.get("redirect_to")?.toString();

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error("Error exchanging code for session:", sessionError);
      return NextResponse.redirect(
        `${origin}/sign-in?error=Authentication failed`,
      );
    }

    if (session?.user) {
      // Check if profile exists
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select()
        .eq("user_id", session.user.id)
        .single();

      if (profileError && profileError.code !== "PGRST116") {
        // PGRST116 means no rows returned
        console.error("Error fetching profile:", profileError);
      }

      // If profile doesn't exist, create it
      if (!profile) {
        const { error: insertError } = await supabase.from("profiles").insert({
          user_id: session.user.id,
          email: session.user.email,
          created_at: new Date().toISOString(),
          payment_plan: "free", // default payment plan
        });

        if (insertError) {
          console.error("Error creating profile:", insertError);
        }
      } else {
        // Update the email if it has changed
        if (profile.email !== session.user.email) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({ email: session.user.email })
            .eq("user_id", session.user.id);

          if (updateError) {
            console.error("Error updating profile:", updateError);
          }
        }
      }
    }
  }

  if (redirectTo) {
    return NextResponse.redirect(`${origin}${redirectTo}`);
  }

  // URL to redirect to after sign up process completes
  return NextResponse.redirect(`${origin}`);
}
