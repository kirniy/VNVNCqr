// Date formatting utilities for consistent date display across the app
// Using Russian date format: DD.MM.YYYY

export function formatDate(date: Date | any): string {
  try {
    let dateObj: Date;
    
    // Handle Firestore timestamp
    if (date && typeof date === 'object' && date.toDate) {
      dateObj = date.toDate();
    } else if (date && typeof date === 'object' && date._seconds) {
      dateObj = new Date(date._seconds * 1000);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return 'Неизвестно';
    }

    // Format as DD.MM.YYYY
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    
    return `${day}.${month}.${year}`;
  } catch (error) {
    return 'Неизвестно';
  }
}

export function formatDateTime(date: Date | any): string {
  try {
    let dateObj: Date;
    
    // Handle Firestore timestamp
    if (date && typeof date === 'object' && date.toDate) {
      dateObj = date.toDate();
    } else if (date && typeof date === 'object' && date._seconds) {
      dateObj = new Date(date._seconds * 1000);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return 'Неизвестно';
    }

    // Format as DD.MM.YYYY в HH:MM
    const day = dateObj.getDate().toString().padStart(2, '0');
    const month = (dateObj.getMonth() + 1).toString().padStart(2, '0');
    const year = dateObj.getFullYear();
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${day}.${month}.${year} в ${hours}:${minutes}`;
  } catch (error) {
    return 'Неизвестно';
  }
}

export function formatTime(date: Date | any): string {
  try {
    let dateObj: Date;
    
    // Handle Firestore timestamp
    if (date && typeof date === 'object' && date.toDate) {
      dateObj = date.toDate();
    } else if (date && typeof date === 'object' && date._seconds) {
      dateObj = new Date(date._seconds * 1000);
    } else if (date instanceof Date) {
      dateObj = date;
    } else if (typeof date === 'string' || typeof date === 'number') {
      dateObj = new Date(date);
    } else {
      return 'Неизвестно';
    }

    // Format as HH:MM
    const hours = dateObj.getHours().toString().padStart(2, '0');
    const minutes = dateObj.getMinutes().toString().padStart(2, '0');
    
    return `${hours}:${minutes}`;
  } catch (error) {
    return 'Неизвестно';
  }
}