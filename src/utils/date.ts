/**
 * Formats a date string to the format "HH:mm DD/MM/YYYY" (if time exists)
 * or "DD/MM/YYYY" (if only date exists).
 *
 * @param dateStr String representation of a date/time (e.g. YYYY-MM-DD or YYYY-MM-DDTHH:mm)
 * @returns Formatted date string
 */
export const formatDate = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    // Check for ISO-like format YYYY-MM-DD (e.g. 2026-06-08)
    const dateParts = dateStr.split('T')[0].split(' ')[0].split('-');
    if (dateParts.length === 3 && dateParts[0].length === 4) {
      const year = dateParts[0];
      const month = dateParts[1].padStart(2, '0');
      const day = dateParts[2].padStart(2, '0');

      const hasTime = dateStr.includes(':');
      if (hasTime) {
        // Parse time component (either after 'T' or after space ' ')
        const timePart = dateStr.includes('T') ? dateStr.split('T')[1] : dateStr.split(' ')[1];
        if (timePart) {
          const timeParts = timePart.split(':');
          if (timeParts.length >= 2) {
            const hours = timeParts[0].trim().padStart(2, '0');
            const minutes = timeParts[1].substring(0, 2).padStart(2, '0');
            return `${hours}:${minutes} ${day}/${month}/${year}`;
          }
        }
      }
      return `${day}/${month}/${year}`;
    }

    // Fallback to Date object parsing for other formats
    const hasTime = dateStr.includes(':');
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return dateStr;

    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();

    if (hasTime) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes} ${day}/${month}/${year}`;
    } else {
      return `${day}/${month}/${year}`;
    }
  } catch {
    return dateStr;
  }
};
