'use client';

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, CheckCircle, RefreshCw, Clock, Globe, Server } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';

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
    if (responseTime < 100) return 'bg-green-600';
    if (responseTime < 300) return 'bg-yellow-600';
    return 'bg-red-600';
  };

  if (isLoading) {
    return <Skeleton className="h-6 w-full bg-zinc-700" />;
  }

  return (
    <div className="mt-4">
      <h3 className="text-sm font-semibold mb-2 text-teal-400">Ping History (Last 20)</h3>
      <div className="flex flex-wrap gap-1">
        {pingHistory.map((ping, index) => (
          <TooltipProvider key={index}>
            <Tooltip>
              <TooltipTrigger>
                <div
                  className={`w-4 h-4 rounded-sm ${getBlockColor(ping.response_time)}`}
                />
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-800 border-zinc-700 text-zinc-300">
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
    <Card className="overflow-hidden bg-zinc-800 border-zinc-700">
      <CardHeader className="bg-zinc-800 text-teal-400">
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
      <CardContent className="p-4 space-y-4 text-zinc-300">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="flex items-center">
            <Globe className="w-4 h-4 mr-2 text-teal-400" />
            <span className="font-semibold">URL/IP:</span>
          </div>
          <div>{monitor.url_ip_address}</div>
          <div className="flex items-center">
            <Server className="w-4 h-4 mr-2 text-teal-400" />
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
            <Clock className="w-4 h-4 mr-2 text-teal-400" />
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
      <CardFooter className="bg-zinc-800">
        <Button variant="outline" size="sm" onClick={onRefresh} className="w-full bg-zinc-700 text-zinc-300 hover:bg-zinc-600 hover:text-white">
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

  const checkMonitorStatus = useCallback(async (monitor: Monitor): Promise<Omit<MonitorStatus, 'id'>> => {
    switch (monitor.protocol.toLowerCase()) {
      case 'http':
      case 'https':
        return await checkHttpStatus(monitor);
      case 'icmp':
        return await checkPingStatus(monitor);
      default:
        throw new Error(`Unsupported protocol: ${monitor.protocol}`);
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
  }, [monitors, checkMonitorStatus]);

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

  return (
    <div className="flex flex-col gap-8 p-6 min-h-screen text-white">
      <motion.div
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-7xl mx-auto"
      >
        <Card className="bg-zinc-900 border-zinc-800 shadow-xl">
          <CardContent className="p-8">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="flex justify-center mb-6"
            >
              <Image
                src="/github/Uptim logo.png"
                alt="Uptim Logo"
                width={80}
                height={80}
                className="rounded-full"
              />
            </motion.div>
            <h2 className="text-3xl font-bold mb-6 text-center text-teal-400">
              Monitor Dashboard
            </h2>
            <AnimatePresence mode="wait">
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
              >
                {isLoading ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[...Array(6)].map((_, index) => (
                      <Card key={index} className="overflow-hidden bg-zinc-800 border-zinc-700">
                        <CardHeader className="bg-zinc-800">
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
                ) : error ? (
                  <div className="flex items-center justify-center h-64">
                    <Card className="w-full max-w-md bg-zinc-800 border-zinc-700">
                      <CardHeader>
                        <CardTitle className="text-red-400">Error</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-zinc-300">{error}</p>
                      </CardContent>
                      <CardFooter>
                        <Button onClick={fetchMonitors} className="bg-teal-600 hover:bg-teal-700 text-white">Retry</Button>
                      </CardFooter>
                    </Card>
                  </div>
                ) : (
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
                )}
              </motion.div>
            </AnimatePresence>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default VMDash;
