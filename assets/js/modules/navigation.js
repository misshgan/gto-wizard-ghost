// Initialize active navigation
export function initActiveNavigation() {
  const currentPath = window.location.pathname;
  const sidebarLinks = document.querySelectorAll('.sidebar-list-primary__link');
  
  // Remove active class from all items
  document.querySelectorAll('.sidebar-list-primary__item').forEach(item => {
    item.classList.remove('active');
  });
  
  // Check each link and add active class to the corresponding item
  sidebarLinks.forEach(link => {
    const href = link.getAttribute('href');
    const listItem = link.closest('.sidebar-list-primary__item');
    
    // Skip if href is empty or just '#'
    if (!href || href === '#') return;
    
    // Check if current path matches the link
    if (isPathActive(currentPath, href)) {
      listItem.classList.add('active');
    }
  });
}

function isPathActive(currentPath, linkPath) {
  // Exact match
  if (currentPath === linkPath) {
    return true;
  }
  
  // Special case for home page
  if (currentPath === '/' && linkPath === '/') {
    return true;
  }
  
  // If link is a parent path and current path starts with it
  // e.g., /articles matches /articles/some-post
  if (linkPath !== '/' && currentPath.startsWith(linkPath + '/')) {
    return true;
  }
  
  return false;
}

// Initialize secondary dropdown
export function initSecondaryDropdown() {
  const logoGroups = document.querySelectorAll('.logo-dropdown');
  if (!logoGroups.length) return;

  function hideAllDropdowns() {
    logoGroups.forEach((group) => {
      const dropdown = group.querySelector('.dropdown-secondary');
      if (dropdown) dropdown.classList.remove('show');
      group.classList.remove('active');
    });
  }

  function toggleForGroup(group) {
    const dropdown = group.querySelector('.dropdown-secondary');
    if (!dropdown) return;
    const isVisible = dropdown.classList.contains('show');
    // Close others first
    hideAllDropdowns();
    if (!isVisible) {
      dropdown.classList.add('show');
      group.classList.add('active');
    }
  }

  logoGroups.forEach((group) => {
    const dropdown = group.querySelector('.dropdown-secondary');
    if (!dropdown) return;

    group.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleForGroup(group);
    });

    dropdown.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  });

  document.addEventListener('click', (event) => {
    // If click is outside all groups/dropdowns, close all
    const clickedInsideSomeGroup = Array.from(logoGroups).some((group) => group.contains(event.target));
    if (!clickedInsideSomeGroup) {
      hideAllDropdowns();
    }
  });
}

// Mobile Sidebar toggle
export function initMobileSidebar() {
  const sidebar = document.querySelector('.sidebar');
  const menuButton = document.querySelector('.header-menu-button');
  if (!sidebar || !menuButton) return;

  const openIcon = menuButton.querySelector('.header-menu-icon--open');
  const closeIcon = menuButton.querySelector('.header-menu-icon--close');
  let isOpen = false;

  // Ensure initial icon state
  if (openIcon) openIcon.style.display = 'block';
  if (closeIcon) closeIcon.style.display = 'none';

  function swapIcons(open) {
    if (openIcon) openIcon.style.display = open ? 'none' : 'block';
    if (closeIcon) closeIcon.style.display = open ? 'block' : 'none';
  }

  function toggleSidebar() {
    isOpen = !isOpen;
    sidebar.classList.toggle('show', isOpen);
    document.body.classList.toggle('sidebar-open', isOpen);
    swapIcons(isOpen);
  }

  menuButton.addEventListener('click', (e) => {
    e.preventDefault();
    toggleSidebar();
  });

  // Close sidebar when clicking outside
  document.addEventListener('click', (e) => {
    if (isOpen && !sidebar.contains(e.target) && !menuButton.contains(e.target)) {
      toggleSidebar();
    }
  });

  // Close sidebar on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen) {
      toggleSidebar();
    }
  });
}

