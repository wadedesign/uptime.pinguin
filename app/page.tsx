// app/page.tsx
import Navbar from './components/MonitoringNavbar'
import PublicMonitorDashboard from './components/monitors/PublicMonitorDashboard';
import PublicIncidentDisplay from './components/create/PublicIncidentDisplay';

export default function Home() {
  return (
    <main>
      <Navbar />
      <PublicMonitorDashboard />
      <PublicIncidentDisplay />
    </main>
  );
}
