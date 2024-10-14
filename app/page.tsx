// app/page.tsx

import Navbar from "./components/status-nav";
import PublicMonitorDashboard from "./components/monitors/v-main";
import PublicIncidentDisplay from "./components/create/public-incident";

export default function Home() {
  return (
    <div>
      <Navbar />
      <PublicMonitorDashboard />
      <PublicIncidentDisplay />
    </div>
  );
}
