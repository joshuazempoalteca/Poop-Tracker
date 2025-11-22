import { PoopLog } from '../types';
import { BRISTOL_SCALE_DATA } from '../constants';

export const exportLogsToCSV = (logs: PoopLog[]) => {
  if (!logs.length) return;

  const headers = ['Date', 'Time', 'Bristol Type', 'Description', 'Health Status', 'Duration (min)', 'Notes', 'AI Commentary'];
  
  const rows = logs.map(log => {
    const date = new Date(log.timestamp);
    const typeInfo = BRISTOL_SCALE_DATA.find(d => d.type === log.type);
    
    return [
      date.toLocaleDateString(),
      date.toLocaleTimeString(),
      log.type,
      typeInfo?.description || '',
      typeInfo?.health || '',
      log.durationMinutes || '',
      `"${(log.notes || '').replace(/"/g, '""')}"`, // Escape quotes in CSV
      `"${(log.aiCommentary || '').replace(/"/g, '""')}"`
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `doodoo_logs_export_${new Date().toISOString().slice(0,10)}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};