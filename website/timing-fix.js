// timing-fix.js
// This script specifically addresses timing issues with visualizations

(function() {
    // Wait until DOM is fully loaded
    document.addEventListener('DOMContentLoaded', function() {
      console.log("Timing fix script loaded");
      
      // References to key elements
      const visualizations = {
        ylcbarchart: document.getElementById('ylcbarchart'),
        abrbarchart: document.getElementById('abrbarchart'),
        fampboxw: document.getElementById('fampboxw'),
        famplanmap: document.getElementById('famplanmap'),
        dvmap: document.getElementById('dvmap'),
        compplot: document.getElementById('compplot')
      };
      
      // Constants for positioning and timing
      const FIXED_POSITIONS = {
        boxplot: {
          top: '0',
          height: '50%',
          position: 'absolute',
          zIndex: '100'
        },
        map: {
          top: '50%',
          height: '50%',
          position: 'absolute',
          zIndex: '90'
        }
      };
      
      // Store original dimensions and positions
      const originalStyles = {};
      for (const vizId in visualizations) {
        if (visualizations[vizId]) {
          originalStyles[vizId] = {
            width: visualizations[vizId].style.width,
            height: visualizations[vizId].style.height,
            position: visualizations[vizId].style.position,
            top: visualizations[vizId].style.top,
            zIndex: visualizations[vizId].style.zIndex
          };
        }
      }
      
      // Get current slide index
      function getCurrentSlideIndex() {
        const slideIndicator = document.getElementById('slide-indicator');
        if (slideIndicator) {
          const currentIndex = parseInt(slideIndicator.textContent.split('/')[0].trim()) - 1;
          return currentIndex;
        }
        return -1;
      }
      
      // Handle special case for family planning slide (slide 4)
      let preloadedFamPlanBoxplot = false;
      let preloadedFamPlanMap = false;
      
      // Pre-initialize boxplot and map before they're needed
      function preInitializeFamPlanVisualizations() {
        if (preloadedFamPlanBoxplot && preloadedFamPlanMap) return;
        
        console.log("Pre-initializing family planning visualizations");
        
        // Create a hidden container for pre-initialization
        const preloadContainer = document.createElement('div');
        preloadContainer.style.position = 'absolute';
        preloadContainer.style.visibility = 'hidden';
        preloadContainer.style.pointerEvents = 'none';
        document.body.appendChild(preloadContainer);
        
        // Clone the boxplot and map SVGs for initialization
        if (!preloadedFamPlanBoxplot && visualizations.fampboxw) {
          const boxplotClone = visualizations.fampboxw.cloneNode(true);
          boxplotClone.id = 'preload-boxplot';
          boxplotClone.style.width = '500px';
          boxplotClone.style.height = '300px';
          preloadContainer.appendChild(boxplotClone);
          preloadedFamPlanBoxplot = true;
        }
        
        if (!preloadedFamPlanMap && visualizations.famplanmap) {
          const mapClone = visualizations.famplanmap.cloneNode(true);
          mapClone.id = 'preload-map';
          mapClone.style.width = '500px';
          mapClone.style.height = '300px';
          preloadContainer.appendChild(mapClone);
          preloadedFamPlanMap = true;
        }
        
        // If boxplotMapInteraction exists, initialize it
        if (window.boxplotMapInteraction && typeof window.boxplotMapInteraction.initialize === 'function') {
          try {
            window.boxplotMapInteraction.initialize();
          } catch (e) {
            console.error("Error pre-initializing boxplotMapInteraction:", e);
          }
        }
        
        // Remove the preload container after a delay
        setTimeout(() => {
          if (document.body.contains(preloadContainer)) {
            document.body.removeChild(preloadContainer);
          }
        }, 5000);
      }
      
      // Function to fix the split view for family planning visualizations
      function fixFamPlanSplitView() {
        if (getCurrentSlideIndex() !== 4) return; // Only for slide 4
        
        console.log("Fixing family planning split view");
        
        // Apply fixed positioning immediately
        if (visualizations.fampboxw) {
          Object.assign(visualizations.fampboxw.style, FIXED_POSITIONS.boxplot);
          visualizations.fampboxw.classList.add('active', 'split-view');
          visualizations.fampboxw.style.opacity = '1';
          visualizations.fampboxw.style.display = 'block';
        }
        
        if (visualizations.famplanmap) {
          Object.assign(visualizations.famplanmap.style, FIXED_POSITIONS.map);
          visualizations.famplanmap.classList.add('active', 'split-view');
          visualizations.famplanmap.style.opacity = '1';
          visualizations.famplanmap.style.display = 'block';
        }
        
        // Force boxplot and map interaction initialization
        if (window.boxplotMapInteraction && typeof window.boxplotMapInteraction.initialize === 'function') {
          try {
            window.boxplotMapInteraction.initialize();
          } catch (e) {
            console.error("Error initializing boxplotMapInteraction:", e);
          }
        }
      }
      
      // Fix country selector visibility for bar charts
      function fixCountrySelectors() {
        const currentSlideIndex = getCurrentSlideIndex();
        
        // Youth Literacy Chart (slide 2)
        const ylcSelector = document.getElementById('ylcbarchart-selector');
        if (ylcSelector) {
          const isYLCActive = currentSlideIndex === 2;
          ylcSelector.style.display = isYLCActive ? 'block' : 'none';
          ylcSelector.style.zIndex = '1001';
        }
        
        // Adolescent Birth Rate Chart (slide 6)
        const abrSelector = document.getElementById('abrbarchart-selector');
        if (abrSelector) {
          const isABRActive = currentSlideIndex === 6;
          abrSelector.style.display = isABRActive ? 'block' : 'none';
          abrSelector.style.zIndex = '1001';
        }
      }
      
      // Handle slide changes
      document.addEventListener('slideChanged', function(e) {
        const slideIndex = e.detail.index;
        console.log("Slide changed to index:", slideIndex);
        
        // Reset all visualizations to original state first
        for (const vizId in visualizations) {
          if (visualizations[vizId] && originalStyles[vizId]) {
            visualizations[vizId].classList.remove('active', 'split-view');
            visualizations[vizId].style.display = 'none';
            visualizations[vizId].style.opacity = '0';
          }
        }
        
        // Special handling for family planning slide
        if (slideIndex === 4) {
          console.log("Family planning slide detected");
          
          // Fix positions immediately and repeatedly to ensure they stick
          fixFamPlanSplitView();
          setTimeout(fixFamPlanSplitView, 100);
          setTimeout(fixFamPlanSplitView, 300);
          setTimeout(fixFamPlanSplitView, 500);
          setTimeout(fixFamPlanSplitView, 1000);
        }
        
        // Fix country selectors after a short delay
        setTimeout(fixCountrySelectors, 200);
        setTimeout(fixCountrySelectors, 500);
        setTimeout(fixCountrySelectors, 1000);
      });
      
      // Interception for original slide show functions to enforce our fixes
      const originalUpdateSlide = window.updateSlide;
      if (typeof originalUpdateSlide === 'function') {
        window.updateSlide = function(index) {
          // Call the original function
          const result = originalUpdateSlide(index);
          
          // Apply our fixes
          setTimeout(() => {
            if (index === 4) {
              fixFamPlanSplitView();
            }
            fixCountrySelectors();
          }, 100);
          
          return result;
        };
      }
      
      // Monitor and fix visualization-controller when it loads
      const vizControllerInterval = setInterval(() => {
        if (window.vizController && typeof window.vizController.show === 'function') {
          const originalShowVisualization = window.vizController.show;
          
          window.vizController.show = function(vizIds) {
            // Call original function
            originalShowVisualization(vizIds);
            
            // Apply our fixes
            setTimeout(() => {
              if (vizIds.includes('fampboxw') && vizIds.includes('famplanmap')) {
                fixFamPlanSplitView();
              }
              fixCountrySelectors();
            }, 100);
          };
          
          clearInterval(vizControllerInterval);
          console.log("Enhanced visualization controller");
        }
      }, 200);
      
      // Start pre-initializing the family planning visualizations
      setTimeout(preInitializeFamPlanVisualizations, 2000);
      
      // Fix boxplot_map_inter.js by extending its initialize function
      const boxplotIntervalCheck = setInterval(() => {
        if (window.boxplotMapInteraction && typeof window.boxplotMapInteraction.initialize === 'function') {
          const originalInitialize = window.boxplotMapInteraction.initialize;
          
          window.boxplotMapInteraction.initialize = function() {
            const result = originalInitialize();
            
            // After initialization, fix positioning if on the right slide
            if (getCurrentSlideIndex() === 4) {
              setTimeout(fixFamPlanSplitView, 100);
            }
            
            return result;
          };
          
          clearInterval(boxplotIntervalCheck);
          console.log("Enhanced boxplotMapInteraction");
        }
      }, 200);
      
      // Clear the intervals after 10 seconds
      setTimeout(() => {
        clearInterval(vizControllerInterval);
        clearInterval(boxplotIntervalCheck);
      }, 10000);
      
      // Apply immediate fixes after page load
      window.addEventListener('load', function() {
        // Initial check and fix
        setTimeout(() => {
          const currentSlideIndex = getCurrentSlideIndex();
          console.log("Initial check, current slide:", currentSlideIndex);
          
          if (currentSlideIndex === 4) {
            fixFamPlanSplitView();
          }
          
          fixCountrySelectors();
        }, 1000);
      });
      
      console.log("Timing fix script initialized");
    });
  })();