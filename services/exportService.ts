import { Message, VisualizationConfig } from '../types';

const downloadFile = (content: string, filename: string, contentType: string) => {
  const blob = new Blob([content], { type: contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportChatToJSON = (messages: Message[]) => {
  const exportData = {
    timestamp: new Date().toISOString(),
    messages: messages.map(m => ({
        ...m,
        // Clean up internal UI states for export if desired, 
        // but keeping them allows full state restoration logic if needed later.
    }))
  };
  const data = JSON.stringify(exportData, null, 2);
  downloadFile(data, `frappe-insight-chat-${new Date().toISOString().slice(0,10)}.json`, 'application/json');
};

export const exportChatToCSV = (messages: Message[]) => {
  const headers = ['Timestamp', 'Sender', 'Message', 'Chart Type', 'Chart Title'];
  const rows = messages.map(m => {
    const timestamp = new Date(m.timestamp).toLocaleString();
    const sender = m.sender;
    // Escape double quotes
    const text = `"${m.text.replace(/"/g, '""')}"`;
    const chartType = m.visualization ? m.visualization.type : '';
    const chartTitle = m.visualization ? `"${m.visualization.title.replace(/"/g, '""')}"` : '';
    
    return [timestamp, sender, text, chartType, chartTitle].join(',');
  });
  
  const csvContent = [headers.join(','), ...rows].join('\n');
  downloadFile(csvContent, `frappe-insight-chat-${new Date().toISOString().slice(0,10)}.csv`, 'text/csv');
};

export const exportVisualizationToCSV = (config: VisualizationConfig) => {
    if (!config.data || config.data.length === 0) return;

    // Get all unique keys to ensure columns align even if some objects miss keys
    const allKeys = new Set<string>();
    config.data.forEach(row => Object.keys(row).forEach(k => allKeys.add(k)));
    // Ensure xAxisKey is first for readability
    const sortedKeys = Array.from(allKeys).sort((a, b) => {
        if (a === config.xAxisKey) return -1;
        if (b === config.xAxisKey) return 1;
        return 0;
    });

    const headers = sortedKeys.join(',');

    const rows = config.data.map((row: any) => {
        return sortedKeys.map(key => {
            const val = row[key] ?? ''; 
            return typeof val === 'string' ? `"${val.replace(/"/g, '""')}"` : val;
        }).join(',');
    });
    
    const csvContent = [headers, ...rows].join('\n');
    downloadFile(csvContent, `chart-data-${config.type}-${Date.now()}.csv`, 'text/csv');
};

export const exportVisualizationToJSON = (config: VisualizationConfig) => {
    const data = JSON.stringify(config.data, null, 2);
    downloadFile(data, `chart-data-${config.type}-${Date.now()}.json`, 'application/json');
};
