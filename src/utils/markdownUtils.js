/**
 * Markdown Utilities for Message Rendering
 * Handles basic markdown formatting for chat messages
 */

// Simple markdown parser for chat messages
export const parseMarkdown = (text) => {
  if (!text) return text;
  
  // Convert **bold** to <strong>
  let parsed = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  parsed = parsed.replace(/\*(.*?)\*/g, '<em>$1</em>');
  
  // Convert [link text](url) to <a>
  parsed = parsed.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 underline">$1</a>');
  
  // Convert line breaks to <br>
  parsed = parsed.replace(/\n/g, '<br>');
  
  return parsed;
};

// React component for rendering markdown content
export const MarkdownText = ({ children, className = "" }) => {
  const htmlContent = parseMarkdown(children);
  
  return (
    <div 
      className={`markdown-content ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

// Alternative: Convert markdown to React elements (safer but more complex)
export const parseMarkdownToElements = (text) => {
  if (!text) return [];
  
  const elements = [];
  const parts = text.split(/(\*\*.*?\*\*|\*.*?\*)/g);
  
  parts.forEach((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      // Bold text
      const content = part.slice(2, -2);
      elements.push(<strong key={index}>{content}</strong>);
    } else if (part.startsWith('*') && part.endsWith('*')) {
      // Italic text
      const content = part.slice(1, -1);
      elements.push(<em key={index}>{content}</em>);
    } else {
      // Regular text
      if (part) {
        elements.push(part);
      }
    }
  });
  
  return elements;
};

// CSS styles for markdown content
export const markdownStyles = `
.markdown-content strong {
  font-weight: 600;
  color: inherit;
}

.markdown-content em {
  font-style: italic;
  color: inherit;
}

.markdown-content a {
  color: #2563eb;
  text-decoration: underline;
}

.markdown-content a:hover {
  color: #1d4ed8;
}

.skillbot-message .markdown-content strong {
  color: #1d4ed8;
  font-weight: 600;
}

.skillbot-message .markdown-content a {
  color: #3b82f6;
}
`; 