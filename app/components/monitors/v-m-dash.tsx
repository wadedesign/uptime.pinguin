// app/components/monitors/v-m-dash.tsx

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
  // Add other fields as needed
}

interface MonitorStatus {
  id: string;
  status: 'up' | 'down' | 'error';
  responseTime?: number;
}

const VMDash: React.FC = () => {
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
    switch (monitor.protocol.toLowerCase()) {
      case 'http':
      case 'https':
        return await checkHttpStatus(monitor);
      case 'icmp':
        return await checkPingStatus(monitor);
      default:
        throw new Error(`Unsupported protocol: ${monitor.protocol}`);
    }
  };

  const checkHttpStatus = async (monitor: Monitor): Promise<Omit<MonitorStatus, 'id'>> => {
    try {
      const response = await axios.post('/api/connection-handlers/https', {
        url: monitor.protocol.toLowerCase() === 'https' ? `https://${monitor.url_ip_address}` : `http://${monitor.url_ip_address}`,
        method: 'GET',
        timeout: 5000, // 5 seconds timeout
      });
      console.log(`HTTP(S) response for ${monitor.url_ip_address}:`, response.data);
      return {
        status: response.data.status < 400 ? 'up' : 'down',
        responseTime: response.data.responseTime,
      };
    } catch (error) {
      console.error(`Error checking HTTP(S) status for ${monitor.url_ip_address}:`, error);
      return { status: 'down' };
    }
  };

  const checkPingStatus = async (monitor: Monitor): Promise<Omit<MonitorStatus, 'id'>> => {
    try {
      const response = await axios.post('/api/connection-handlers/ping', {
        ip: monitor.url_ip_address.trim(), // Trim the IP address here as well
        timeout: 5000, // 5 seconds timeout
      });
      console.log(`Ping response for ${monitor.url_ip_address}:`, response.data);
      return {
        status: response.data.alive ? 'up' : 'down',
        responseTime: response.data.time !== 'unknown' ? parseFloat(response.data.time) : undefined,
      };
    } catch (error) {
      console.error(`Error pinging ${monitor.url_ip_address}:`, error);
      return { status: 'down' };
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {monitors.map((monitor) => {
        const status = monitorStatuses.find((s) => s.id === monitor.id);
        return (
          <Card key={monitor.id}>
            <CardHeader>
              <CardTitle>{monitor.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>URL/IP: {monitor.url_ip_address}</p>
              <p>Protocol: {monitor.protocol}</p>
              {monitor.port && <p>Port: {monitor.port}</p>}
              <p>Check Interval: {monitor.check_interval} seconds</p>
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
  );
};

export default VMDash;
