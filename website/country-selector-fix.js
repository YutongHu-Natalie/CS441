// country-selector-fix.js
// This script specifically addresses the flashing country selector issue

(function() {
    document.addEventListener('DOMContentLoaded', function() {
      console.log("Country selector fix loaded");
      
      // Track slide state to prevent unnecessary updates
      let currentSlideIndex = -1;
      let selectorUpdateInProgress = false;
      
      // Reference slide indices where selectors should appear
      const SELECTOR_SLIDES = {
        ylcbarchart: 2,  // Youth Literacy Chart appears on slide index 2
      };
      
      // Get current slide index
      function getCurrentSlideIndex() {
        const slideIndicator = document.getElementById('slide-indicator');
        if (slideIndicator) {
          const currentIndex = parseInt(slideIndicator.textContent.split('/')[0].trim()) - 1;
          return currentIndex;
        }
        return -1;
      }
      
      // Function to immediately hide all country selectors
      function hideAllSelectors() {
        const selectors = document.querySelectorAll('.country-selector');
        selectors.forEach(selector => {
          selector.style.display = 'none';
          selector.style.opacity = '0';
          selector.style.visibility = 'hidden';
          selector.style.pointerEvents = 'none';
        });
      }
      
      // Main function to update country selector visibility
      function updateSelectorVisibility(forceUpdate = false) {
        // Prevent multiple concurrent updates
        if (selectorUpdateInProgress && !forceUpdate) return;
        
        selectorUpdateInProgress = true;
        
        const newSlideIndex = getCurrentSlideIndex();
        
        // Only process if slide changed or force update requested
        if (newSlideIndex !== currentSlideIndex || forceUpdate) {
          currentSlideIndex = newSlideIndex;
          
          // Process each selector
          for (const [selectorId, slideIndex] of Object.entries(SELECTOR_SLIDES)) {
            const selector = document.getElementById(`${selectorId}-selector`);
            if (selector) {
              if (currentSlideIndex === slideIndex) {
                // Should be visible on this slide
                selector.style.display = 'block';
                selector.style.opacity = '1';
                selector.style.visibility = 'visible';
                selector.style.pointerEvents = 'auto';
                selector.style.zIndex = '1001';
              } else {
                // Should be hidden on other slides
                selector.style.display = 'none';
                selector.style.opacity = '0';
                selector.style.visibility = 'hidden';
                selector.style.pointerEvents = 'none';
              }
            }
          }
        }
        
        selectorUpdateInProgress = false;
      }
      
      // Create a more robust MutationObserver to detect when selectors are added to the DOM
      const selectorObserver = new MutationObserver(function(mutations) {
        let selectorAdded = false;
        
        mutations.forEach(mutation => {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(node => {
              if (node.classList && node.classList.contains('country-selector')) {
                selectorAdded = true;
              }
            });
          }
        });
        
        if (selectorAdded) {
          // Immediately apply correct visibility when a selector is added
          setTimeout(() => updateSelectorVisibility(true), 0);
        }
      });
      
      // Observe the body for selector additions
      selectorObserver.observe(document.body, { 
        childList: true, 
        subtree: true
      });
      
      // Listen for slide changes
      document.addEventListener('slideChanged', function(e) {
        // Hide selectors immediately during transition
        hideAllSelectors();
        
        // Update visibility after a very short delay to ensure state is settled
        setTimeout(updateSelectorVisibility, 10);
        
        // Double-check again after longer delays to handle race conditions
        setTimeout(updateSelectorVisibility, 100);
        setTimeout(updateSelectorVisibility, 300);
      });
      
      // Intercept the original toggleCountrySelector function to use our more robust version
      if (window.toggleCountrySelector) {
        const originalToggle = window.toggleCountrySelector;
        window.toggleCountrySelector = function() {
          // Call original first
          originalToggle();
          
          // Then apply our fix with slight delay
          setTimeout(updateSelectorVisibility, 10);
        };
      }
      
      // Intercept the visualization controller to apply our fix
      const vizControllerInterval = setInterval(() => {
        if (window.vizController && typeof window.vizController.show === 'function') {
          const originalShow = window.vizController.show;
          
          window.vizController.show = function(vizIds) {
            // Call original function
            originalShow(vizIds);
            
            // Immediately hide all selectors during transitions
            hideAllSelectors();
            
            // Then apply our visibility logic after a short delay
            setTimeout(updateSelectorVisibility, 50);
          };
          
          clearInterval(vizControllerInterval);
          console.log("Enhanced visualization controller with selector fixes");
        }
      }, 200);
      
      // Initial check after page load
      window.addEventListener('load', function() {
        // Clear any existing selectors that might be showing incorrectly
        hideAllSelectors();
        
        // Initial setup with delay to ensure everything is loaded
        setTimeout(updateSelectorVisibility, 500);
      });
      
      // Run a periodic check for the first 10 seconds after page load
      // This handles any edge cases where selectors appear unexpectedly
      let checkCount = 0;
      const periodicCheck = setInterval(() => {
        updateSelectorVisibility();
        checkCount++;
        if (checkCount > 20) {
          clearInterval(periodicCheck);
        }
      }, 500);
      
      // Clear interval after 30 seconds
      setTimeout(() => {
        clearInterval(vizControllerInterval);
        clearInterval(periodicCheck);
      }, 30000);
      
      console.log("Country selector fix initialized");
    });
  })();