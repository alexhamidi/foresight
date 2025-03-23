import { SignUp } from "@clerk/nextjs";
import DynamicGrid from "@/components/DynamicGrid";

export default function SignUpPage() {
  return (
    <main className="min-h-screen">
      {/* Background layer */}
      <div className="fixed inset-0 w-full h-full z-0">
        <DynamicGrid />
      </div>

      {/* Content layer */}
      <div className="relative z-10 min-h-screen overflow-y-auto">
        <div className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
          <div className="w-full max-w-md space-y-8">

            <SignUp
              appearance={{
                elements: {
                  formButtonPrimary: 'bg-zinc-900 hover:bg-zinc-800',
                  card: 'rounded-lg shadow-md',
                },
              }}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
