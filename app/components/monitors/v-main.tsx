'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, RefreshCw, Clock, Globe, Server, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { motion, AnimatePresence } from "framer-motion";

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

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'up':
        return 'bg-green-500';
      case 'down':
        return 'bg-red-500';
      default:
        return 'bg-yellow-500';
    }
  };

  return (
    <motion.div
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Badge className={`${getStatusColor(status)} text-white`}>
        {status === 'up' ? <CheckCircle className="w-4 h-4 mr-1" /> : 
         status === 'down' ? <AlertCircle className="w-4 h-4 mr-1" /> : 
         <AlertTriangle className="w-4 h-4 mr-1" />}
        {status.toUpperCase()}
      </Badge>
    </motion.div>
  );
};

const MonitorCard: React.FC<{ monitor: Monitor; status: MonitorStatus | undefined; onRefresh: () => void }> = ({ monitor, status, onRefresh }) => {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-primary text-primary-foreground">
        <CardTitle className="flex items-center justify-between">
          <span>{monitor.name}</span>
          <AnimatePresence mode="wait">
            {status && (
              <StatusBadge key={status.status} status={status.status} />
            )}
          </AnimatePresence>
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-semibold">Response Time:</span>
                    <span>{status.responseTime}ms</span>
                  </div>
                  <Progress value={Math.min(status.responseTime / 10, 100)} />
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Response time: {status.responseTime}ms</p>
                <p>Ideal: &lt;100ms, Good: &lt;300ms, Poor: &gt;300ms</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
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

const PublicMonitorDashboard: React.FC = () => {
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
        monitorId: monitor.id,
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

  const handleRefresh = async (monitorId: string) => {
    const monitor = monitors.find((m) => m.id === monitorId);
    if (monitor) {
      const status = await checkMonitorStatus(monitor);
      setMonitorStatuses((prevStatuses) =>
        prevStatuses.map((s) => (s.id === monitorId ? { ...s, ...status } : s))
      );
    }
  };

  const getOverallStatus = () => {
    if (monitorStatuses.every((status) => status.status === 'up')) {
      return 'All systems operational';
    } else if (monitorStatuses.every((status) => status.status === 'down')) {
      return 'Major outage';
    } else {
      return 'Partial system outage';
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6 pt-32">Service Status Dashboard</h1>
        <Skeleton className="h-10 w-64 mb-6" />
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
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Service Status Dashboard</h1>
        <Card className="w-full max-w-md mx-auto">
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
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Service Status Dashboard</h1>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Overall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold">{getOverallStatus()}</p>
          <p className="text-sm text-muted-foreground">Last updated: {new Date().toLocaleString()}</p>
        </CardContent>
      </Card>
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
    </div>
  );
};

export default PublicMonitorDashboard;