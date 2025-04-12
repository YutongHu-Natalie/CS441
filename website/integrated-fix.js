// integrated-fix.js
// Combines all fixes for visualization syncing in one file

(function() {
    console.log("Integrated visualization fix loading");
    
    // Constants
    const YLC_SLIDE_INDEX = 2;  // Youth Literacy Chart slide index
    const FAMPLAN_SLIDE_INDEX = 4;  // Family Planning slide index
    const ABR_SLIDE_INDEX = 6;  // Adolescent Birth Rate slide index
    
    // Track current slide
    let currentSlideIndex = -1;
    
    // Get current slide index
    function getCurrentSlideIndex() {
      const slideIndicator = document.getElementById('slide-indicator');
      if (slideIndicator) {
        const text = slideIndicator.textContent.trim();
        const match = text.match(/^(\d+)\s*\/\s*\d+$/);
        if (match) {
          return parseInt(match[1]) - 1;
        }
      }
      return -1;
    }
    
    // Get references to visualization elements
    const getElements = () => ({
      // Bar charts and selectors
      ylcBarchart: document.getElementById('ylcbarchart'),
      abrBarchart: document.getElementById('abrbarchart'),
      ylcSelector: document.getElementById('ylcbarchart-selector'),
      abrSelector: document.getElementById('abrbarchart-selector'),
      
      // Family planning elements
      famplanBoxplot: document.getElementById('fampboxw'),
      famplanMap: document.getElementById('famplanmap'),
      
      // Containers
      vizContainer: document.querySelector('.visualization-container'),
      vizWrapper: document.getElementById('visualization-wrapper')
    });
    
    // ----- FAMILY PLANNING SPLIT VIEW FIX -----
    
    // Fixed positions for the split view
    const FIXED_POSITIONS = {
      boxplot: {
        display: 'block',
        opacity: '1',
        position: 'absolute',
        top: '0',
        height: '50%',
        zIndex: '100',
        visibility: 'visible'
      },
      map: {
        display: 'block',
        opacity: '1',
        position: 'absolute',
        top: '50%',
        height: '50%',
        zIndex: '90',
        visibility: 'visible'
      }
    };
    
    // Fix the family planning split view
    function fixFamPlanSplitView() {
      if (currentSlideIndex !== FAMPLAN_SLIDE_INDEX) return;
      
      const { famplanBoxplot, famplanMap } = getElements();
      if (!famplanBoxplot || !famplanMap) return;
      
      console.log("Fixing family planning split view");
      
      // Apply to boxplot
      famplanBoxplot.classList.add('active', 'split-view');
      Object.assign(famplanBoxplot.style, FIXED_POSITIONS.boxplot);
      
      // Apply to map
      famplanMap.classList.add('active', 'split-view');
      Object.assign(famplanMap.style, FIXED_POSITIONS.map);
      
      // Force initialization if available
      if (window.boxplotMapInteraction && typeof window.boxplotMapInteraction.initialize === 'function') {
        try {
          window.boxplotMapInteraction.initialize();
        } catch (e) {
          console.error("Error initializing boxplot-map interaction:", e);
        }
      }
    }
    
    // ----- BAR CHART SELECTOR FIX -----
    
    // Create country selector if missing
    function forceCreateSelectors() {
      // Only proceed if on relevant slides
      if (currentSlideIndex !== YLC_SLIDE_INDEX && currentSlideIndex !== ABR_SLIDE_INDEX) return;
      
      const { ylcBarchart, abrBarchart, ylcSelector, abrSelector } = getElements();
      
      // Handle YLC chart
      if (currentSlideIndex === YLC_SLIDE_INDEX) {
        // Force chart to be visible
        if (ylcBarchart) {
          ylcBarchart.classList.add('active');
          ylcBarchart.style.opacity = '1';
          ylcBarchart.style.display = 'block';
          ylcBarchart.style.visibility = 'visible';
        }
        
        // Create selector if missing
        if (!ylcSelector && window.createCountrySelector && window.allLiteracyData) {
          try {
            const selector = window.createCountrySelector(window.allLiteracyData, "#ylcbarchart", "disparity");
            console.log("YLC selector created");
            
            // Position immediately
            setTimeout(() => {
              const newSelector = document.getElementById('ylcbarchart-selector');
              if (newSelector) {
                positionSelector(newSelector, 'ylcbarchart');
              }
            }, 10);
          } catch (e) {
            console.error("Error creating YLC selector:", e);
          }
        } else if (ylcSelector) {
          positionSelector(ylcSelector, 'ylcbarchart');
        }
      }
      
      // Handle ABR chart
      if (currentSlideIndex === ABR_SLIDE_INDEX) {
        // Force chart to be visible
        if (abrBarchart) {
          abrBarchart.classList.add('active');
          abrBarchart.style.opacity = '1';
          abrBarchart.style.display = 'block';
          abrBarchart.style.visibility = 'visible';
        }
        
        // Create selector if missing
        if (!abrSelector && window.createCountrySelector && window.allBirthRateData) {
          try {
            const selector = window.createCountrySelector(window.allBirthRateData, "#abrbarchart", "value");
            console.log("ABR selector created");
            
            // Position immediately
            setTimeout(() => {
              const newSelector = document.getElementById('abrbarchart-selector');
              if (newSelector) {
                positionSelector(newSelector, 'abrbarchart');
              }
            }, 10);
          } catch (e) {
            console.error("Error creating ABR selector:", e);
          }
        } else if (abrSelector) {
          positionSelector(abrSelector, 'abrbarchart');
        }
      }
    }
    
    // Position selector correctly
    function positionSelector(selector, chartId) {
      if (!selector) return;
      
      console.log(`Positioning ${chartId} selector`);
      
      // Apply common styles
      selector.classList.add('force-visible');
      selector.style.position = 'absolute';
      selector.style.zIndex = '9999';
      selector.style.opacity = '1';
      selector.style.visibility = 'visible';
      selector.style.display = 'block';
      
      // Different positioning based on chart
      if (chartId === 'ylcbarchart') {
        selector.style.top = '100px';
        selector.style.right = '40px';
      } else {
        selector.style.top = '100px';
        selector.style.right = '40px';
      }
    }
    
    // Fix selectors based on current slide
    function updateSelectorsForCurrentSlide() {
      const { ylcSelector, abrSelector } = getElements();
      
      // Hide both first
      if (ylcSelector) ylcSelector.style.display = 'none';
      if (abrSelector) abrSelector.style.display = 'none';
      
      // Show only the active one
      if (currentSlideIndex === YLC_SLIDE_INDEX && ylcSelector) {
        positionSelector(ylcSelector, 'ylcbarchart');
      } else if (currentSlideIndex === ABR_SLIDE_INDEX && abrSelector) {
        positionSelector(abrSelector, 'abrbarchart');
      }
    }
    
    // ----- PATCHING FUNCTIONS -----
    
    // Patch toggleCountrySelector
    function patchToggleFunction() {
      if (typeof window.toggleCountrySelector === 'function') {
        const originalToggle = window.toggleCountrySelector;
        
        window.toggleCountrySelector = function() {
          // Call original function
          try {
            originalToggle();
          } catch (e) {
            console.error("Error in original toggleCountrySelector:", e);
          }
          
          // Apply our fixes
          updateSelectorsForCurrentSlide();
        };
        
        console.log("toggleCountrySelector patched");
      }
    }
    
    // Patch updateSlide function
    function patchUpdateSlide() {
      if (typeof window.updateSlide === 'function') {
        const originalUpdateSlide = window.updateSlide;
        
        window.updateSlide = function(index) {
          // Track current slide before executing original
          currentSlideIndex = index;
          console.log(`Slide changing to index ${index}`);
          
          // Call original function
          const result = originalUpdateSlide(index);
          
          // Apply appropriate fixes based on slide
          if (index === YLC_SLIDE_INDEX || index === ABR_SLIDE_INDEX) {
            setTimeout(forceCreateSelectors, 10);
            setTimeout(forceCreateSelectors, 100);
            setTimeout(updateSelectorsForCurrentSlide, 50);
            setTimeout(updateSelectorsForCurrentSlide, 200);
          } else if (index === FAMPLAN_SLIDE_INDEX) {
            setTimeout(fixFamPlanSplitView, 10);
            setTimeout(fixFamPlanSplitView, 100);
            setTimeout(fixFamPlanSplitView, 300);
          }
          
          return result;
        };
        
        console.log("updateSlide patched");
      }
    }
    
    // Patch renderChart function
    function patchRenderChart() {
      if (typeof window.renderChart === 'function') {
        const originalRenderChart = window.renderChart;
        
        window.renderChart = function(data, containerId, title, valueKey, isHorizontal) {
          // Call original function
          const result = originalRenderChart(data, containerId, title, valueKey, isHorizontal);
          
          // Apply our fixes
          if ((containerId === "#ylcbarchart" && currentSlideIndex === YLC_SLIDE_INDEX) ||
              (containerId === "#abrbarchart" && currentSlideIndex === ABR_SLIDE_INDEX)) {
            
            setTimeout(() => {
              const selector = document.getElementById(`${containerId.substring(1)}-selector`);
              if (selector) {
                positionSelector(selector, containerId.substring(1));
              } else {
                forceCreateSelectors();
              }
            }, 50);
          }
          
          return result;
        };
        
        console.log("renderChart patched");
      }
    }
    
    // ----- OBSERVERS AND EVENT LISTENERS -----
    
    // Watch for DOM changes in visualizations
    function setupObservers() {
      const { vizContainer } = getElements();
      if (!vizContainer) return;
      
      // Create observer for visualization changes
      const observer = new MutationObserver((mutations) => {
        let shouldFixSelectors = false;
        let shouldFixFamPlan = false;
        
        // Check what changed
        for (const mutation of mutations) {
          if (mutation.type === 'childList' || 
              (mutation.type === 'attributes' && 
               (mutation.target.id === 'ylcbarchart' || mutation.target.id === 'abrbarchart'))) {
            shouldFixSelectors = true;
          }
          
          if (mutation.type === 'attributes' && 
              (mutation.target.id === 'fampboxw' || mutation.target.id === 'famplanmap')) {
            shouldFixFamPlan = true;
          }
        }
        
        // Apply appropriate fixes
        if (shouldFixSelectors && (currentSlideIndex === YLC_SLIDE_INDEX || currentSlideIndex === ABR_SLIDE_INDEX)) {
          setTimeout(forceCreateSelectors, 10);
          setTimeout(updateSelectorsForCurrentSlide, 50);
        }
        
        if (shouldFixFamPlan && currentSlideIndex === FAMPLAN_SLIDE_INDEX) {
          setTimeout(fixFamPlanSplitView, 10);
        }
      });
      
      // Start observing
      observer.observe(vizContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class', 'style', 'display', 'opacity']
      });
      
      console.log("Visualization observer set up");
    }
    
    // Listen for slide changes
    function listenForSlideChanges() {
      document.addEventListener('slideChanged', function(e) {
        currentSlideIndex = e.detail.index;
        console.log(`slideChanged event: index ${currentSlideIndex}`);
        
        if (currentSlideIndex === YLC_SLIDE_INDEX || currentSlideIndex === ABR_SLIDE_INDEX) {
          setTimeout(forceCreateSelectors, 10);
          setTimeout(updateSelectorsForCurrentSlide, 50);
        } else if (currentSlideIndex === FAMPLAN_SLIDE_INDEX) {
          setTimeout(fixFamPlanSplitView, 10);
        }
      });
    }
    
    // ----- CSS STYLES -----
    
    // Add CSS fix styles
    function addFixStyles() {
      const style = document.createElement('style');
      style.textContent = `
        /* Ensure country selectors appear instantly */
        .country-selector {
          transition: none !important;
          animation: none !important;
          opacity: 1 !important;
          pointer-events: auto !important;
          z-index: 9999 !important;
        }
        
        /* Make sure position is always absolute to maintain positioning */
        #ylcbarchart-selector,
        #abrbarchart-selector {
          position: absolute !important;
          box-shadow: 0 0 15px rgba(0,0,0,0.2) !important;
        }
        
        /* Remove all transitions from bar charts for instant appearance */
        #ylcbarchart,
        #abrbarchart {
          transition: none !important;
          animation: none !important;
        }
        
        /* Override any visibility states */
        #ylcbarchart.active,
        #abrbarchart.active {
          opacity: 1 !important;
          visibility: visible !important;
          display: block !important;
        }
        
        /* Fixed positions for family planning split view */
        #fampboxw.active.split-view {
          display: block !important;
          opacity: 1 !important;
          position: absolute !important;
          top: 0 !important;
          height: 50% !important;
          z-index: 100 !important;
          visibility: visible !important;
        }
        
        #famplanmap.active.split-view {
          display: block !important;
          opacity: 1 !important;
          position: absolute !important;
          top: 50% !important;
          height: 50% !important;
          z-index: 90 !important;
          visibility: visible !important;
        }
        
        /* Force visible helper class */
        .force-visible {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          pointer-events: auto !important;
        }
      `;
      document.head.appendChild(style);
      console.log("Fix styles added");
    }
    
    // ----- MAIN INITIALIZE -----
    
    // Initialize everything
    function initialize() {
      // Set current slide index
      currentSlideIndex = getCurrentSlideIndex();
      console.log(`Initial slide index: ${currentSlideIndex}`);
      
      // Add CSS fixes
      addFixStyles();
      
      // Patch functions
      patchToggleFunction();
      patchUpdateSlide();
      patchRenderChart();
      
      // Set up observers and listeners
      setupObservers();
      listenForSlideChanges();
      
      // Ensure global variables exist
      if (typeof window.selectedCountries === 'undefined') {
        window.selectedCountries = new Set();
      }
      
      if (typeof window.MAX_SELECTED_COUNTRIES === 'undefined') {
        window.MAX_SELECTED_COUNTRIES = 5;
      }
      
      // Apply initial fixes based on current slide
      if (currentSlideIndex === YLC_SLIDE_INDEX || currentSlideIndex === ABR_SLIDE_INDEX) {
        setTimeout(forceCreateSelectors, 50);
        setTimeout(updateSelectorsForCurrentSlide, 100);
      } else if (currentSlideIndex === FAMPLAN_SLIDE_INDEX) {
        setTimeout(fixFamPlanSplitView, 50);
      }
      
      // Set up periodic checks for reliability
      const checkInterval = setInterval(() => {
        // Update current slide index
        const newIndex = getCurrentSlideIndex();
        if (newIndex !== -1) {
          currentSlideIndex = newIndex;
        }
        
        // Apply fixes based on current slide
        if (currentSlideIndex === YLC_SLIDE_INDEX || currentSlideIndex === ABR_SLIDE_INDEX) {
          updateSelectorsForCurrentSlide();
        } else if (currentSlideIndex === FAMPLAN_SLIDE_INDEX) {
          fixFamPlanSplitView();
        }
      }, 1000);
      
      // Stop interval after 60 seconds
      setTimeout(() => clearInterval(checkInterval), 60000);
      
      console.log("Integrated visualization fix initialized");
    }
    
    // Start when DOM is ready
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      initialize();
    } else {
      document.addEventListener('DOMContentLoaded', initialize);
    }
    
    // Final check after full page load
    window.addEventListener('load', function() {
      // Try applying fixes again
      setTimeout(() => {
        currentSlideIndex = getCurrentSlideIndex();
        
        if (currentSlideIndex === YLC_SLIDE_INDEX || currentSlideIndex === ABR_SLIDE_INDEX) {
          forceCreateSelectors();
          updateSelectorsForCurrentSlide();
        } else if (currentSlideIndex === FAMPLAN_SLIDE_INDEX) {
          fixFamPlanSplitView();
        }
      }, 500);
    });
  })();