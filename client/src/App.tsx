import { AuthProvider } from "@/context/AuthContext";
import { TodayBanner } from "@/components/TodayBanner";
import { TortillaCalendar } from "@/components/TortillaCalendar";
import { ScheduleList } from "@/components/ScheduleList";
import { MemberManager } from "@/components/MemberManager";
import { AdminLogin } from "@/components/AdminLogin";
import { NotificationToggle } from "@/components/NotificationToggle";
import { Separator } from "@/components/ui/separator";

function AppContent() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 to-orange-50/30">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between px-4 py-3">
          <h1 className="text-xl font-bold text-amber-900 flex items-center gap-2">
            <span role="img" aria-label="tortilla">
              {"\uD83E\uDED3"}
            </span>
            Calendario de Tortillas
          </h1>
          <div className="flex items-center gap-1">
            <NotificationToggle />
            <AdminLogin />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        {/* Today banner */}
        <TodayBanner />

        {/* Calendar + Schedule list */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <TortillaCalendar />
          <ScheduleList />
        </div>

        <Separator />

        {/* Admin section */}
        <MemberManager />
      </main>

      {/* Footer */}
      <footer className="border-t mt-8 py-4 text-center text-xs text-muted-foreground">
        Calendario de Tortillas &mdash; Hecho con cariño para el departamento
      </footer>
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
