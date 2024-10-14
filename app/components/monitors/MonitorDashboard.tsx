'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, RefreshCw, Clock, Globe, Server } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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

interface PingData {
  timestamp: string;
  response_time: number;
}

const PingHistory: React.FC<{ monitorId: string }> = ({ monitorId }) => {
  const [pingHistory, setPingHistory] = useState<PingData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchPingHistory = async () => {
      setIsLoading(true);
      try {
        const response = await axios.get(`/api/getpinghistory?monitorId=${monitorId}&limit=20`);
        setPingHistory(response.data.history);
      } catch (error) {
        console.error('Error fetching ping history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPingHistory();
    const interval = setInterval(fetchPingHistory, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [monitorId]);

  const getBlockColor = (responseTime: number) => {
    if (responseTime < 100) return 'bg-green-500';
    if (responseTime < 300) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  if (isLoading) {
    return <Skeleton className="h-6 w-full" />;
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold mb-2">Ping History (Last 20)</h3>
      <div className="flex flex-wrap gap-1">
        {pingHistory.map((ping, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger>
                <div
                  className={`w-4 h-4 rounded-sm ${getBlockColor(ping.response_time)}`}
                />
              </TooltipTrigger>
              <TooltipContent>
                <p>{new Date(ping.timestamp).toLocaleString()}</p>
                <p>{ping.response_time}ms</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>
    </div>
  );
};

const MonitorCard: React.FC<{ monitor: Monitor; status: MonitorStatus | undefined; onRefresh: () => void }> = ({ monitor, status, onRefresh }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="flex items-center justify-between">
          <span>{monitor.name}</span>
          {status && (
            <Badge variant={status.status === 'up' ? 'default' : 'destructive'} className="ml-2">
              {status.status === 'up' ? <CheckCircle className="w-4 h-4 mr-1" /> : <AlertCircle className="w-4 h-4 mr-1" />}
              {status.status.toUpperCase()}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Globe className="w-4 h-4 mr-2" />
            <span className="font-semibold">URL/IP:</span>
          </div>
          <div>{monitor.url_ip_address}</div>
          <div className="flex items-center">
            <Server className="w-4 h-4 mr-2" />
            <span className="font-semibold">Protocol:</span>
          </div>
          <div>{monitor.protocol}</div>
          {monitor.port && (
            <>
              <div className="flex items-center">
                <span className="font-semibold">Port:</span>
              </div>
              <div>{monitor.port}</div>
            </>
          )}
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-2" />
            <span className="font-semibold">Interval:</span>
          </div>
          <div>{monitor.check_interval}s</div>
        </div>
        {status && status.responseTime && (
          <div className="text-sm">
            <span className="font-semibold">Response Time:</span> {status.responseTime}ms
          </div>
        )}
        <PingHistory monitorId={monitor.id} />
      </CardContent>
      <CardFooter className="bg-muted">
        <Button variant="outline" size="sm" onClick={onRefresh} className="w-full">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
};

const VMDash: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [monitorStatuses, setMonitorStatuses] = useState<MonitorStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMonitors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/createmonitor');
      setMonitors(response.data.monitors);
    } catch (error) {
      console.error('Error fetching monitors:', error);
      setError('Failed to fetch monitors. Please try again later.');
    } finally {
      setIsLoading(false);
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
    if (monitors.length > 0) {
      checkMonitorStatuses();
      const interval = setInterval(checkMonitorStatuses, 60000); // Check every minute
      return () => clearInterval(interval);
    }
  }, [monitors, checkMonitorStatuses]);

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
        monitorId: monitor.id,
      });
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
        ip: monitor.url_ip_address.trim(),
        timeout: 5000, // 5 seconds timeout
        monitorId: monitor.id,
      });
      return {
        status: response.data.alive ? 'up' : 'down',
        responseTime: response.data.time !== 'unknown' ? Math.round(parseFloat(response.data.time)) : undefined,
      };
    } catch (error) {
      console.error(`Error pinging ${monitor.url_ip_address}:`, error);
      return { status: 'down' };
    }
  };

  const handleRefresh = async (monitorId: string) => {
    const monitor = monitors.find((m) => m.id === monitorId);
    if (monitor) {
      const status = await checkMonitorStatus(monitor);
      setMonitorStatuses((prevStatuses) =>
        prevStatuses.map((s) => (s.id === monitorId ? { ...s, ...status } : s))
      );
    }
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="overflow-hidden">
            <CardHeader className="bg-primary">
              <Skeleton className="h-6 w-3/4" />
            </CardHeader>
            <CardContent className="p-4 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={fetchMonitors}>Retry</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {monitors.map((monitor) => (
        <MonitorCard
          key={monitor.id}
          monitor={monitor}
          status={monitorStatuses.find((s) => s.id === monitor.id)}
          onRefresh={() => handleRefresh(monitor.id)}
        />
      ))}
    </div>
  );
};

export default VMDash;