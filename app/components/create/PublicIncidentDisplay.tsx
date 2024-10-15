'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface Monitor {
  id: string;
  name: string;
}

interface Incident {
  id: string;
  monitor_id: string;
  title: string;
  description: string;
  status: string;
  severity: string;
  created_at: string;
  updated_at: string;
}

const PublicIncidentDisplay: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchIncidents = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const incidentsResponse = await axios.get('/api/createincident');
      const monitorsResponse = await axios.get('/api/createmonitor');
      setIncidents(incidentsResponse.data.incidents);
      setMonitors(monitorsResponse.data.monitors);
      toast({
        title: "Data refreshed",
        description: "Incident information has been updated.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Unable to load incident information. Please try again later.');
      toast({
        title: "Error",
        description: "Failed to fetch incident information. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchIncidents();
    const interval = setInterval(fetchIncidents, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchIncidents]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'low':
        return 'bg-blue-500';
      case 'medium':
        return 'bg-yellow-500';
      case 'high':
        return 'bg-orange-500';
      case 'critical':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'resolved':
        return 'text-green-500';
      case 'investigating':
        return 'text-yellow-500';
      case 'identified':
        return 'text-orange-500';
      case 'monitoring':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getMonitorName = (monitorId: string) => {
    const monitor = monitors.find(m => m.id === monitorId);
    return monitor ? monitor.name : 'Unknown Monitor';
  };

  return (
    <div className="bg-gradient-to-b from-black to-zinc-900 min-h-screen p-6">
      <Card className="w-full bg-zinc-900/50 border-zinc-800 backdrop-blur-sm">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold text-white">Current Incidents</CardTitle>
            <CardDescription className="text-zinc-400">Updates on ongoing and recent incidents</CardDescription>
          </div>
          <Button 
            onClick={fetchIncidents} 
            variant="outline" 
            size="icon" 
            disabled={isLoading}
            className="bg-transparent border-zinc-700 text-zinc-400 hover:bg-zinc-800 hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="sr-only">Refresh incidents</span>
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <AnimatePresence>
              {incidents.map((incident) => (
                <motion.div
                  key={incident.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="border border-zinc-800 rounded-lg p-4 bg-zinc-900/50 backdrop-blur-sm"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white">{incident.title}</h3>
                    <h2 className="text-lg font-semibold text-white">{getMonitorName(incident.monitor_id)}</h2>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(incident.severity)} text-white`}>
                      {incident.severity}
                    </div>
                  </div>
                  <p className="text-sm text-zinc-400 mb-2">{incident.description}</p>
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-medium ${getStatusColor(incident.status)}`}>
                      Status: {incident.status}
                    </span>
                    <span className="text-zinc-500">
                      Last updated: {new Date(incident.updated_at).toLocaleString()}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {incidents.length === 0 && (
              <div className="text-center py-8 text-zinc-400">
                <CheckCircle className="h-12 w-12 mx-auto mb-4" />
                <p>No active incidents at this time.</p>
              </div>
            )}
          </div>
        </CardContent>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="m-4 p-4 bg-red-900/50 text-red-200 rounded-md border border-red-700"
          >
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </motion.div>
        )}
      </Card>
    </div>
  );
};

export default PublicIncidentDisplay;