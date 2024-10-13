// app/components/monitors/v-main.tsx

'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Monitor {
  id: string;
  name: string;
  url_ip_address: string;
  protocol: string;
  port?: number;
  check_interval: number;
}

interface MonitorStatus {
  id: string;
  status: 'up' | 'down' | 'error';
  responseTime?: number;
}

const protocolHandlers = {
  https: '/api/connection-handlers/https',
  icmp: '/api/connection-handlers/ping',
  // we will add more later
};

const PublicMonitorDashboard: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [monitorStatuses, setMonitorStatuses] = useState<MonitorStatus[]>([]);

  const fetchMonitors = useCallback(async () => {
    try {
      const response = await axios.get('/api/createmonitor');
      setMonitors(response.data.monitors);
    } catch (error) {
      console.error('Error fetching monitors:', error);
    }
  }, []);

  const checkMonitorStatuses = useCallback(async () => {
    const statuses = await Promise.all(
      monitors.map(async (monitor) => {
        try {
          const status = await checkMonitorStatus(monitor);
          return { id: monitor.id, ...status };
        } catch (error) {
          console.error(`Error checking monitor ${monitor.id}:`, error);
          return { id: monitor.id, status: 'error' as const };
        }
      })
    );
    setMonitorStatuses(statuses);
  }, [monitors]);

  useEffect(() => {
    fetchMonitors();
  }, [fetchMonitors]);

  useEffect(() => {
    checkMonitorStatuses();
    const interval = setInterval(checkMonitorStatuses, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [checkMonitorStatuses]);

  const checkMonitorStatus = async (monitor: Monitor): Promise<Omit<MonitorStatus, 'id'>> => {
    const protocol = monitor.protocol.toLowerCase();
    const handler = protocolHandlers[protocol as keyof typeof protocolHandlers];

    if (!handler) {
      throw new Error(`Unsupported protocol: ${protocol}`);
    }

    try {
      const response = await axios.post(handler, {
        url: protocol === 'https' ? `https://${monitor.url_ip_address}` : `http://${monitor.url_ip_address}`,
        ip: monitor.url_ip_address.trim(),
        method: 'GET',
        timeout: 5000,
        monitorId: monitor.id, // Add this line to include the monitorId
      });

      if (protocol === 'icmp') {
        return {
          status: response.data.alive ? 'up' : 'down',
          responseTime: response.data.time !== 'unknown' ? parseFloat(response.data.time) : undefined,
        };
      } else {
        return {
          status: response.data.status < 400 ? 'up' : 'down',
          responseTime: response.data.responseTime,
        };
      }
    } catch (error) {
      console.error(`Error checking status for ${monitor.url_ip_address}:`, error);
      return { status: 'down' };
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Service Status Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {monitors.map((monitor) => {
          const status = monitorStatuses.find((s) => s.id === monitor.id);
          return (
            <Card key={monitor.id}>
              <CardHeader>
                <CardTitle>{monitor.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>Service: {monitor.url_ip_address}</p>
                <p>Check Interval: Every {monitor.check_interval} seconds</p>
                <div className="mt-2">
                  Status: 
                  {status ? (
                    <Badge variant={status.status === 'up' ? 'default' : 'destructive'}>
                      {status.status.toUpperCase()}
                    </Badge>
                  ) : (
                    <Badge variant="secondary">CHECKING</Badge>
                  )}
                </div>
                {status && status.responseTime && (
                  <p>Response Time: {status.responseTime}ms</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default PublicMonitorDashboard;
