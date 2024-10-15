// app/page.tsx

import Navbar from "./components/MonitoringNavbar";
import PublicMonitorDashboard from "./components/monitors/PublicMonitorDashboard";
import PublicIncidentDisplay from "./components/create/PublicIncidentDisplay";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="pt-20 flex-grow">
        <PublicMonitorDashboard />
      </main>
      <footer className="mt-8 pb-4">
        <PublicIncidentDisplay />
      </footer>
    </div>
  );
}
