// app/components/notifications/discord-notify.tsx


'use client'

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useToast } from "@/hooks/use-toast"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

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

const DiscordNotify: React.FC = () => {
  const [monitors, setMonitors] = useState<Monitor[]>([]);
  const [selectedMonitor, setSelectedMonitor] = useState<string>('');
  const [webhookUrl, setWebhookUrl] = useState<string>('');
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [monitorStatuses, setMonitorStatuses] = useState<MonitorStatus[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  const [isAutoNotifyEnabled, setIsAutoNotifyEnabled] = useState<boolean>(false);

  useEffect(() => {
    fetchMonitors();
  }, []);

  useEffect(() => {
    if (selectedMonitor) {
      fetchWebhookUrl(selectedMonitor);
      fetchAutoNotifySettings(selectedMonitor);
    }
  }, [selectedMonitor]);

  useEffect(() => {
    if (isWatching && selectedMonitor) {
      // Instead of checking statuses, just fetch the latest status periodically
      const interval = setInterval(() => {
        fetchLatestStatus(selectedMonitor);
      }, 60000); // Check every minute

      return () => clearInterval(interval);
    }
  }, [isWatching, selectedMonitor]);

  const fetchMonitors = async () => {
    try {
      const response = await axios.get('/api/createmonitor');
      setMonitors(response.data.monitors);
    } catch (error) {
      console.error('Error fetching monitors:', error);
      setError('Failed to fetch monitors. Please try again later.');
    }
  };

  const fetchWebhookUrl = async (monitorId: string) => {
    try {
      const response = await fetch(`/api/notifications/discord?monitorId=${monitorId}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (data.success && data.webhookUrl) {
        setWebhookUrl(data.webhookUrl);
      } else {
        setWebhookUrl('');
      }
    } catch (error) {
      console.error('Error fetching webhook URL:', error);
      setWebhookUrl('');
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch webhook URL. Please try again.",
      });
    }
  };

  const fetchAutoNotifySettings = async (monitorId: string) => {
    try {
      const response = await fetch(`/api/notifications/discord?autoNotifications&monitorId=${monitorId}`, {
        method: 'GET',
      });
      const data = await response.json();
      if (data.success) {
        setIsAutoNotifyEnabled(data.isEnabled);
        setIsWatching(data.isWatching);
      }
    } catch (error) {
      console.error('Error fetching auto notification settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch auto notification settings. Please try again.",
      });
    }
  };

  const handleSaveWebhook = async () => {
    if (!selectedMonitor || !webhookUrl) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a monitor and enter a webhook URL",
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/notifications/discord', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monitorId: selectedMonitor,
          webhookUrl,
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast({
          title: "Success",
          description: "Discord webhook URL saved successfully",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to save Discord webhook URL: ${data.message}`,
        });
      }
    } catch (error) {
      console.error('Error saving Discord webhook URL:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while saving the Discord webhook URL",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoNotifyToggle = async (enabled: boolean) => {
    if (!selectedMonitor) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a monitor first",
      });
      return;
    }

    try {
      const response = await fetch('/api/notifications/discord?autoNotifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monitorId: selectedMonitor,
          isEnabled: enabled,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsAutoNotifyEnabled(enabled);
        toast({
          title: "Success",
          description: `Auto notifications ${enabled ? 'enabled' : 'disabled'} successfully`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to update auto notification settings: ${data.message}`,
        });
      }
    } catch (error) {
      console.error('Error updating auto notification settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating auto notification settings",
      });
    }
  };

  const handleWatchingToggle = async (enabled: boolean) => {
    if (!selectedMonitor) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Please select a monitor first",
      });
      return;
    }

    try {
      const response = await fetch('/api/notifications/discord?autoNotifications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          monitorId: selectedMonitor,
          isWatching: enabled,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setIsWatching(enabled);
        if (enabled) {
          fetchLatestStatus(selectedMonitor); // Fetch statuses immediately when watching is enabled
        }
        toast({
          title: "Success",
          description: `Monitor watching ${enabled ? 'enabled' : 'disabled'} successfully`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to update monitor watching settings: ${data.message}`,
        });
      }
    } catch (error) {
      console.error('Error updating monitor watching settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "An error occurred while updating monitor watching settings",
      });
    }
  };

  const fetchLatestStatus = async (monitorId: string) => {
    try {
      const response = await axios.get(`/api/monitor-status?monitorId=${monitorId}`);
      const latestStatus = response.data.status;
      setMonitorStatuses(prevStatuses => 
        prevStatuses.map(s => s.id === monitorId ? { ...s, ...latestStatus } : s)
      );
    } catch (error) {
      console.error('Error fetching latest status:', error);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Discord Notification Settings</h2>
      <Select onValueChange={(value) => setSelectedMonitor(value)} value={selectedMonitor}>
        <SelectTrigger className="w-full">
          <SelectValue placeholder="Select a monitor" />
        </SelectTrigger>
        <SelectContent>
          {monitors.map((monitor) => (
            <SelectItem key={monitor.id} value={monitor.id}>
              {monitor.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Input
        placeholder="Enter Discord webhook URL"
        value={webhookUrl}
        onChange={(e) => setWebhookUrl(e.target.value)}
      />
      <Button
        onClick={handleSaveWebhook}
        disabled={!selectedMonitor || !webhookUrl || isLoading}
      >
        {isLoading ? "Saving..." : "Save Webhook URL"}
      </Button>

      <div className="flex items-center space-x-2">
        <Switch
          id="watch-mode"
          checked={isWatching}
          onCheckedChange={handleWatchingToggle}
        />
        <Label htmlFor="watch-mode">Enable monitor watching</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="auto-notify"
          checked={isAutoNotifyEnabled}
          onCheckedChange={handleAutoNotifyToggle}
        />
        <Label htmlFor="auto-notify">Enable auto notifications</Label>
      </div>

      {isWatching && (
        <div>
          <h3 className="text-lg font-semibold">Monitor Statuses:</h3>
          {monitorStatuses.length > 0 ? (
            monitorStatuses.map((status) => (
              <div key={status.id}>
                {monitors.find(m => m.id === status.id)?.name}: {status.status}
                {status.responseTime !== undefined && ` (${status.responseTime}ms)`}
              </div>
            ))
          ) : (
            <div>No monitor statuses available. Checking...</div>
          )}
        </div>
      )}
    </div>
  );
};

export default DiscordNotify;