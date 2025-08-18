import { Navigation } from "@/components/ui/navigation";

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <main className="container mx-auto px-4 py-16">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl">
            Welcome to <span className="text-primary">Your Company</span>
          </h1>
        </div>
      </main>
    </div>
  );
}
