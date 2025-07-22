/**
 * Elite Theme System Controller
 * Implements sophisticated dark/light mode transitions with system integration
 */

class EliteThemeController {
  constructor() {
    this.theme = this.getInitialTheme();
    this.callbacks = new Set();
    this.prefersColorScheme = window.matchMedia('(prefers-color-scheme: dark)');
    
    this.init();
    this.bindEvents();
  }

  /**
   * Initialize theme system with smooth transitions
   */
  init() {
    // Apply theme immediately to prevent flash
    this.applyTheme(this.theme, false);
    
    // Add transition classes after initial render
    requestAnimationFrame(() => {
      document.documentElement.classList.add('theme-transitions-enabled');
    });
  }

  /**
   * Get initial theme preference with intelligent fallback
   */
  getInitialTheme() {
    // Check localStorage first
    const stored = localStorage.getItem('elite-theme');
    if (stored && ['light', 'dark', 'auto'].includes(stored)) {
      return stored;
    }

    // Fallback to system preference
    return 'auto';
  }

  /**
   * Get the actual theme considering auto mode
   */
  getResolvedTheme() {
    if (this.theme === 'auto') {
      return this.prefersColorScheme.matches ? 'dark' : 'light';
    }
    return this.theme;
  }

  /**
   * Apply theme with optional animation
   */
  applyTheme(theme, animate = true) {
    const resolvedTheme = theme === 'auto' 
      ? (this.prefersColorScheme.matches ? 'dark' : 'light')
      : theme;

    if (animate) {
      // Add transition overlay for smooth theme switching
      this.createTransitionOverlay();
    }

    // Apply theme attribute
    document.documentElement.setAttribute('data-theme', resolvedTheme);
    
    // Update meta theme-color for mobile browsers
    this.updateMetaThemeColor(resolvedTheme);
    
    // Notify callbacks
    this.callbacks.forEach(callback => {
      try {
        callback(resolvedTheme, theme);
      } catch (error) {
        console.warn('Theme callback error:', error);
      }
    });
  }

