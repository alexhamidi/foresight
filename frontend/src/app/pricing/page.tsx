import DynamicGrid from "@/components/DynamicGrid";

export default function Pricing() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center relative">
      <div className="fixed inset-0 w-full h-full z-0">
        <DynamicGrid />
      </div>
      <div className="relative z-10 max-w-2xl mx-auto text-center px-4">
        <h1 className="text-4xl font-bold mb-4 text-zinc-900">
          Pricing Plans Coming Soon
        </h1>
        <p className="text-lg text-zinc-600 mb-6">
          We're working on exciting paid plans that will offer higher message
          limits and advanced features. Stay tuned for updates!
        </p>
        <div className="inline-flex items-center justify-center px-4 py-2 bg-zinc-100/90 rounded-full">
          <p className="text-sm text-zinc-600">
            Currently offering{" "}
            <span className="font-medium">15 free messages</span> per chat
          </p>
        </div>
      </div>
    </main>
  );
}
