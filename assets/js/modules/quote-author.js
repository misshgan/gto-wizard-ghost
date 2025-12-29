// Quote author module
// Converts {{quote-author: Author Name}} to styled quote attribution
// Should be placed immediately after a blockquote

export function initQuoteAuthor() {
  // Only initialize on post/page templates
  const isPostPage = document.body.classList.contains('post-template') || 
                    document.body.classList.contains('page-template') ||
                    document.querySelector('.gh-content');
  
  if (!isPostPage) return;

  const contentElement = document.querySelector('.gh-content');
  if (!contentElement) return;

  // Find all paragraphs that contain quote-author syntax
  const paragraphs = contentElement.querySelectorAll('p');
  const quoteAuthorRegex = /\{\{quote-author:\s*([^}]+)\}\}/;
  
  paragraphs.forEach((paragraph, index) => {
    const text = paragraph.textContent.trim();
    const match = text.match(quoteAuthorRegex);
    
    if (match) {
      const authorName = match[1].trim();
      
      // Find the previous blockquote element
      let previousElement = paragraph.previousElementSibling;
      let blockquote = null;
      
      // Look for blockquote in previous siblings
      while (previousElement) {
        if (previousElement.tagName === 'BLOCKQUOTE') {
          blockquote = previousElement;
          break;
        }
        previousElement = previousElement.previousElementSibling;
      }
      
      // If no blockquote found, check parent's previous sibling
      if (!blockquote && paragraph.parentElement) {
        let parentSibling = paragraph.parentElement.previousElementSibling;
        while (parentSibling) {
          const blockquoteInSibling = parentSibling.querySelector('blockquote') || 
                                      (parentSibling.tagName === 'BLOCKQUOTE' ? parentSibling : null);
          if (blockquoteInSibling) {
            blockquote = blockquoteInSibling;
            break;
          }
          parentSibling = parentSibling.previousElementSibling;
        }
      }
      
      // Create author element
      const authorElement = document.createElement('div');
      authorElement.className = 'quote-author';
      
      const authorText = document.createElement('span');
      authorText.className = 'quote-author__text';
      authorText.textContent = authorName;
      authorElement.appendChild(authorText);
      
      // Remove the marker from paragraph or replace paragraph
      const paragraphHTML = paragraph.innerHTML || '';
      const htmlMatch = paragraphHTML.match(/\{\{quote-author:\s*[^}]+\}\}/);
      
      if (htmlMatch) {
        const updatedHTML = paragraphHTML.replace(htmlMatch[0], '').trim();
        if (updatedHTML) {
          paragraph.innerHTML = updatedHTML;
          // Insert author element after paragraph
          paragraph.parentNode.insertBefore(authorElement, paragraph.nextSibling);
        } else {
          // If paragraph only contained the marker, replace it
          paragraph.replaceWith(authorElement);
        }
      } else {
        // Fallback: replace text
        paragraph.textContent = paragraph.textContent.replace(match[0], '').trim();
        if (paragraph.textContent.trim()) {
          paragraph.parentNode.insertBefore(authorElement, paragraph.nextSibling);
        } else {
          paragraph.replaceWith(authorElement);
        }
      }
      
      // If blockquote found, add class to link them visually
      if (blockquote) {
        blockquote.classList.add('has-author');
        authorElement.classList.add('quote-author--attached');
        
        // Check if blockquote has kg-blockquote-alt class for center alignment
        if (blockquote.classList.contains('kg-blockquote-alt')) {
          authorElement.classList.add('quote-author--centered');
        }
      } else {
        console.warn(`[Quote Author] Author "${authorName}" found but no blockquote detected before it. Place {{quote-author: ...}} immediately after a blockquote.`);
      }
    }
  });
}

