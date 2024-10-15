// app/dashboard/incidents/page.tsx

import DiscordNotify from '../../components/notifications/DiscordSettings'

export default function Noty() {
  return (
    <div className="text-white">
      <h1 className="text-3xl text-whitefont-bold mb-6">Notifications</h1>
      {/* Add your monitors content here */}
      <DiscordNotify  />
    </div>
  );
}
