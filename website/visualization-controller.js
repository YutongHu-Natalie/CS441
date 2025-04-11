// visualization-controller.js
document.addEventListener('DOMContentLoaded', function() {
  // Get all SVG visualization elements
  const visualizations = document.querySelectorAll('.viz-svg');
  
  // Function to reset all visualizations
  function resetVisualizations() {
    visualizations.forEach(svg => {
      svg.classList.remove('active');
      svg.style.opacity = 0;
      svg.style.zIndex = 0;
      
      // Remove any special positioning applied for split views
      svg.style.top = '';
      svg.style.height = '';
    });
  }
  
  // Function to show specific visualizations by ID
  function showVisualization(vizIds) {
    resetVisualizations();
    
    if (vizIds[0] === 'none') {
      return;
    }
    
    // Handle special case for family planning slide with multiple visualizations
    const hasSplitView = vizIds.includes('fampboxw') && vizIds.includes('famplanmap');
    
    vizIds.forEach((vizId, index) => {
      const vizElement = document.getElementById(vizId);
      if (vizElement) {
        vizElement.classList.add('active');
        vizElement.style.opacity = 1;
        vizElement.style.zIndex = 100 - index; // Ensure proper stacking order
        
        // Special handling for split view
        if (hasSplitView) {
          if (vizId === 'fampboxw') {
            // Position boxplot at the top
            vizElement.style.top = '0';
            vizElement.style.height = '50%';
            vizElement.style.zIndex = 100;
          } else if (vizId === 'famplanmap') {
            // Position map at the bottom
            vizElement.style.top = '50%';
            vizElement.style.height = '50%';
            vizElement.style.zIndex = 90;
          }
        }
      }
    });
  }
  
  // Hook into the slideshow navigation
  // This creates a custom event we can listen for when the slide changes
  const originalUpdateSlide = window.updateSlide;
  if (typeof originalUpdateSlide === 'function') {
    window.updateSlide = function(index) {
      const result = originalUpdateSlide(index);
      
      // Dispatch a custom event with the new slide index
      const event = new CustomEvent('slideChanged', { detail: { index } });
      document.dispatchEvent(event);
      
      return result;
    };
  }
  
  // Listen for slide change events
  document.addEventListener('slideChanged', function(e) {
    const slideIndex = e.detail.index;
    const currentSlide = window.slides ? window.slides[slideIndex] : null;
    
    if (currentSlide && currentSlide.visualization) {
      showVisualization(currentSlide.visualization);
    }
  });
  
  // Create a global controller object for external access
  window.vizController = {
    show: showVisualization,
    reset: resetVisualizations
  };
  
  // Initialize by hiding all visualizations on load
  resetVisualizations();
  
  // Add a MutationObserver to monitor changes to the boxplot SVG
  // This ensures the boxplot is properly shown/hidden when its content changes
  const boxplotObserver = new MutationObserver(function(mutations) {
    const boxplot = document.getElementById('fampboxw');
    if (boxplot && !boxplot.classList.contains('active')) {
      boxplot.style.opacity = 0;
    }
  });
  
  const boxplotElement = document.getElementById('fampboxw');
  if (boxplotElement) {
    boxplotObserver.observe(boxplotElement, { 
      childList: true,
      subtree: true,
      attributes: true
    });
  }
  
  console.log('Visualization controller initialized');
});

// Modify the existing slideshow.js to expose the slides array and updateSlide function
// This should be inserted at the end of the slideshow.js file
(function patchSlideshow() {
  const originalSlideshow = document.querySelector('script[src="slideshow.js"]');
  if (originalSlideshow) {
    // Wait for slideshow.js to be fully loaded
    window.addEventListener('load', function() {
      // Check if slides is defined in the global scope
      if (typeof window.slides === 'undefined' && typeof slides !== 'undefined') {
        // Make slides and updateSlide function available globally
        window.slides = slides;
      }
      
      if (typeof window.updateSlide === 'undefined' && typeof updateSlide === 'function') {
        window.updateSlide = updateSlide;
      }
    });
  }
})();