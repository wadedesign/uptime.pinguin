// app/dashboard/page.tsx

import VMonitorDash from '../components/monitors/v-m-dash';

export default function Dashboard() {
  return (
    <div className="text-white">
      <h1 className="text-3xl font-bold mb-6">Dashboard Overview</h1>
        <div>
          <VMonitorDash />
        </div>
    </div>
  );
}
