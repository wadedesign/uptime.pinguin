// app/components/main-boi.tsx
// DEPRECATED: This component is no longer in use. Kept for reference purposes only.

'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Activity, BarChart2, Bell, Settings } from 'lucide-react';
import MonitorPlaceholder from './monitors/MonitorManagement';

const modules = [
  { id: '1', title: 'Monitor', icon: <Activity className="h-5 w-5" />, component: <MonitorPlaceholder /> },
  { id: '2', title: 'Analytics', icon: <BarChart2 className="h-5 w-5" />, component: <div>Analytics Content</div> },
  { id: '3', title: 'Notifications', icon: <Bell className="h-5 w-5" />, component: <div>Notifications Content</div> },
  { id: '4', title: 'Settings', icon: <Settings className="h-5 w-5" />, component: <div>Settings Content</div> },
];

export default function ModernGridDashboard() {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {modules.map((module) => (
            <Card key={module.id} className="shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-medium">
                  {module.title}
                </CardTitle>
                {module.icon}
              </CardHeader>
              <CardContent>
                <div className="h-[250px] overflow-auto">
                  {module.component}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}