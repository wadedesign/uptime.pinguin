// app/page.tsx

import Navbar from "./components/status-nav";
import PublicMonitorDashboard from "./components/monitors/v-main";
export default function Home() {
  return (
    <div>
      <Navbar />
      <PublicMonitorDashboard />
    </div>
  );
}
