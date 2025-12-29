// Content cleanup module
// Removes elements with specific classes from post content

export function initContentCleanup() {
  // Only initialize on post/page templates
  const isPostPage = document.body.classList.contains('post-template') || 
                    document.body.classList.contains('page-template') ||
                    document.querySelector('.gh-content');
  
  if (!isPostPage) return;

  const contentElement = document.querySelector('.gh-content');
  if (!contentElement) return;

  // Remove elements with snippet-title class
  const snippetTitles = contentElement.querySelectorAll('.snippet-title');
  snippetTitles.forEach(element => {
    element.remove();
  });
}

