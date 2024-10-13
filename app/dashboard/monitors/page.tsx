// app/dashboard/monitors/page.tsx

import MonitorCreate from '../../components/monitors/create-one'

export default function Monitors() {
  return (
    <div className="text-white">
      <h1 className="text-3xl text-whitefont-bold mb-6">Monitors</h1>
      {/* Add your monitors content here */}
      <MonitorCreate />
    </div>
  );
}
