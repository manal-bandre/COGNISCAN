import { Link } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Hero3D } from "../components/Hero3D";

export function SplashPage() {
  return (
    <div className="flex min-h-screen flex-col bg-white overflow-hidden">
      {/* Navigation Bar */}
      <nav className="flex items-center justify-between px-6 py-4 lg:px-12 backdrop-blur-md bg-white/80 fixed top-0 w-full z-40 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--brand)] text-white shadow-sm">
            <svg width="24" height="24" viewBox="0 0 38 38" fill="none" aria-hidden="true">
              <circle cx="19" cy="14" r="9" stroke="white" strokeWidth="2.2" />
              <path d="M8 32c0-6.075 4.925-11 11-11s11 4.925 11 11" stroke="white" strokeWidth="2.2" strokeLinecap="round" />
              <path d="M15 14c0-2.21 1.79-4 4-4" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900">Cogniscan</span>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/app">
            <Button variant="primary">
              Enter App
            </Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col md:flex-row mt-[72px] lg:px-12 max-w-7xl mx-auto w-full">
        <div className="flex-1 flex flex-col justify-center px-6 py-12 md:py-24 z-10">
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1]">
            Your Cognitive <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--brand)] to-emerald-400">
              Health Companion
            </span>
          </h1>
          <p className="mt-6 text-lg md:text-xl text-slate-500 max-w-lg leading-relaxed">
            Monitor, track, and improve cognitive wellbeing with advanced AI-driven assessments 
            and personalized care plans.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row gap-4">
            <Link to="/app">
              <Button variant="primary" className="h-12 px-8 text-base shadow-lg shadow-[var(--brand)]/20">
                Patient Dashboard
              </Button>
            </Link>
            <Link to="/care/app">
              <Button variant="secondary" className="h-12 px-8 text-base">
                Caretaker Dashboard
              </Button>
            </Link>
          </div>
          <div className="mt-8 flex items-center gap-4 text-sm font-medium text-slate-500">
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-200"></div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-300"></div>
              <div className="w-8 h-8 rounded-full border-2 border-white bg-slate-400 flex items-center justify-center text-[10px] text-white font-bold">+</div>
            </div>
            <span>Trusted by patients & caretakers</span>
          </div>
        </div>

        <div className="flex-1 min-h-[400px] md:min-h-full relative">
          <Hero3D />
        </div>
      </main>
    </div>
  );
}
