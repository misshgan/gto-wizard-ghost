// Announcement bar processor module
// Processes color snippets in announcement bar: [[Green]] and {{color}}text{{/color}}

export function initAnnouncementProcessor() {
  // Try to find announcement bar immediately
  let announcementBar = findAnnouncementBar();
  
  if (announcementBar) {
    processAnnouncementBar(announcementBar);
  } else {
    // If not found, use MutationObserver to watch for it being added
    const observer = new MutationObserver((mutations) => {
      const bar = findAnnouncementBar();
      if (bar) {
        processAnnouncementBar(bar);
        observer.disconnect();
      }
    });

    // Observe body for changes
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });

    // Also check after a delay in case it's added asynchronously
    setTimeout(() => {
      const bar = findAnnouncementBar();
      if (bar) {
        processAnnouncementBar(bar);
        observer.disconnect();
      }
    }, 500);
  }
}

function findAnnouncementBar() {
  // Try common Ghost announcement bar selectors
  let announcementBar = document.querySelector('.gh-announcement, .gh-announcement-bar, [data-announcement], .announcement-bar, .gh-site-announcement');
  
  // Exclude if found inside .gh-content (post content)
  if (announcementBar && announcementBar.closest('.gh-content')) {
    announcementBar = null;
  }
  
  if (!announcementBar) {
    // Check body direct children (Ghost sometimes adds it there)
    // But exclude .gh-content and its children
    const contentElement = document.querySelector('.gh-content');
    const bodyChildren = Array.from(document.body.children);
    for (const child of bodyChildren) {
      // Skip if it's the content element or contains it
      if (child === contentElement || child.contains(contentElement)) {
        continue;
      }
      const text = child.textContent || '';
      if (text.includes('[[') || text.includes('{{color')) {
        return child;
      }
    }
  }

  if (!announcementBar) {
    // Check if there's a div right after body or in main
    // But exclude .gh-content and its children
    const contentElement = document.querySelector('.gh-content');
    const possibleBars = document.querySelectorAll('body > div, main > div, .container-global > div');
    for (const bar of possibleBars) {
      // Skip if it's the content element or contains it, or is inside .gh-content
      if (bar === contentElement || bar.contains(contentElement) || bar.closest('.gh-content')) {
        continue;
      }
      const text = bar.textContent || '';
      if (text.includes('[[') || text.includes('{{color')) {
        return bar;
      }
    }
  }

  return announcementBar;
}

function processAnnouncementBar(bar) {
  if (!bar) return;
  
  // Safety check: never process .gh-content or elements inside it
  const contentElement = document.querySelector('.gh-content');
  if (bar === contentElement || bar.contains(contentElement) || bar.closest('.gh-content')) {
    console.warn('[Announcement Processor] Attempted to process .gh-content as announcement bar. Skipping.');
    return;
  }

  // Get original HTML content
  let html = bar.innerHTML || '';
  const originalText = bar.textContent || '';

  if (!originalText && !html) return;

  // Color mapping
  const colorMap = {
    'green': {
      hex: '#AAFBB2',
      rgb: '170, 251, 178',
      background: 'linear-gradient(0deg, rgba(170, 251, 178, 0.10) 0%, rgba(170, 251, 178, 0.10) 100%), #1E1E21'
    },
    'yellow': {
      hex: '#F8D72B',
      rgb: '248, 215, 43',
      background: 'linear-gradient(0deg, rgba(248, 215, 43, 0.10) 0%, rgba(248, 215, 43, 0.10) 100%), #1E1E21'
    }
    // Can add more colors here in the future: red, blue, etc.
  };

  // Find color tag like [[Green]] in HTML
  const colorTagRegex = /\[\[([^\]]+)\]\]/;
  const colorMatch = html.match(colorTagRegex) || originalText.match(colorTagRegex);
  
  let selectedColor = null;

  if (colorMatch) {
    const colorName = colorMatch[1].trim().toLowerCase();
    if (colorMap[colorName]) {
      selectedColor = colorMap[colorName];
      
      // Remove the color tag from HTML
      html = html.replace(colorTagRegex, '');
      
      // Apply background color
      bar.style.background = selectedColor.background;
    }
  }

  // Set default text color to white
  bar.style.color = '#FFFFFF';

  // Process {{color}}text{{/color}} snippets
  // This should use the selected color from [[Green]] or [[Yellow]] tag
  if (selectedColor) {
    // Match {{color}}text{{/color}} or {{color}}text{{color}}
    const colorSnippetRegex = /\{\{color\}\}([\s\S]*?)\{\{\/?color\}\}/g;
    const matches = [...html.matchAll(colorSnippetRegex)];
    
    if (matches.length > 0) {
      matches.forEach(match => {
        const coloredText = match[1];
        const fullMatch = match[0];
        
        // Replace with styled span with text styles
        const styledText = `<span style="color: ${selectedColor.hex}; font-size: 12px; font-style: normal; font-weight: 500; line-height: 18px; letter-spacing: 0.17px;">${coloredText}</span>`;
        html = html.replace(fullMatch, styledText);
      });
      
      bar.innerHTML = html;
    } else {
      // No color snippets, just ensure color tag is removed
      if (html !== bar.innerHTML) {
        bar.innerHTML = html;
      }
    }
  } else {
    // No color tag found, ensure HTML is set correctly
    if (html && html !== bar.innerHTML) {
      bar.innerHTML = html;
    }
  }

  // Apply text styles to all spans inside announcement bar
  const spans = bar.querySelectorAll('span');
  spans.forEach(span => {
    // Only apply styles if they're not already set (to preserve colored spans)
    if (!span.style.color || span.style.color === 'rgb(255, 255, 255)' || span.style.color === '#ffffff' || span.style.color === '#FFFFFF') {
      span.style.fontSize = '12px';
      span.style.fontStyle = 'normal';
      span.style.fontWeight = '500';
      span.style.lineHeight = '18px';
      span.style.letterSpacing = '0.17px';
    } else {
      // For colored spans, ensure other text styles are applied
      if (!span.style.fontSize) span.style.fontSize = '12px';
      if (!span.style.fontStyle) span.style.fontStyle = 'normal';
      if (!span.style.fontWeight) span.style.fontWeight = '500';
      if (!span.style.lineHeight) span.style.lineHeight = '18px';
      if (!span.style.letterSpacing) span.style.letterSpacing = '0.17px';
    }
  });

  // Also apply styles to direct text content and paragraphs
  // Only apply to paragraphs that are direct children or descendants of the announcement bar
  // and NOT inside .gh-content
  const paragraphs = bar.querySelectorAll('p');
  paragraphs.forEach(p => {
    // Safety check: never style paragraphs inside .gh-content
    if (p.closest('.gh-content')) {
      return;
    }
    // Only style if paragraph is actually inside the announcement bar
    if (bar.contains(p)) {
      p.style.fontSize = '12px';
      p.style.fontStyle = 'normal';
      p.style.fontWeight = '500';
      p.style.lineHeight = '18px';
      p.style.letterSpacing = '0.17px';
      p.style.color = '#FFFFFF';
      p.style.margin = '0';
    }
  });
}

