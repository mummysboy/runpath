// Navigation menu toggle
(() => {
  const menuButton = document.getElementById('menuButton');
  const navMenu = document.getElementById('navMenu');
  const navLinks = document.querySelectorAll('.nav-link');
  const body = document.body;

  // Create backdrop element
  let backdrop = document.querySelector('.menu-backdrop');
  if (!backdrop) {
    backdrop = document.createElement('div');
    backdrop.className = 'menu-backdrop';
    document.body.appendChild(backdrop);
  }

  const closeMenu = () => {
    navMenu?.classList.remove('active');
    menuButton?.classList.remove('active');
    backdrop?.classList.remove('active');
    body.style.overflow = '';
  };

  const openMenu = () => {
    navMenu?.classList.add('active');
    menuButton?.classList.add('active');
    backdrop?.classList.add('active');
    body.style.overflow = 'hidden';
  };

  menuButton?.addEventListener('click', () => {
    if (navMenu?.classList.contains('active')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close menu when clicking a nav link
  navLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  // Close menu when clicking on backdrop
  backdrop?.addEventListener('click', () => {
    closeMenu();
  });

  // Close menu on escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navMenu?.classList.contains('active')) {
      closeMenu();
    }
  });
})();

// Header scroll effect - hide on scroll down, show on scroll up
(() => {
  const topbar = document.getElementById('topbar');
  if (!topbar) return;

  let lastScroll = 0;
  const scrollThreshold = 20;
  let isScrolling = false;

  const handleScroll = () => {
    if (isScrolling) return;
    
    isScrolling = true;
    requestAnimationFrame(() => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      
      // Add scrolled class for styling when scrolled past threshold
      if (currentScroll > scrollThreshold) {
        topbar.classList.add('scrolled');
      } else {
        topbar.classList.remove('scrolled');
        topbar.classList.remove('hidden');
        lastScroll = currentScroll;
        isScrolling = false;
        return;
      }

      // Hide/show based on scroll direction
      if (currentScroll > lastScroll && currentScroll > 100) {
        // Scrolling down - hide header
        topbar.classList.add('hidden');
      } else if (currentScroll < lastScroll) {
        // Scrolling up - show header
        topbar.classList.remove('hidden');
      }
      
      lastScroll = currentScroll;
      isScrolling = false;
    });
  };

  // Check on load
  handleScroll();
  
  // Listen for scroll events
  window.addEventListener('scroll', handleScroll, { passive: true });
})();

// Set active nav link based on current page
(() => {
  const navLinks = document.querySelectorAll('.nav-link');
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  
  navLinks.forEach(link => {
    const linkHref = link.getAttribute('href');
    if (linkHref === currentPage || (currentPage === '' && linkHref === 'index.html')) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
})();

// Simple horizontal carousel scrolling
(() => {
  const track = document.querySelector('.carousel-track');
  if (!track) return;

  const prev = document.querySelector('.carousel-btn.prev');
  const next = document.querySelector('.carousel-btn.next');

  const scrollAmount = () => track.clientWidth * 0.9;

  prev?.addEventListener('click', () => {
    track.scrollBy({ left: -scrollAmount(), behavior: 'smooth' });
  });

  next?.addEventListener('click', () => {
    track.scrollBy({ left: scrollAmount(), behavior: 'smooth' });
  });
})();

// Smooth page transitions and scroll to top
(() => {
  // Disable browser scroll restoration for smooth manual control
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Scroll to top immediately on page load
  const scrollToTop = () => {
    // Use requestAnimationFrame to ensure it happens after render
    requestAnimationFrame(() => {
      window.scrollTo(0, 0);
    });
  };

  // Scroll to top on initial load
  scrollToTop();

  // Scroll to top on pageshow event (handles back/forward navigation)
  window.addEventListener('pageshow', (event) => {
    if (event.persisted) {
      // Page was loaded from cache (back/forward button)
      scrollToTop();
    }
  });

  // Handle smooth transitions on navigation link clicks
  const handleNavigation = (e, link) => {
    const href = link.getAttribute('href');
    
    // Skip if it's an external link, anchor link, or non-HTML link
    if (!href || href.startsWith('#') || href.startsWith('http') || href.startsWith('mailto:') || href.startsWith('tel:')) {
      return;
    }
    
    // Skip if it's the same page (but allow if it's index.html to index.html)
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const targetPage = href === '/' || href === '' ? 'index.html' : href;
    if (targetPage === currentPage) {
      return;
    }

    e.preventDefault();
    
    // Add transition class for fade-out
    document.body.classList.add('page-transitioning');
    
    // Navigate after transition completes (faster transition)
    setTimeout(() => {
      window.location.href = href;
    }, 200);
  };

  // Add click handlers to all navigation links
  document.addEventListener('DOMContentLoaded', () => {
    const navLinks = document.querySelectorAll('a[href$=".html"], a[href="index.html"], a[href="/"], a[href=""]');
    navLinks.forEach(link => {
      link.addEventListener('click', (e) => handleNavigation(e, link));
    });
  });
})();

// Fade-in and directional float animations on view
document.addEventListener('DOMContentLoaded', () => {
  document.body.classList.add('page-loaded');

  const animated = document.querySelectorAll('.anim');
  if (!animated.length) return;

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.2, rootMargin: '0px 0px -10% 0px' }
  );

  animated.forEach((el, idx) => {
    // small stagger via transition delay
    el.style.transitionDelay = `${Math.min(idx * 60, 360)}ms`;
    observer.observe(el);
  });
});




