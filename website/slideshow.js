document.addEventListener('DOMContentLoaded', function() {
    // Slide data
    const slides = [
      {
        verse: 0,
        text: `a girl's dream\nby jiya shah and yutong hu`,
        visualization: ['none'],
        title: ''
      },
      {
        verse: 1,
        text: `since i was small, i have always dreamed big
  "a doctor—no lawyer!—no…
  scientist!"`,
        visualization: ['none'],
        title: ''
      },
      {
        verse: 2,
        text: `yet when the time came, the boys ran ahead
  reading and writing and learning while i—`,
        visualization: ['ylcbarchart'],
        title: ''
      },
      {
        verse: 3,
        text: 'i stayed home instead.',
        visualization: ['none'], 
        title: ''
      },
      {
        verse: 4,
        text: `maybe i could…i could have a new dream?
  to plan out my life, when i'll have my kids?
  not go through
  what women before me did?`,
        visualization: ['fampboxw', 'famplanmap'],  // Both boxplot and map on the same slide
        title: ''
      },
      {
        verse: 5,
        text: `it's a joke, of course. 
  like everything is.`,
        visualization: ['none'],  
        title: ''
      },
      {
        verse: 6,
        text: `too young to drive, i rock my baby slow
  my childhood dolls still scattered on the floor
  old dreams in dust, baby cries forevermore...
  what could i be—? hush, my love, don't you cry
  all for her now, i'll be here 'till i die`,
        visualization: ['abr-histogram'],
        title: ''
      },
      {
        verse: 7,
        text: 'withering away.',
        visualization: ['none'], // Text only slide
        title: ''
      },
      {
        verse: 8,
        text: `dreamed of love notes, gentle hands and a home 
  from fist to fist, all i could do was roam 
  "he'll change." i say, but purple blots still bloom
  no warmth and no home, what more could i lose?`,
        visualization: ['dvmap'],
        title: ''
      },
      {
        verse: 9,
        text: `please don't forget me, i'm not a shadow,
  not a number, just
  a girl with a`,
        visualization: ['compplot'],
        title: ''
      },
      {
        verse: 10,
        text: 'dream',
        visualization: ['none'], // Text only slide
        title: ''
      },
      {
        verse: 11,
        html: `These visualizations were created for <a href="https://emilywall.github.io/vis/">Dr. Emily Wall's Information Visualization</a> course at Emory University. All data was gathered from the <a href="https://gender-data-hub-2-undesa.hub.arcgis.com/pages/indicators" target="_blank" rel="noopener noreferrer">United Nations Statistical Commission’s database</a> pertaining to the Minimum Set of Gender Indicators.`,
        visualization: ['none'],
        title: ''
      }      
    ];
  
    let currentSlideIndex = 0;
    
    // DOM elements
    const verseText = document.getElementById('verse-text');
    const vizTitle = document.getElementById('viz-title');
    const slideContainer = document.querySelector('.slide-content');
    const slideShowContainer = document.querySelector('.slideshow-container');
    
    // Remove existing control elements from the DOM
    const existingControls = document.querySelector('.slideshow-controls');
    if (existingControls) {
      existingControls.parentNode.removeChild(existingControls);
    }
    
    // Create new slide indicator
    const slideIndicator = document.createElement('div');
    slideIndicator.className = 'slide-indicator';
    slideIndicator.id = 'slide-indicator';
    
    // Add interactive swipe indicators that will act as navigation buttons
    const leftIndicator = document.createElement('div');
    leftIndicator.className = 'swipe-indicator left';
    leftIndicator.innerHTML = '◄';
    leftIndicator.setAttribute('aria-label', 'Previous slide');
    leftIndicator.id = 'prev-indicator';
    
    const rightIndicator = document.createElement('div');
    rightIndicator.className = 'swipe-indicator right';
    rightIndicator.innerHTML = '►';
    rightIndicator.setAttribute('aria-label', 'Next slide');
    rightIndicator.id = 'next-indicator';
    
    // Add new elements to container
    slideShowContainer.appendChild(slideIndicator);
    slideShowContainer.appendChild(leftIndicator);
    slideShowContainer.appendChild(rightIndicator);
  
    // Update slide content
    function updateSlide(index) {
      const slide = slides[index];
      
      // Clear previous verse text
      verseText.innerHTML = '';
      
      if(slide.html){
        // Handle raw HTML (used for last slide with a link)
        const p = document.createElement('p');
        p.className = 'verse-line';
        p.innerHTML = slide.html;
        verseText.appendChild(p);
      }
      else{
        // Add each line as a paragraph
        const lines = slide.text.split('\n');
        lines.forEach(line => {
          const p = document.createElement('p');
          p.className = 'verse-line';
          p.textContent = line;
          verseText.appendChild(p);
        });
      }
      
      // Update visualization title
      vizTitle.textContent = slide.title;
      
      // Hide all visualizations first
      document.querySelectorAll('.viz-svg').forEach(svg => {
        svg.classList.remove('active');
        svg.style.zIndex = 0;  // Reset z-index for all
      });
      
      // Show the current visualizations
      if (slide.visualization[0] !== 'none') {
        // Loop through all visualizations for this slide
        slide.visualization.forEach((vizId, index) => {
          const vizElement = document.getElementById(vizId);
          if (vizElement) {
            vizElement.classList.add('active');
            
            // For the family planning slide with multiple visualizations
            if (slide.visualization.includes('fampboxw') && slide.visualization.includes('famplanmap')) {
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
            } else {
              // Normal z-index for single visualizations
              vizElement.style.zIndex = 100 - index;  // Ensure proper stacking order
            }
            
            // Special handling for boxplot
            if (slide.visualization[0] !== 'none') {
                window.vizController.show(slide.visualization);
              } else {
                window.vizController.reset();
              }
          }
        });
      }
      
      // Update classes for text-only slides
      if (slide.visualization[0] === 'none') {
        slideContainer.classList.add('text-only');
      } else {
        slideContainer.classList.remove('text-only');
      }
      
      // Update slide indicator
      slideIndicator.textContent = `${index + 1} / ${slides.length}`;
      
      // Update swipe indicator states
      if (index === 0) {
        leftIndicator.classList.add('disabled');
      } else {
        leftIndicator.classList.remove('disabled');
      }
      
      if (index === slides.length - 1) {
        rightIndicator.classList.add('disabled');
      } else {
        rightIndicator.classList.remove('disabled');
      }
      
      // Update current index
      currentSlideIndex = index;
    }
  
    // Navigation functions
    function goToPrevSlide() {
      if (currentSlideIndex > 0) {
        updateSlide(currentSlideIndex - 1);
      }
    }
  
    function goToNextSlide() {
      if (currentSlideIndex < slides.length - 1) {
        updateSlide(currentSlideIndex + 1);
      }
    }
  
    // Event listeners for swipe indicators that now act as buttons
    leftIndicator.onclick = function() {
      console.log("Left indicator clicked");
      goToPrevSlide();
    };
    
    rightIndicator.onclick = function() {
      console.log("Right indicator clicked");
      goToNextSlide();
    };
  
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown' || e.key === ' ') {
        goToNextSlide();
        e.preventDefault(); // Prevent default scroll behavior
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        goToPrevSlide();
        e.preventDefault(); // Prevent default scroll behavior
      }
    });
  
    // Initialize the first slide
    updateSlide(0);
  });