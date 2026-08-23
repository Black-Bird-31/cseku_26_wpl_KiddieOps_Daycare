import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6">
      <div className="max-w-2xl w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl text-center space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600/20 border border-blue-500/30 rounded-full text-blue-400 text-xs font-semibold uppercase tracking-wider">
          KiddieOps Platform v1.0
        </div>
        
        <h1 className="text-3xl font-extrabold text-white tracking-tight sm:text-4xl">
          KiddieOps Daycare Management
        </h1>
        
        <p className="text-slate-400 text-sm sm:text-base leading-relaxed">
          Smart Daycare Operations, Parent Complaints with Proof, Child Media Sharing, and AI Guardian Platform.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 text-left">
            <div className="text-blue-400 font-bold text-sm">Administrator</div>
            <p className="text-slate-400 text-xs mt-1">Full operational control, classrooms, complaints & notices.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 text-left">
            <div className="text-emerald-400 font-bold text-sm">Caregiver</div>
            <p className="text-slate-400 text-xs mt-1">Attendance, daily activity logs, photo/video moments.</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-700/60 rounded-xl p-4 text-left">
            <div className="text-amber-400 font-bold text-sm">Parent & AI</div>
            <p className="text-slate-400 text-xs mt-1">Real-time daily feed, media gallery, AI Guardian chat.</p>
          </div>
        </div>

        <div className="pt-4 border-t border-slate-700/60 flex flex-wrap items-center justify-center gap-3 text-xs text-slate-400">
          <span>Next.js 14 App Router</span>
          <span>•</span>
          <span>Drizzle ORM</span>
          <span>•</span>
          <span>PostgreSQL</span>
          <span>•</span>
          <span>Cloudinary CDN</span>
        </div>
      </div>
    </main>
  );
}
