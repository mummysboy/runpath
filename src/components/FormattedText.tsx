interface FormattedTextProps {
  text: string;
  formatting?: {
    bold?: boolean;
    italic?: boolean;
    underline?: boolean;
    highlight?: boolean;
    allCaps?: boolean;
  };
  showAsHtml?: boolean; // If true, render HTML content (for admins/UX)
  showAsPlain?: boolean; // If true, strip HTML and show plain text (for developers)
}

// Utility function to remove emojis, exclamation marks, and convert all-caps to normal case
function sanitizeForDevelopers(text: string): string {
  // First strip HTML tags and decode HTML entities
  let sanitized = text
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&nbsp;/g, ' ') // Replace non-breaking spaces
    .replace(/&amp;/g, '&') // Decode HTML entities
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
  
  // Remove emojis using comprehensive Unicode ranges
  // This covers all major emoji ranges:
  // - Emoticons (😀-🙏)
  // - Miscellaneous Symbols and Pictographs (🌀-🗿)
  // - Supplemental Symbols and Pictographs (🀀-🃏)
  // - Symbols and Pictographs Extended-A (🈀-🈯)
  // - Transport and Map Symbols (🚀-🛿)
  // - Enclosed characters (Ⓜ-⛿)
  // - And many more emoji ranges
  sanitized = sanitized.replace(
    /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]|[\u{1F900}-\u{1F9FF}]|[\u{1FA00}-\u{1FA6F}]|[\u{1FA70}-\u{1FAFF}]|[\u{2190}-\u{21FF}]|[\u{2300}-\u{23FF}]|[\u{2B50}-\u{2B55}]|[\u{3030}-\u{303F}]|[\u{FE00}-\u{FE0F}]|[\u{1F018}-\u{1F270}]|[\u{24C2}-\u{1F251}]|[\u{1F004}-\u{1F0CF}]|[\u{1F170}-\u{1F251}]|[\u{200D}]|[\u{20E3}]|[\u{FE0F}]/gu,
    ''
  );
  
  // Also remove common emoji sequences (combining characters)
  sanitized = sanitized.replace(/[\u{200D}\u{FE0F}\u{20E3}]/gu, '');
  
  // Remove exclamation marks
  sanitized = sanitized.replace(/!/g, '');
  
  // Convert all-caps text to normal case (sentence case)
  // Check if text is all caps (has at least one letter and all letters are uppercase)
  const hasLetters = /[a-zA-Z]/.test(sanitized);
  if (hasLetters) {
    // Extract only letters (ignoring spaces, punctuation, numbers)
    const lettersOnly = sanitized.replace(/[^a-zA-Z]/g, '');
    // Check if all letters are uppercase and there are at least 2 letters
    // (to avoid converting single letters like "I" or "A")
    if (lettersOnly.length >= 2 && lettersOnly === lettersOnly.toUpperCase()) {
      // Convert to sentence case: only first letter of sentences uppercase, rest lowercase
      // Split by sentence boundaries (. ! ? followed by space or end of string)
      // Process sentence by sentence
      const sentenceEnders = /([.!?])\s+/g;
      const parts = sanitized.split(sentenceEnders);
      
      sanitized = parts
        .map((part, index) => {
          // Keep sentence-ending punctuation and spaces as-is
          if (/^[.!?]\s*$/.test(part)) {
            return part;
          }
          
          // Find first letter in this part
          const firstLetterMatch = part.match(/[a-zA-Z]/);
          if (!firstLetterMatch || firstLetterMatch.index === undefined) {
            return part;
          }
          
          const firstLetterIndex = firstLetterMatch.index;
          
          // Capitalize first letter only, lowercase everything else
          return (
            part.substring(0, firstLetterIndex) +
            part[firstLetterIndex].toUpperCase() +
            part.substring(firstLetterIndex + 1).toLowerCase()
          );
        })
        .join('');
    }
  }
  
  // Clean up multiple spaces and trim
  sanitized = sanitized.replace(/\s+/g, ' ').trim();
  
  return sanitized;
}

export default function FormattedText({ 
  text, 
  formatting, 
  showAsHtml = false,
  showAsPlain = false 
}: FormattedTextProps) {
  if (!text) {
    return null;
  }

  // For developers: strip HTML, emojis, and exclamation marks
  if (showAsPlain) {
    const sanitizedText = sanitizeForDevelopers(text);
    return <>{sanitizedText}</>;
  }

  // For admins/UX: render HTML if it contains HTML tags
  if (showAsHtml && /<[^>]+>/.test(text)) {
    // Process HTML to ensure highlight styling is visible
    // The backColor command creates inline styles, but we need to ensure they're visible
    let processedHtml = text;
    
    // Ensure highlight background colors are visible (convert hex to rgba for better visibility)
    processedHtml = processedHtml.replace(
      /style="([^"]*background-color[^"]*)"([^>]*)>/gi,
      (match, style, rest) => {
        // Check if it has a yellow/light background color
        if (style.includes('#fef08a') || style.includes('rgb(254, 240, 138)') || style.includes('yellow')) {
          // Ensure it has proper styling
          if (!style.includes('padding')) {
            style += '; padding: 0 2px; border-radius: 2px';
          }
        }
        return `style="${style}"${rest}>`;
      }
    );
    
    return (
      <div 
        className="rich-text-content"
        dangerouslySetInnerHTML={{ __html: processedHtml }}
        style={{
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      />
    );
  }

  // Legacy formatting support (for backwards compatibility)
  if (formatting && Object.keys(formatting).length > 0) {
    let displayText = text;
    if (formatting.allCaps) {
      displayText = text.toUpperCase();
    }

    const className = [
      formatting.bold && 'font-bold',
      formatting.italic && 'italic',
      formatting.underline && 'underline',
      formatting.highlight && 'bg-yellow-400/20 px-1 rounded',
    ]
      .filter(Boolean)
      .join(' ');

    // Handle multi-line text by splitting and wrapping each line
    const lines = displayText.split('\n');
    if (lines.length > 1) {
      return (
        <>
          {lines.map((line, index) => (
            <span key={index} className={className || undefined}>
              {line}
              {index < lines.length - 1 && <br />}
            </span>
          ))}
        </>
      );
    }

    return <span className={className || undefined}>{displayText}</span>;
  }

  // Default: just show the text
  return <>{text}</>;
}