  /**
   * Create smooth transition overlay effect
   */
  createTransitionOverlay() {
    const overlay = document.createElement('div');
    overlay.className = 'theme-transition-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: var(--surface-primary);
      opacity: 0;
      pointer-events: none;
      z-index: 9999;
      transition: opacity 200ms ease;
    `;
    
    document.body.appendChild(overlay);
    
    // Trigger transition
    requestAnimationFrame(() => {
      overlay.style.opacity = '0.8';
      
      setTimeout(() => {
        overlay.style.opacity = '0';
        setTimeout(() => {
          if (overlay.parentNode) {
            overlay.parentNode.removeChild(overlay);
          }
        }, 200);
      }, 100);
    });
  }

  /**
   * Update meta theme-color for native integration
   */
  updateMetaThemeColor(theme) {
    const colors = {
      light: '#ffffff',
      dark: '#0f172a'
    };
    
    let metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (!metaThemeColor) {
      metaThemeColor = document.createElement('meta');
      metaThemeColor.name = 'theme-color';
      document.head.appendChild(metaThemeColor);
    }
    
    metaThemeColor.content = colors[theme];
  }

  /**
   * Set theme with persistence and animation
   */
  setTheme(theme) {
    if (!['light', 'dark', 'auto'].includes(theme)) {
      console.warn('Invalid theme:', theme);
      return;
    }

    this.theme = theme;
    localStorage.setItem('elite-theme', theme);
    this.applyTheme(theme);
  }

  /**
   * Toggle between light and dark themes
   */
  toggle() {
    const current = this.getResolvedTheme();
    const next = current === 'light' ? 'dark' : 'light';
    this.setTheme(next);
  }

  /**
   * Bind system events and listeners
   */
  bindEvents() {
    // Listen for system theme changes
    this.prefersColorScheme.addEventListener('change', (e) => {
      if (this.theme === 'auto') {
        this.applyTheme('auto');
      }
    });

    // Handle page visibility changes for better performance
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        // Reapply theme when page becomes visible
        this.applyTheme(this.theme, false);
      }
    });

    // Keyboard shortcut for theme toggle (Cmd/Ctrl + Shift + T)
    document.addEventListener('keydown', (e) => {
      if ((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'T') {
        e.preventDefault();
        this.toggle();
      }
    });
  }

  /**
   * Register callback for theme changes
   */
  onChange(callback) {
    if (typeof callback === 'function') {
      this.callbacks.add(callback);
      
      // Return unsubscribe function
      return () => this.callbacks.delete(callback);
    }
  }

  /**
   * Get current theme information
   */
  getThemeInfo() {
    return {
      theme: this.theme,
      resolved: this.getResolvedTheme(),
      isAuto: this.theme === 'auto',
      systemPreference: this.prefersColorScheme.matches ? 'dark' : 'light'
    };
  }
}

/**
 * Elite Component Library
 * Pre-built components following the spotless design system
 */

class EliteComponents {
  /**
   * Create an elite button with advanced interactions
   */
  static createButton({
    text,
    variant = 'primary',
    size = 'medium',
    icon = null,
    onClick = null,
    disabled = false,
    loading = false
  }) {
    const button = document.createElement('button');
    button.className = `elite-button elite-button--${variant} elite-button--${size}`;
    
    if (disabled) button.disabled = true;
    if (loading) button.classList.add('elite-button--loading');
    
    let content = '';
    if (icon) content += `<i class="${icon}" aria-hidden="true"></i>`;
    if (loading) content += `<span class="elite-spinner"></span>`;
    content += `<span>${text}</span>`;
    
    button.innerHTML = content;
    
    if (onClick) {
      button.addEventListener('click', onClick);
    }
    
    return button;
  }

  /**
   * Create floating label input with validation
   */
  static createFloatingInput({
    label,
    type = 'text',
    placeholder = ' ',
    required = false,
    validator = null
  }) {
    const container = document.createElement('div');
    container.className = 'floating-label-container';
    
    const input = document.createElement('input');
    input.type = type;
    input.className = 'elite-input';
    input.placeholder = placeholder;
    input.required = required;
    
    const labelElement = document.createElement('label');
    labelElement.className = 'floating-label';
    labelElement.textContent = label;
    
    container.appendChild(input);
    container.appendChild(labelElement);
    
    if (validator) {
      input.addEventListener('blur', () => {
        const isValid = validator(input.value);
        container.classList.toggle('invalid', !isValid);
      });
    }
    
    return { container, input, label: labelElement };
  }

  /**
   * Create elite card with hover effects
   */
  static createCard({ title, content, actions = [] }) {
    const card = document.createElement('div');
    card.className = 'elite-card';
    
    let html = '';
    if (title) {
      html += `<h3 class="text-heading-3" style="margin-bottom: var(--spacing-md);">${title}</h3>`;
    }
    
    html += `<div class="card-content">${content}</div>`;
    
    if (actions.length > 0) {
      html += '<div class="card-actions" style="margin-top: var(--spacing-lg); display: flex; gap: var(--spacing-md);">';
      actions.forEach(action => {
        html += `<button class="elite-button elite-button--${action.variant || 'secondary'}">${action.text}</button>`;
      });
      html += '</div>';
    }
    
    card.innerHTML = html;
    return card;
  }

  /**
   * Create status indicator with semantic colors
   */
  static createStatusIndicator({ status, text, icon = null }) {
    const indicator = document.createElement('div');
    indicator.className = `status-indicator ${status}`;
    
    let content = '';
    if (icon) content += `<i class="${icon}" aria-hidden="true"></i>`;
    content += text;
    
    indicator.innerHTML = content;
    return indicator;
  }

  /**
   * Create theme toggle switch
   */
  static createThemeToggle(themeController) {
    const container = document.createElement('div');
    container.style.cssText = 'display: flex; align-items: center; gap: var(--spacing-md);';
    
    const label = document.createElement('span');
    label.textContent = 'Dark mode';
    label.className = 'text-body';
    
    const toggle = document.createElement('button');
    toggle.className = 'theme-toggle';
    toggle.setAttribute('aria-label', 'Toggle theme');
    toggle.type = 'button';
    
    toggle.addEventListener('click', () => {
      themeController.toggle();
    });
    
    // Update toggle state when theme changes
    themeController.onChange((resolvedTheme) => {
      const isDark = resolvedTheme === 'dark';
      toggle.setAttribute('aria-pressed', isDark.toString());
      label.textContent = isDark ? 'Light mode' : 'Dark mode';
    });
    
    container.appendChild(label);
    container.appendChild(toggle);
    
    return container;
  }
}

/**
 * Animation Utilities for Elite Interactions
 */

class EliteAnimations {
  /**
   * Ripple effect for interactive elements
   */
  static addRippleEffect(element) {
    element.addEventListener('click', function(e) {
      const ripple = document.createElement('span');
      const rect = this.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size / 2;
      const y = e.clientY - rect.top - size / 2;
      
      ripple.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        left: ${x}px;
        top: ${y}px;
        background: rgba(255, 255, 255, 0.3);
        border-radius: 50%;
        transform: scale(0);
        animation: ripple 0.6s linear;
        pointer-events: none;
      `;
      
      this.style.position = 'relative';
      this.style.overflow = 'hidden';
      this.appendChild(ripple);
      
      setTimeout(() => {
        ripple.remove();
      }, 600);
    });
  }

  /**
   * Smooth scroll with easing
   */
  static smoothScrollTo(target, duration = 1000) {
    const targetElement = typeof target === 'string' 
      ? document.querySelector(target) 
      : target;
    
    if (!targetElement) return;
    
    const targetPosition = targetElement.offsetTop;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;
    
    function animation(currentTime) {
      if (startTime === null) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const run = easeInOutQuad(timeElapsed, startPosition, distance, duration);
      window.scrollTo(0, run);
      if (timeElapsed < duration) requestAnimationFrame(animation);
    }
    
    function easeInOutQuad(t, b, c, d) {
      t /= d / 2;
      if (t < 1) return c / 2 * t * t + b;
      t--;
      return -c / 2 * (t * (t - 2) - 1) + b;
    }
    
    requestAnimationFrame(animation);
  }

  /**
   * Intersection Observer for scroll animations
   */
  static observeElements(selector, callback, options = {}) {
    const defaultOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -50px 0px',
      ...options
    };
    
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          callback(entry.target, entry);
        }
      });
    }, defaultOptions);
    
    document.querySelectorAll(selector).forEach(el => {
      observer.observe(el);
    });
    
    return observer;
  }
}

// CSS for ripple animation
const rippleCSS = `
@keyframes ripple {
  to {
    transform: scale(4);
    opacity: 0;
  }
}
`;

// Inject ripple CSS
if (!document.querySelector('#ripple-styles')) {
  const style = document.createElement('style');
  style.id = 'ripple-styles';
  style.textContent = rippleCSS;
  document.head.appendChild(style);
}

// Initialize global theme controller
window.eliteTheme = new EliteThemeController();
window.EliteComponents = EliteComponents;
window.EliteAnimations = EliteAnimations;

// Auto-initialize ripple effects on elite buttons
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.elite-button').forEach(button => {
    EliteAnimations.addRippleEffect(button);
  });
});

// Export for ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    EliteThemeController,
    EliteComponents,
    EliteAnimations
  };
}
