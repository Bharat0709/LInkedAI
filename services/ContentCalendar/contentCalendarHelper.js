// Helper function to parse DD-MM-YYYY format
export const parseDate = dateString => {
  const parts = dateString.split('-');
  if (parts.length !== 3) {
    return null;
  }

  const day = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10) - 1; // Month is 0-indexed in JavaScript
  const year = parseInt(parts[2], 10);

  // Validate ranges
  if (day < 1 || day > 31 || month < 0 || month > 11 || year < 1900) {
    return null;
  }

  return new Date(year, month, day);
};

// Helper function to convert 12-hour time to 24-hour format
export const convertTo24Hour = timeString => {
  const regex = /^(\d{1,2}):(\d{2})\s*(AM|PM)$/i;
  const match = timeString.trim().match(regex);

  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = match[2];
    const period = match[3].toUpperCase();

    if (period === 'PM' && hours !== 12) {
      hours += 12;
    } else if (period === 'AM' && hours === 12) {
      hours = 0;
    }

    return `${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  // If it's already in 24-hour format, validate and return
  const time24Regex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  if (time24Regex.test(timeString.trim())) {
    return timeString.trim();
  }

  return null;
};
