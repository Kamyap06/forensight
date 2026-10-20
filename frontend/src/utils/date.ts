/**
 * ForenSight Date & Time Formatting Utilities
 * Standardizes timestamp parsing and display across all investigation modules.
 * Gracefully handles null, undefined, empty, ISO 8601, and MySQL strings.
 * Always displays "Not recorded" for missing or invalid dates.
 */

export function formatDateTime(val?: string | number | Date | null): string {
  if (!val) return 'Not recorded';
  let cleanVal = val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '0000-00-00 00:00:00' || trimmed === '0000-00-00') {
      return 'Not recorded';
    }
    // Convert MySQL "YYYY-MM-DD HH:mm:ss" to ISO-compatible format if needed
    if (trimmed.includes(' ') && !trimmed.includes('T') && !trimmed.includes('Z')) {
      cleanVal = trimmed.replace(' ', 'T');
    }
  }
  const d = new Date(cleanVal);
  if (isNaN(d.getTime())) return 'Not recorded';

  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const seconds = String(d.getSeconds()).padStart(2, '0');

  return `${month} ${day}, ${year} ${hours}:${minutes}:${seconds}`;
}

export function formatDate(val?: string | number | Date | null): string {
  if (!val) return 'Not recorded';
  let cleanVal = val;
  if (typeof val === 'string') {
    const trimmed = val.trim();
    if (!trimmed || trimmed === '0000-00-00 00:00:00' || trimmed === '0000-00-00') {
      return 'Not recorded';
    }
    if (trimmed.includes(' ') && !trimmed.includes('T') && !trimmed.includes('Z')) {
      cleanVal = trimmed.replace(' ', 'T');
    }
  }
  const d = new Date(cleanVal);
  if (isNaN(d.getTime())) return 'Not recorded';

  const month = d.toLocaleString('en-US', { month: 'short' });
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${month} ${day}, ${year}`;
}
