'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, RefreshCw, Clock, Globe, Server, AlertTriangle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
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
      <Badge className={`${getStatusColor(status)} text-white px-2 py-1 rounded-full text-xs font-semibold uppercase`}>
        {status === 'up' ? <CheckCircle className="w-3 h-3 mr-1 inline" /> : 
         status === 'down' ? <AlertCircle className="w-3 h-3 mr-1 inline" /> : 
         <AlertTriangle className="w-3 h-3 mr-1 inline" />}
        {status}
      </Badge>
    </motion.div>
  );
};

const MonitorCard: React.FC<{ monitor: Monitor; status: MonitorStatus | undefined; onRefresh: () => void }> = ({ monitor, status, onRefresh }) => {
  return (
    <Card className="overflow-hidden bg-zinc-900/70 border-zinc-700 backdrop-blur-sm shadow-lg hover:shadow-xl transition-shadow duration-300 flex flex-col h-full">
      <CardHeader className="bg-zinc-800/50 border-b border-zinc-700 pb-3">
        <CardTitle className="flex items-center justify-between text-white">
          <span className="text-lg font-semibold truncate">{monitor.name}</span>
          <AnimatePresence mode="wait">
            {status && (
              <StatusBadge key={status.status} status={status.status} />
            )}
          </AnimatePresence>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4 text-zinc-300 flex-grow">
        <div className="space-y-3 text-sm">
          <div className="flex items-center space-x-2 bg-zinc-800/30 p-2 rounded-md">
            <Globe className="w-4 h-4 text-teal-400" />
            <span className="font-medium text-zinc-100">{monitor.url_ip_address}</span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-teal-400" />
              <span className="font-medium">Protocol:</span>
            </div>
            <div>{monitor.protocol.toUpperCase()}</div>
          </div>
          {monitor.port && (
            <div className="flex items-center justify-between">
              <span className="font-medium">Port:</span>
              <div>{monitor.port}</div>
            </div>
          )}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4 text-teal-400" />
              <span className="font-medium">Interval:</span>
            </div>
            <div>{monitor.check_interval}s</div>
          </div>
        </div>
        {status && status.responseTime && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">Response Time:</span>
                    <span className="text-teal-400 font-semibold">{status.responseTime}ms</span>
                  </div>
                  <div className="relative h-2 bg-zinc-700 rounded-full overflow-hidden">
                    <div
                      className="absolute top-0 left-0 h-full bg-teal-500 transition-all duration-300 ease-in-out"
                      style={{ width: `${Math.min(status.responseTime / 10, 100)}%` }}
                    />
                  </div>
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
      <CardFooter className="bg-zinc-800/50 border-t border-zinc-700 p-3 mt-auto">
        <Button 
          variant="outline" 
          size="sm" 
          onClick={onRefresh} 
          className="w-full bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:bg-teal-600 hover:text-white transition-colors duration-200"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
};

export default function PublicMonitorDashboard() {
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
        <h1 className="text-3xl font-bold mb-6 pt-32 text-white">Service Status Dashboard</h1>
        <Skeleton className="h-10 w-64 mb-6 bg-zinc-800" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(6)].map((_, index) => (
            <Card key={index} className="overflow-hidden bg-zinc-900/70 border-zinc-700 backdrop-blur-sm shadow-lg">
              <CardHeader className="bg-zinc-800/50 border-b border-zinc-700">
                <Skeleton className="h-6 w-3/4 bg-zinc-700" />
              </CardHeader>
              <CardContent className="p-4 space-y-4">
                <Skeleton className="h-4 w-full bg-zinc-700" />
                <Skeleton className="h-4 w-full bg-zinc-700" />
                <Skeleton className="h-4 w-full bg-zinc-700" />
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
        <h1 className="text-3xl font-bold mb-6 text-white">Service Status Dashboard</h1>
        <Card className="w-full max-w-md mx-auto bg-zinc-900/70 border-zinc-700 backdrop-blur-sm shadow-lg">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-zinc-300">{error}</p>
          </CardContent>
          <CardFooter>
            <Button onClick={fetchMonitors} className="w-full bg-zinc-700/50 border-zinc-600 text-zinc-300 hover:bg-teal-600 hover:text-white transition-colors duration-200">Retry</Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6 text-white">Service Status Dashboard</h1>
      <Card className="mb-6 bg-zinc-900/70 border-zinc-700 backdrop-blur-sm shadow-lg">
        <CardHeader>
          <CardTitle className="text-white text-xl">Overall Status</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg font-semibold text-teal-400">{getOverallStatus()}</p>
          <p className="text-sm text-zinc-400 mt-1">Last updated: {new Date().toLocaleString()}</p>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
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
}