// app/components/monitors/create-one.tsx

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"

type Monitor = {
  id: string;
  name: string;
  url_ip_address: string;
  protocol: string;
  port?: number;
  check_interval: number;
  timeout?: number;
  alert_type?: string;
  alert_threshold?: number;
  expected_status_code?: number;
  content_match?: string;
  ssl_tls_check?: boolean;
  auth_details?: Record<string, any>;
  retry_count?: number;
  custom_headers?: Record<string, any>;
  dns_query_type?: string;
  ping_count?: number;
};

export default function MonitorManagement() {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentMonitor, setCurrentMonitor] = useState<Monitor | null>(null);
  const [formData, setFormData] = useState<Partial<Monitor>>({});

  useEffect(() => {
    fetchMonitors();
  }, []);

  const fetchMonitors = async () => {
    try {
      const response = await fetch('/api/createmonitor');
      if (response.ok) {
        const data = await response.json();
        setMonitors(data.monitors);
      } else {
        console.error('Failed to fetch monitors');
      }
    } catch (error) {
      console.error('Error fetching monitors:', error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = isEditModalOpen ? '/api/createmonitor' : '/api/createmonitor';
    const method = isEditModalOpen ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        fetchMonitors();
        closeModals();
      } else {
        console.error('Failed to submit monitor');
      }
    } catch (error) {
      console.error('Error submitting monitor:', error);
    }
  };

  const handleDelete = async () => {
    if (!currentMonitor) return;

    try {
      const response = await fetch(`/api/createmonitor?id=${currentMonitor.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchMonitors();
        closeModals();
      } else {
        console.error('Failed to delete monitor');
      }
    } catch (error) {
      console.error('Error deleting monitor:', error);
    }
  };

  const openAddModal = () => {
    setFormData({});
    setIsAddModalOpen(true);
  };

  const openEditModal = (monitor: Monitor) => {
    setCurrentMonitor(monitor);
    setFormData(monitor);
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (monitor: Monitor) => {
    setCurrentMonitor(monitor);
    setIsDeleteModalOpen(true);
  };

  const closeModals = () => {
    setIsAddModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setCurrentMonitor(null);
    setFormData({});
  };

  return (
    <div className="min-h-screen p-8">
      <Card className="bg-zinc-900 border-zinc-800 mb-8">
        <CardHeader>
          <CardTitle className="text-2xl font-light text-white flex justify-between items-center">
            Monitor Management
            <Button onClick={openAddModal} className="bg-teal-600 hover:bg-teal-700 text-white">
              <Plus size={20} className="mr-2" /> Add Monitor
            </Button>
          </CardTitle>
        </CardHeader>
      </Card>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        {monitors.map((monitor) => (
          <Card key={monitor.id} className="bg-zinc-900 border-zinc-800">
            <CardHeader>
              <CardTitle className="text-lg font-medium text-white">{monitor.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-zinc-400 mb-1">{monitor.url_ip_address}</p>
              <p className="text-zinc-400 mb-4">{monitor.protocol} - Interval: {monitor.check_interval}s</p>
            </CardContent>
            <CardFooter className="flex justify-end space-x-2">
              <Button variant="outline" size="sm" onClick={() => openEditModal(monitor)} className="bg-zinc-800 text-white hover:bg-zinc-700">
                <Edit size={16} className="mr-2" /> Edit
              </Button>
              <Button variant="outline" size="sm" onClick={() => openDeleteModal(monitor)} className="bg-zinc-800 text-white hover:bg-zinc-700">
                <Trash2 size={16} className="mr-2" /> Delete
              </Button>
            </CardFooter>
          </Card>
        ))}
      </motion.div>

      <AnimatePresence>
        {(isAddModalOpen || isEditModalOpen) && (
          <Dialog open={isAddModalOpen || isEditModalOpen} onOpenChange={closeModals}>
            <DialogContent className="bg-zinc-900 text-white max-w-6xl flex flex-col h-[80vh]">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>{isEditModalOpen ? 'Edit Monitor' : 'Add Monitor'}</DialogTitle>
              </DialogHeader>
              <div className="flex-grow flex overflow-hidden">
                <form onSubmit={handleSubmit} className="flex-grow flex">
                  <ScrollArea className="flex-grow p-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Name *</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name || ''}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="url_ip_address">URL/IP Address *</Label>
                        <Input
                          id="url_ip_address"
                          name="url_ip_address"
                          value={formData.url_ip_address || ''}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="protocol">Protocol *</Label>
                        <Select
                          name="protocol"
                          value={formData.protocol || ''}
                          onValueChange={(value) => handleSelectChange('protocol', value)}
                          required
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Select protocol" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectItem value="HTTPS">HTTPS</SelectItem>
                            <SelectItem value="ICMP">ICMP (Ping)</SelectItem>
                            <SelectItem value="TCP">TCP</SelectItem>
                            <SelectItem value="UDP">UDP</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {(formData.protocol === 'TCP' || formData.protocol === 'UDP') && (
                        <div>
                          <Label htmlFor="port">Port *</Label>
                          <Input
                            id="port"
                            name="port"
                            type="number"
                            value={formData.port || ''}
                            onChange={handleInputChange}
                            className="bg-zinc-800 border-zinc-700 text-white"
                            required
                          />
                        </div>
                      )}
                      <div>
                        <Label htmlFor="check_interval">Check Interval (seconds) *</Label>
                        <Input
                          id="check_interval"
                          name="check_interval"
                          type="number"
                          value={formData.check_interval || ''}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700 text-white"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="timeout">Timeout (seconds)</Label>
                        <Input
                          id="timeout"
                          name="timeout"
                          type="number"
                          value={formData.timeout || ''}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="alert_type">Alert Type</Label>
                        <Select
                          name="alert_type"
                          value={formData.alert_type || ''}
                          onValueChange={(value) => handleSelectChange('alert_type', value)}
                        >
                          <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectValue placeholder="Select alert type" />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-800 border-zinc-700 text-white">
                            <SelectItem value="email">Email</SelectItem>
                            <SelectItem value="sms">SMS</SelectItem>
                            <SelectItem value="webhook">Webhook</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label htmlFor="alert_threshold">Alert Threshold</Label>
                        <Input
                          id="alert_threshold"
                          name="alert_threshold"
                          type="number"
                          value={formData.alert_threshold || ''}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="expected_status_code">Expected Status Code</Label>
                        <Input
                          id="expected_status_code"
                          name="expected_status_code"
                          type="number"
                          value={formData.expected_status_code || ''}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="content_match">Content Match</Label>
                        <Input
                          id="content_match"
                          name="content_match"
                          value={formData.content_match || ''}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="ssl_tls_check"
                          name="ssl_tls_check"
                          checked={formData.ssl_tls_check || false}
                          onCheckedChange={(checked) => setFormData({ ...formData, ssl_tls_check: checked === true })}
                        />
                        <Label htmlFor="ssl_tls_check">SSL/TLS Check</Label>
                      </div>
                      <div>
                        <Label htmlFor="auth_details">Authentication Details (JSON)</Label>
                        <Textarea
                          id="auth_details"
                          name="auth_details"
                          value={formData.auth_details ? JSON.stringify(formData.auth_details) : ''}
                          onChange={(e) => {
                            try {
                              const parsedJson = JSON.parse(e.target.value);
                              setFormData({ ...formData, auth_details: parsedJson });
                            } catch (error) {
                              // Handle invalid JSON input
                            }
                          }}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="retry_count">Retry Count</Label>
                        <Input
                          id="retry_count"
                          name="retry_count"
                          type="number"
                          value={formData.retry_count || ''}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="custom_headers">Custom Headers (JSON)</Label>
                        <Textarea
                          id="custom_headers"
                          name="custom_headers"
                          value={formData.custom_headers ? JSON.stringify(formData.custom_headers) : ''}
                          onChange={(e) => {
                            try {
                              const parsedJson = JSON.parse(e.target.value);
                              setFormData({ ...formData, custom_headers: parsedJson });
                            } catch (error) {
                              // Handle invalid JSON input
                            }
                          }}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="dns_query_type">DNS Query Type</Label>
                        <Input
                          id="dns_query_type"
                          name="dns_query_type"
                          value={formData.dns_query_type || ''}
                          
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                      <div>
                        <Label htmlFor="ping_count">Ping Count</Label>
                        <Input
                          id="ping_count"
                          name="ping_count"
                          type="number"
                          value={formData.ping_count || ''}
                          onChange={handleInputChange}
                          className="bg-zinc-800 border-zinc-700 text-white"
                        />
                      </div>
                    </div>
                  </ScrollArea>
                </form>
              </div>
              <DialogFooter className="flex-shrink-0 mt-4">
                <Button type="submit" className="bg-teal-600 hover:bg-teal-700 text-white" onClick={handleSubmit}>
                  {isEditModalOpen ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}

        {isDeleteModalOpen && (
          <Dialog open={isDeleteModalOpen} onOpenChange={closeModals}>
            <DialogContent className="bg-zinc-900 text-white">
              <DialogHeader>
                <DialogTitle>Delete Monitor</DialogTitle>
              </DialogHeader>
              <p>Are you sure you want to delete this monitor?</p>
              <DialogFooter>
                <Button variant="outline" onClick={closeModals} className="bg-zinc-800 text-white hover:bg-zinc-700">Cancel</Button>
                <Button onClick={handleDelete} className="bg-red-600 hover:bg-red-700 text-white">Delete</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </AnimatePresence>
    </div>
  );
}