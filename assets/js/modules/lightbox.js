import baguetteBox from 'baguettebox.js';
import 'baguettebox.js/dist/baguetteBox.min.css';

/**
 * Initialize lightbox for images in post content
 */
export function initPostImagesLightbox() {
  // Check if we're on a post or page
  const isPostPage = document.body.classList.contains('post-template') || 
                    document.body.classList.contains('page-template') ||
                    document.querySelector('.gh-content, .js-toc-content');
  
  if (!isPostPage) {
    return;
  }

  // Find content area
  const contentContainer = document.querySelector('.gh-content, .js-toc-content');
  
  if (!contentContainer) {
    return;
  }

  // Helper function to get full-size image URL
  function getFullSizeImageUrl(img) {
    // Get image source, checking both src and data-src (for lazy loading)
    let imgSrc = img.src || img.getAttribute('data-src') || img.getAttribute('src');
    if (!imgSrc) return '';
    
    // Try to get the full-size version if it's a Ghost image
    // Ghost images often have size parameters in the URL (e.g., _w600, _w1200)
    if (imgSrc.includes('_w')) {
      // Remove size parameters to get full-size image
      return imgSrc.replace(/_[wx]\d+/g, '');
    }
    
    return imgSrc;
  }

  // Process images that are already in links (like kg-image-card)
  const imagesInLinks = contentContainer.querySelectorAll('a img');
  imagesInLinks.forEach((img) => {
    const link = img.closest('a');
    if (!link) return;
    
    // Check if link already points to an image (likely for lightbox)
    const href = link.getAttribute('href');
    if (href && (href.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i) || href.includes('_w'))) {
      // Update href to full-size version
      link.href = getFullSizeImageUrl(href);
      // Add caption if not already present
      if (!link.getAttribute('data-caption') && img.alt) {
        link.setAttribute('data-caption', img.alt);
      }
      return;
    }
    
    // If link doesn't point to an image, check if we should convert it
    // Only convert if the link seems to be just for the image (no other content)
    const linkContent = link.innerHTML.trim();
    if (linkContent === img.outerHTML || link.children.length === 1 && link.children[0] === img) {
      // This link is likely just for the image, convert it to lightbox
      const fullSizeUrl = getFullSizeImageUrl(img);
      link.href = fullSizeUrl;
      if (img.alt) {
        link.setAttribute('data-caption', img.alt);
      }
    }
  });

  // Find all images that are NOT in links
  const imagesNotInLinks = contentContainer.querySelectorAll('img:not(a img)');
  
  // Wrap each image in a link for lightbox
  imagesNotInLinks.forEach((img) => {
    // Skip if image is already inside a link (double check)
    if (img.closest('a')) {
      return;
    }

    // Get the full-size image URL
    const imageSrc = getFullSizeImageUrl(img);

    // Create link wrapper
    const link = document.createElement('a');
    link.href = imageSrc;
    if (img.alt) {
      link.setAttribute('data-caption', img.alt);
    }
    link.style.cursor = 'pointer';
    link.style.display = 'inline-block';
    link.style.maxWidth = '100%';

    // Wrap image
    img.parentNode.insertBefore(link, img);
    link.appendChild(img);
  });

  // Initialize baguetteBox for the content container
  baguetteBox.run('.gh-content, .js-toc-content', {
    captions: true,
    buttons: true,
    async: false,
    preload: 2
  });
}

