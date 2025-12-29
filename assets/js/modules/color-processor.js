// Color processor module
// Converts {{color: red}}text{{/color}} notation to styled spans
// Supports CSS color values: red, #ff0000, rgb(255,0,0), rgba(255,0,0,0.5), etc.

export function initColorProcessor() {
  // Only initialize on post/page templates
  const isPostPage = document.body.classList.contains('post-template') || 
                    document.body.classList.contains('page-template') ||
                    document.querySelector('.gh-content');
  
  if (!isPostPage) return;

  const contentElement = document.querySelector('.gh-content');
  if (!contentElement) return;

  // Regex to match {{color: value}}text{{/color}} or {{color: value}}text{{color}}
  // Supports: {{color: red}}, {{color: #ff0000}}, {{color: rgb(255,0,0)}}, etc.
  // Supports both {{/color}} (preferred) and {{color}} (legacy) closing syntax
  const colorRegex = /\{\{color:\s*([^}]+)\}\}([\s\S]*?)\{\{\/?color\}\}/g;
  
  // Process all text nodes in content, but exclude announcement bars
  const selectors = 'p, li, figcaption, .kg-callout-text, h1, h2, h3, h4, h5, h6, blockquote, td, th';
  const elements = contentElement.querySelectorAll(selectors);
  
  elements.forEach(element => {
    // Skip if element is inside an announcement bar
    if (element.closest('.announcement-bar, [class*="announcement"]')) {
      return;
    }
    
    // Process text nodes only
    const walker = document.createTreeWalker(
      element,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );
    
    const textNodes = [];
    let node;
    while (node = walker.nextNode()) {
      // Skip text nodes inside spans that already have color styles (to avoid double processing)
      const parent = node.parentNode;
      if (parent && parent.tagName === 'SPAN' && parent.style.color) {
        continue;
      }
      textNodes.push(node);
    }
    
    textNodes.forEach(textNode => {
      const text = textNode.textContent;
      const matches = [...text.matchAll(colorRegex)];
      
      if (matches.length === 0) return;
      
      // Build new DOM structure
      const fragment = document.createDocumentFragment();
      let lastIndex = 0;
      
      matches.forEach(match => {
        // Add text before match
        if (match.index > lastIndex) {
          fragment.appendChild(
            document.createTextNode(text.slice(lastIndex, match.index))
          );
        }
        
        // Extract color value and text content
        const colorValue = match[1].trim();
        const coloredText = match[2];
        
        // Create span with inline style - ONLY color, no other styles
        const span = document.createElement('span');
        span.style.color = colorValue;
        // Explicitly set other styles to inherit to prevent unwanted styles
        span.style.fontSize = 'inherit';
        span.style.fontStyle = 'inherit';
        span.style.fontWeight = 'inherit';
        span.style.lineHeight = 'inherit';
        span.style.letterSpacing = 'inherit';
        span.style.margin = 'inherit';
        span.textContent = coloredText;
        
        fragment.appendChild(span);
        
        lastIndex = match.index + match[0].length;
      });
      
      // Add remaining text
      if (lastIndex < text.length) {
        fragment.appendChild(
          document.createTextNode(text.slice(lastIndex))
        );
      }
      
      // Replace text node with fragment
      // Only replace if parent node exists and is not the content element itself
      if (textNode.parentNode && textNode.parentNode !== contentElement) {
        textNode.parentNode.replaceChild(fragment, textNode);
      }
    });
  });
}
