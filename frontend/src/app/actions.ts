"use server";

import { encodedRedirect } from "../../utils/utils";
import { createClient } from "../../utils/supabase/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

export const signInWithGoogleAction = async () => {
  console.log("signing in with google");
  const origin = (await headers()).get("origin");
  const supabase = await createClient();

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Google OAuth Error:", error.message);
    return encodedRedirect(
      "error",
      "/sign-in",
      "Could not authenticate with Google.",
    );
  }

  if (data.url) {
    return redirect(data.url);
  }

  return encodedRedirect("error", "/sign-in", "An unexpected error occurred.");
};

export const signOutAction = async () => {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return redirect("/sign-in");
};

export const signUpAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const password = formData.get("password")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");

  if (!email || !password) {
    return encodedRedirect(
      "error",
      "/sign-up",
      "Email and password are required",
    );
  }

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error(error.code + " " + error.message);
    return encodedRedirect("error", "/sign-up", error.message);
  } else {
    return encodedRedirect(
      "success",
      "/sign-up",
      "Thanks for signing up! Please check your email for a verification link.",
    );
  }
};

export const signInAction = async (formData: FormData) => {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;
  const supabase = await createClient();

  const {
    data: { session },
    error,
  } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return encodedRedirect("error", "/sign-in", error.message);
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

  return redirect("/");
};

export const forgotPasswordAction = async (formData: FormData) => {
  const email = formData.get("email")?.toString();
  const supabase = await createClient();
  const origin = (await headers()).get("origin");
  const callbackUrl = formData.get("callbackUrl")?.toString();

  if (!email) {
    return encodedRedirect("error", "/forgot-password", "Email is required");
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/auth/callback?redirect_to=/reset-password`,
  });

  if (error) {
    console.error(error.message);
    return encodedRedirect(
      "error",
      "/forgot-password",
      "Could not reset password",
    );
  }

  if (callbackUrl) {
    return redirect(callbackUrl);
  }

  return encodedRedirect(
    "success",
    "/forgot-password",
    "Check your email for a link to reset your password.",
  );
};

export const resetPasswordAction = async (formData: FormData) => {
  const supabase = await createClient();

  const password = formData.get("password") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!password || !confirmPassword) {
    encodedRedirect(
      "error",
      "/reset-password",
      "Password and confirm password are required",
    );
  }

  if (password !== confirmPassword) {
    encodedRedirect("error", "/reset-password", "Passwords do not match");
  }

  const { error } = await supabase.auth.updateUser({
    password: password,
  });

  if (error) {
    encodedRedirect("error", "/reset-password", "Password update failed");
  }

  encodedRedirect("success", "/", "Password updated");
};
