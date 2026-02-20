// Utility function to format dates without timezone issues
export const formatDateForDisplay = (dateString: string): string => {
  if (!dateString) return '';
  
  // Parse the date as a local date (YYYY-MM-DD format)
  const [year, month, day] = dateString.split('T')[0].split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'numeric',
    day: 'numeric'
  });
};

// Clean Quill editor HTML for proper rendering.
// Strips inline <span> wrappers and style attributes that cause
// browsers to break words incorrectly at line edges, while keeping
// meaningful formatting tags (<strong>, <em>, <u>, <a>, <s>).
export const cleanHtml = (html: string): string => {
  return html
    // Remove invisible characters
    .replace(/[\u00AD\u200B\u200C\u200D\uFEFF]/g, '')
    // Remove <span> tags but keep their inner content
    .replace(/<span[^>]*>/gi, '')
    .replace(/<\/span>/gi, '')
    // Remove inline style attributes from remaining elements
    .replace(/ style="[^"]*"/gi, '')
    // Remove Quill-specific class attributes
    .replace(/ class="ql-[^"]*"/gi, '')
    // Clean up empty paragraphs (Quill generates <p><br></p> for blank lines)
    .replace(/<p>\s*<br\s*\/?>\s*<\/p>/gi, '<br/>')
    // Collapse multiple <br> tags
    .replace(/(<br\s*\/?>){3,}/gi, '<br/><br/>');
};

// Utility function to ensure date is stored in YYYY-MM-DD format
export const normalizeDateString = (dateString: string): string => {
  if (!dateString) return '';
  
  // If it's already in YYYY-MM-DD format, return as is
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
    return dateString;
  }
  
  // Otherwise, parse and format
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

