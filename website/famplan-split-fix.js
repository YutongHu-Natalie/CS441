// famplan-split-fix.js
// This script focuses specifically on fixing the family planning split view rendering

(function() {
    document.addEventListener('DOMContentLoaded', function() {
      console.log("Family planning split view fix loaded");
      
      // References to the boxplot and map elements
      const boxplot = document.getElementById('fampboxw');
      const map = document.getElementById('famplanmap');
      
      // Only proceed if both elements exist
      if (!boxplot || !map) {
        console.error("Missing boxplot or map elements");
        return;
      }
      
      // Store original styling to restore later
      const originalStyles = {
        boxplot: {
          display: boxplot.style.display,
          opacity: boxplot.style.opacity,
          position: boxplot.style.position,
          top: boxplot.style.top,
          height: boxplot.style.height,
          zIndex: boxplot.style.zIndex
        },
        map: {
          display: map.style.display,
          opacity: map.style.opacity,
          position: map.style.position,
          top: map.style.top,
          height: map.style.height,
          zIndex: map.style.zIndex
        }
      };
      
      // Fixed positions for the split view
      const fixedPositions = {
        boxplot: {
          display: 'block',
          opacity: '1',
          position: 'absolute',
          top: '0',
          height: '50%',
          zIndex: '100'
        },
        map: {
          display: 'block',
          opacity: '1',
          position: 'absolute',
          top: '50%',
          height: '50%',
          zIndex: '90'
        }
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
      
      // Check if family planning slide is active
      function isFamilyPlanningSlideActive() {
        return getCurrentSlideIndex() === 4; // slide 5 (index 4)
      }
      
      // Apply fixed positions for boxplot and map
      function applyFixedPositions() {
        if (!isFamilyPlanningSlideActive()) return;
        
        console.log("Applying fixed positions for family planning split view");
        
        // Apply to boxplot
        boxplot.classList.add('active', 'split-view');
        Object.assign(boxplot.style, fixedPositions.boxplot);
        
        // Apply to map
        map.classList.add('active', 'split-view');
        Object.assign(map.style, fixedPositions.map);
        
        // Force initialization if available
        if (window.boxplotMapInteraction && typeof window.boxplotMapInteraction.initialize === 'function') {
          try {
            window.boxplotMapInteraction.initialize();
          } catch (e) {
            console.error("Error initializing boxplot-map interaction:", e);
          }
        }
      }
      
      // Reset positions when leaving the slide
      function resetPositions() {
        if (isFamilyPlanningSlideActive()) return;
        
        console.log("Resetting positions for family planning elements");
        
        // Only reset if not on the family planning slide
        boxplot.classList.remove('active', 'split-view');
        Object.assign(boxplot.style, originalStyles.boxplot);
        
        map.classList.remove('active', 'split-view');
        Object.assign(map.style, originalStyles.map);
      }
      
      // The key innovation: Prevent map regeneration by taking over its positioning
      function preventMapRegeneration() {
        // Find any functions in boxplot_map_inter.js that modify positioning
        if (window.boxplotMapInteraction) {
          // Override initialization to keep our fixed positions
          const originalInit = window.boxplotMapInteraction.initialize;
          window.boxplotMapInteraction.initialize = function() {
            // Call original but then immediately re-apply our fixed positions
            const result = originalInit ? originalInit() : null;
            
            // Wait a tick then reapply our positions
            if (isFamilyPlanningSlideActive()) {
              setTimeout(applyFixedPositions, 10);
            }
            
            return result;
          };
        }
        
        // Create a mutation observer to watch for DOM changes in the map and boxplot
        const mapObserver = new MutationObserver(function(mutations) {
          if (isFamilyPlanningSlideActive()) {
            // If any mutations happen while on the family planning slide,
            // immediately reapply our fixed positions
            setTimeout(applyFixedPositions, 10);
          }
        });
        
        // Observe both elements
        mapObserver.observe(boxplot, { 
          attributes: true, 
          attributeFilter: ['style', 'class'] 
        });
        
        mapObserver.observe(map, { 
          attributes: true, 
          attributeFilter: ['style', 'class'] 
        });
        
        // Also observe the visualization wrapper
        const vizWrapper = document.getElementById('visualization-wrapper');
        if (vizWrapper) {
          mapObserver.observe(vizWrapper, { 
            childList: true, 
            subtree: true,
            attributes: true
          });
        }
      }
      
      // Listen for slide changes
      document.addEventListener('slideChanged', function(e) {
        const slideIndex = e.detail.index;
        
        if (slideIndex === 4) {
          // Apply multiple times to ensure it sticks
          applyFixedPositions();
          setTimeout(applyFixedPositions, 100);
          setTimeout(applyFixedPositions, 300);
          setTimeout(applyFixedPositions, 500);
        } else {
          resetPositions();
        }
      });
      
      // Intercept the slideshow's updateSlide function
      const originalUpdateSlide = window.updateSlide;
      if (typeof originalUpdateSlide === 'function') {
        window.updateSlide = function(index) {
          // Call original
          const result = originalUpdateSlide(index);
          
          // Apply our fix
          if (index === 4) {
            setTimeout(applyFixedPositions, 10);
            setTimeout(applyFixedPositions, 100);
            setTimeout(applyFixedPositions, 300);
          } else {
            setTimeout(resetPositions, 10);
          }
          
          return result;
        };
      }
      
      // Setup the prevention of map regeneration
      preventMapRegeneration();
      
      // Initial check after page load
      window.addEventListener('load', function() {
        if (isFamilyPlanningSlideActive()) {
          applyFixedPositions();
        }
      });
      
      // Set up a periodic check to maintain positions
      const intervalCheck = setInterval(() => {
        if (isFamilyPlanningSlideActive()) {
          if (
            boxplot.style.top !== fixedPositions.boxplot.top ||
            boxplot.style.height !== fixedPositions.boxplot.height ||
            map.style.top !== fixedPositions.map.top ||
            map.style.height !== fixedPositions.map.height
          ) {
            console.log("Restoring family planning split view positions");
            applyFixedPositions();
          }
        }
      }, 500);
      
      // Stop interval after 30 seconds
      setTimeout(() => clearInterval(intervalCheck), 30000);
      
      // Check immediately
      setTimeout(applyFixedPositions, 100);
      
      console.log("Family planning split view fix initialized");
    });
  })();