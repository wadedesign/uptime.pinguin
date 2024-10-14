// app/components/create/create-incident.tsx

'use client';

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertCircle, CheckCircle, AlertTriangle, Info, Edit2, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";

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

const CoolIncidentManagement: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [formData, setFormData] = useState({
    id: '',
    title: '',
    description: '',
    status: '',
    severity: '',
    selectedMonitor: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMonitors();
    fetchIncidents();
  }, []);

  const fetchMonitors = async () => {
    try {
      const response = await axios.get('/api/createmonitor');
      setMonitors(response.data.monitors);
    } catch (error) {
      console.error('Error fetching monitors:', error);
      setError('Failed to fetch monitors. Please try again later.');
    }
  };

  const fetchIncidents = async () => {
    try {
      const response = await axios.get('/api/createincident');
      setIncidents(response.data.incidents);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setError('Failed to fetch incidents. Please try again later.');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string) => (value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload = {
        monitor_id: formData.selectedMonitor,
        title: formData.title,
        description: formData.description,
        status: formData.status,
        severity: formData.severity,
      };

      let response;
      if (formData.id) {
        response = await axios.put('/api/createincident', { ...payload, id: formData.id });
      } else {
        response = await axios.post('/api/createincident', payload);
      }

      if (response.data.success) {
        toast({
          title: formData.id ? "Incident Updated" : "Incident Created",
          description: formData.id ? "The incident has been successfully updated." : "The incident has been successfully created.",
          duration: 5000,
        });
        setFormData({
          id: '',
          title: '',
          description: '',
          status: '',
          severity: '',
          selectedMonitor: '',
        });
        fetchIncidents();
      } else {
        setError(response.data.message || 'An error occurred while processing the incident.');
      }
    } catch (error) {
      console.error('Error processing incident:', error);
      setError('An error occurred while processing the incident. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (incident: Incident) => {
    setFormData({
      id: incident.id,
      title: incident.title,
      description: incident.description,
      status: incident.status,
      severity: incident.severity,
      selectedMonitor: incident.monitor_id,
    });
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await axios.delete(`/api/createincident?id=${id}`);
      if (response.data.success) {
        toast({
          title: "Incident Deleted",
          description: "The incident has been successfully deleted.",
          duration: 5000,
        });
        fetchIncidents();
      } else {
        setError(response.data.message || 'An error occurred while deleting the incident.');
      }
    } catch (error) {
      console.error('Error deleting incident:', error);
      setError('An error occurred while deleting the incident. Please try again.');
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 p-6 min-h-screen bg-gray-900 text-white">
      <Card className="w-full lg:w-1/3 bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-xl">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">
            {formData.id ? 'Update Incident' : 'Create New Incident'}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="selectedMonitor" className="text-gray-300">Affected Monitor</Label>
              <Select onValueChange={handleSelectChange('selectedMonitor')} value={formData.selectedMonitor}>
                <SelectTrigger id="selectedMonitor" className="bg-gray-700 border-gray-600 text-white">
                  <SelectValue placeholder="Select a monitor" />
                </SelectTrigger>
                <SelectContent className="bg-gray-800 border-gray-700">
                  {monitors.map((monitor) => (
                    <SelectItem key={monitor.id} value={monitor.id} className="text-white hover:bg-gray-700">
                      {monitor.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title" className="text-gray-300">Title</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Incident title"
                required
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description" className="text-gray-300">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Describe the incident"
                rows={4}
                className="bg-gray-700 border-gray-600 text-white placeholder-gray-400"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="status" className="text-gray-300">Status</Label>
                <Select onValueChange={handleSelectChange('status')} value={formData.status}>
                  <SelectTrigger id="status" className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    <SelectItem value="investigating" className="text-white hover:bg-gray-700">Investigating</SelectItem>
                    <SelectItem value="identified" className="text-white hover:bg-gray-700">Identified</SelectItem>
                    <SelectItem value="monitoring" className="text-white hover:bg-gray-700">Monitoring</SelectItem>
                    <SelectItem value="resolved" className="text-white hover:bg-gray-700">Resolved</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="severity" className="text-gray-300">Severity</Label>
                <Select onValueChange={handleSelectChange('severity')} value={formData.severity}>
                  <SelectTrigger id="severity" className="bg-gray-700 border-gray-600 text-white">
                    <SelectValue placeholder="Select severity" />
                  </SelectTrigger>
                  <SelectContent className="bg-gray-800 border-gray-700">
                    {['low', 'medium', 'high', 'critical'].map((level) => (
                      <SelectItem key={level} value={level} className="text-white hover:bg-gray-700">
                        <div className="flex items-center">
                          {getSeverityIcon(level)}
                          <span className="ml-2 capitalize">{level}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormData({
                  id: '',
                  title: '',
                  description: '',
                  status: '',
                  severity: '',
                  selectedMonitor: '',
                })}
                className="bg-gray-700 text-white border-gray-600 hover:bg-gray-600"
              >
                Clear
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 text-white hover:bg-blue-700"
              >
                {isLoading ? 'Processing...' : (formData.id ? 'Update Incident' : 'Create Incident')}
              </Button>
            </div>
          </form>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mt-4 p-4 bg-red-900 text-white rounded-md"
            >
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2" />
                <span>{error}</span>
              </div>
            </motion.div>
          )}
        </CardContent>
      </Card>
      <Card className="w-full lg:w-2/3 bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-xl overflow-hidden">
        <CardContent className="p-6">
          <h2 className="text-2xl font-bold mb-6 text-center">Incident List</h2>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white">Title</TableHead>
                  <TableHead className="text-white">Status</TableHead>
                  <TableHead className="text-white">Severity</TableHead>
                  <TableHead className="text-white">Created At</TableHead>
                  <TableHead className="text-white">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {incidents.map((incident) => (
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">{incident.title}</TableCell>
                    <TableCell>{incident.status}</TableCell>
                    <TableCell>
                      <div className="flex items-center">
                        {getSeverityIcon(incident.severity)}
                        <span className="ml-2 capitalize">{incident.severity}</span>
                      </div>
                    </TableCell>
                    <TableCell>{new Date(incident.created_at).toLocaleString()}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          onClick={() => handleEdit(incident)}
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          onClick={() => handleDelete(incident.id)}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CoolIncidentManagement;