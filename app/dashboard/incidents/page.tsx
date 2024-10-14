// app/dashboard/incidents/page.tsx

import IncidentCreate from '../../components/create/IncidentManagement'

export default function Incidents() {
  return (
    <div className="text-white">
      <h1 className="text-3xl text-whitefont-bold mb-6">Incidents</h1>
      {/* Add your monitors content here */}
      <IncidentCreate />
    </div>
  );
}
