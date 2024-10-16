// app/dashboard/page.tsx

import VMonitorDash from '../components/monitors/MonitorDashboard';

export default function Dashboard() {
  return (
    <div className="text-white">
        <div>
          <VMonitorDash />
        </div>
    </div>
  );
}
