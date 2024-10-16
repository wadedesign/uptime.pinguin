// app/page.tsx
import Navbar from './components/MonitoringNavbar'
import PublicMonitorDashboard from './components/monitors/PublicMonitorDashboard';
import PublicIncidentDisplay from './components/create/PublicIncidentDisplay';

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-grow pt-20">
        <PublicMonitorDashboard />
      </main>
      <PublicIncidentDisplay />
    </div>
  );
}
