document.addEventListener('DOMContentLoaded', function() {
    // Slide data with updated slide for box plot and map combined
    const slides = [
        {
          verse: 0,
          text: `a girl's dream\nby jiya shah and yutong hu`,
          visualization: 'none',
          title: ''
        },
        {
            verse: 1,
            text: `since i was small, i have always dreamed big
      "a doctor—no lawyer!—no…
      scientist!"`,
            visualization: 'none',
            title: ''
          },
      {
        verse: 2,
        text: `yet when the time came, the boys ran ahead
  reading and writing and learning while i—`,
        visualization: 'ylcbarchart',
        title: 'Youth Literacy Disparity'
      },
      {
        verse: 3,
        text: 'i stayed home instead.',
        visualization: 'none', 
        title: ''
      },
      {
        verse: 4,
        text: `maybe i could…i could have a new dream?
  to plan out my life, when i'll have my kids?
  not go through
  what women before me did?`,
        visualization: 'boxplot-map-combined', // New combined visualization
        title: 'Family Planning Access by Region'
      },
      {
        verse: 4,
        text: `
  it's a joke, of course. 
  like everything is.`,
        visualization: 'none',
        title: ''
      },
      {
        verse: 5,
        text: `too young to drive, i rock my baby slow
  my childhood dolls still scattered on the floor
  old dreams in dust, baby cries forevermore...
  what could i be—? hush, my love, don't you cry
  all for her now, i'll be here 'till i die`,
        visualization: 'abrbarchart',
        title: 'Adolescent Birth Rate'
      },
      {
        verse: 6,
        text: 'withering away.',
        visualization: 'none', // Text only slide
        title: ''
      },
      {
        verse: 7,
        text: `dreamed of love notes, gentle hands and a home 
  from fist to fist, all i could do was roam 
  "he'll change." i say, but purple blots still bloom
  no warmth and no home, what more could i lose?`,
        visualization: 'dvmap',
        title: 'Women Subjected to Violence'
      },
      {
        verse: 8,
        text: `please don't forget me, i'm not a shadow,
  not a number, just
  a girl with a`,
        visualization: 'compplot',
        title: 'The Full Picture'
      },
      {
        verse: 9,
        text: 'dream',
        visualization: 'none', // Text only slide
        title: ''
      }
    ];
  
    let currentSlideIndex = 0;
    let touchStartX = null;
    let touchEndX = null;
  
    // DOM elements
    const verseText = document.getElementById('verse-text');
    const vizTitle = document.getElementById('viz-title');
    const slideIndicator = document.getElementById('slide-indicator');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
    const slideContainer = document.querySelector('.slide-content');
    
    // Add swipe indicators
    const leftIndicator = document.createElement('div');
    leftIndicator.className = 'swipe-indicator left';
    leftIndicator.innerHTML = '◄';
    
    const rightIndicator = document.createElement('div');
    rightIndicator.className = 'swipe-indicator right';
    rightIndicator.innerHTML = '►';
    
    slideContainer.appendChild(leftIndicator);
    slideContainer.appendChild(rightIndicator);
  
    // Update slide content
    function updateSlide(index) {
      const slide = slides[index];
      
      // Clear previous verse text
      verseText.innerHTML = '';
      
      // Add each line as a paragraph
      const lines = slide.text.split('\n');
      lines.forEach(line => {
        const p = document.createElement('p');
        p.className = 'verse-line';
        p.textContent = line;
        verseText.appendChild(p);
      });
      
      // Update visualization title
      vizTitle.textContent = slide.title;
      
      // Hide all visualizations first
      document.querySelectorAll('.viz-svg').forEach(svg => {
        svg.classList.remove('active');
        svg.style.display = 'none'; // Completely hide them
      });
      
      // Show the current visualization
      if (slide.visualization === 'boxplot-map-combined') {
        // Special case for combined visualization
        const boxplotElement = document.getElementById('fampboxw');
        const mapElement = document.getElementById('famplanmap');
        
        if (boxplotElement && mapElement) {
          // Configure container for combined view
          const vizContainer = document.getElementById('visualization-wrapper');
          vizContainer.style.flexDirection = 'column';
          
          // Show and position both elements
          boxplotElement.classList.add('active');
          mapElement.classList.add('active');
          
          boxplotElement.style.display = 'block';
          mapElement.style.display = 'block';
          
          // Set specific heights for the combined view
          boxplotElement.style.position = 'relative';
          mapElement.style.position = 'relative';
          
          boxplotElement.style.height = '40%';
          mapElement.style.height = '60%';
          
          // Clear any previous visualization styles
          boxplotElement.style.opacity = '1';
          mapElement.style.opacity = '1';
          
          // If our custom script isn't loaded yet, load it
          if (!window.boxplotMapInteraction) {
            loadBoxplotMapInteraction();
          } else {
            // Reset any previous highlighting
            window.boxplotMapInteraction.resetHighlighting();
          }
        }
      } else if (slide.visualization !== 'none') {
        // Standard single visualization display
        const vizElement = document.getElementById(slide.visualization);
        if (vizElement) {
          vizElement.classList.add('active');
          vizElement.style.display = 'block';
          vizElement.style.position = 'absolute';
          vizElement.style.height = '100%';
          
          // Reset container to default
          const vizContainer = document.getElementById('visualization-wrapper');
          vizContainer.style.flexDirection = 'row';
        }
      }
      
      // Update classes for text-only slides
      if (slide.visualization === 'none') {
        slideContainer.classList.add('text-only');
      } else {
        slideContainer.classList.remove('text-only');
      }
      
      // Update slide indicator
      slideIndicator.textContent = `${index + 1} / ${slides.length}`;
      
      // Update button states
      prevButton.disabled = index === 0;
      nextButton.disabled = index === slides.length - 1;
      
      // Update current index
      currentSlideIndex = index;
    }
    
    // Load the custom boxplot-map interaction script
    function loadBoxplotMapInteraction() {
      // Remove any existing script first to prevent duplicates
      const existingScript = document.getElementById('boxplot-map-script');
      if (existingScript) {
        existingScript.remove();
      }
      
      // Create script element
      const script = document.createElement('script');
      script.id = 'boxplot-map-script';
      script.src = 'boxplot-map-interaction.js';
      script.onload = function() {
        console.log("Boxplot-map interaction script loaded successfully");
      };
      script.onerror = function(e) {
        console.error("Error loading boxplot-map script:", e);
      };
      document.body.appendChild(script);
    }
  
    // Navigation functions
    function goToPrevSlide() {
      if (currentSlideIndex > 0) {
        showSwipeIndicator('right');
        updateSlide(currentSlideIndex - 1);
      }
    }
  
    function goToNextSlide() {
      if (currentSlideIndex < slides.length - 1) {
        showSwipeIndicator('left');
        updateSlide(currentSlideIndex + 1);
      }
    }
    
    // Function to show swipe indicator
    function showSwipeIndicator(direction) {
      const indicator = direction === 'left' ? leftIndicator : rightIndicator;
      indicator.style.opacity = '1';
      setTimeout(() => {
        indicator.style.opacity = '0';
      }, 500);
    }
  
    // Event listeners for buttons
    prevButton.addEventListener('click', goToPrevSlide);
    nextButton.addEventListener('click', goToNextSlide);
  
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        goToNextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevSlide();
      }
    });
  
    // Touch events for swipe
    document.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].screenX;
    }, false);
  
    document.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].screenX;
      handleSwipe();
    }, false);
  
    function handleSwipe() {
      if (!touchStartX || !touchEndX) return;
      
      const swipeDistance = touchEndX - touchStartX;
      const minSwipeDistance = 50; // Minimum distance to register as a swipe
      
      if (Math.abs(swipeDistance) >= minSwipeDistance) {
        if (swipeDistance > 0) {
          // Swipe right (previous)
          goToPrevSlide();
        } else {
          // Swipe left (next)
          goToNextSlide();
        }
      }
      
      // Reset touch values
      touchStartX = null;
      touchEndX = null;
    }
  
    // Initialize the visualizations and first slide
    updateSlide(0);
});