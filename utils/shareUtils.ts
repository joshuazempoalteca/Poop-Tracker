import { PoopLog } from '../types';
import { BRISTOL_SCALE_DATA } from '../constants';

export const shareLog = async (log: PoopLog): Promise<string> => {
  const typeInfo = BRISTOL_SCALE_DATA.find(d => d.type === log.type);
  const date = new Date(log.timestamp).toLocaleDateString();
  const time = new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
  
  const lines = [
    `💩 DooDoo Log Update`,
    `${date} at ${time}`,
    `Type ${log.type}: ${typeInfo?.health || 'Unknown'}`,
  ];

  if (log.durationMinutes) {
    lines.push(`⏱️ Duration: ${log.durationMinutes} min`);
  }
  
  if (log.wipes !== undefined) {
      lines.push(`🧻 Wipes: ${log.wipes}`);
  }

  if (log.painLevel !== undefined && log.painLevel > 0) {
      lines.push(`😖 Pain: ${log.painLevel}/10`);
  }

  const flags = [];
  if (log.hasBlood) flags.push('Blood 🩸');
  if (log.isClog) flags.push('Clog 🪠');
  
  if (flags.length > 0) {
      lines.push(`⚠️ Flags: ${flags.join(', ')}`);
  }

  // NOTE: AI Summary removed per request for sharing privacy/simplicity.

  const text = lines.join('\n');

  if (navigator.share) {
    try {
      await navigator.share({
        title: 'DooDoo Log',
        text: text,
      });
      return 'Shared successfully!';
    } catch (error) {
      console.error('Error sharing:', error);
      return 'Share cancelled';
    }
  } else {
    try {
      await navigator.clipboard.writeText(text);
      return 'Copied to clipboard!';
    } catch (err) {
      return 'Failed to copy.';
    }
  }
};