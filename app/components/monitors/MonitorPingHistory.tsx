import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Badge } from "@/components/ui/badge";

interface PingHistoryItem {
  timestamp: string;
  response_time: number;
  status: boolean;
}

interface PingHistoryProps {
  monitorId: string;
}

const PingHistory: React.FC<PingHistoryProps> = ({ monitorId }) => {
  const [history, setHistory] = useState<PingHistoryItem[]>([]);

  useEffect(() => {
    const fetchPingHistory = async () => {
      try {
        const response = await axios.get(`/api/getpinghistory?monitorId=${monitorId}&limit=10`);
        setHistory(response.data.history);
      } catch (error) {
        console.error('Error fetching ping history:', error);
      }
    };

    fetchPingHistory();
  }, [monitorId]);

  return (
    <div className="mt-4">
      <h4 className="text-sm font-semibold mb-2">Ping History</h4>
      <div className="space-y-2">
        {history.map((item, index) => (
          <div key={index} className="flex justify-between items-center text-sm">
            <span>{new Date(item.timestamp).toLocaleString()}</span>
            <span>{item.response_time}ms</span>
            <Badge variant={item.status ? 'default' : 'destructive'}>
              {item.status ? 'UP' : 'DOWN'}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PingHistory;
