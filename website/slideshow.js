document.addEventListener('DOMContentLoaded', function() {
    // Slide data
    const slides = [
      {
        verse: 1,
        text: `since i was small, i have always dreamed big
  "a doctor—no lawyer!—no…
  scientist!"
  yet when the time came, the boys ran ahead
  reading and writing and learning while i—`,
        visualization: 'ylcbarchart',
        title: 'Youth Literacy Disparity'
      },
      {
        verse: 2,
        text: 'i stayed home instead.',
        visualization: 'none', // Text only slide
        title: ''
      },
      {
        verse: 3,
        text: `maybe i could…i could have a new dream?
  to plan out my life, when i'll have my kids?
  not go through
  what women before me did?
  it's a joke, of course.`,
        visualization: 'famplanmap',
        title: 'Family Planning Access by Region'
      },
      {
        verse: 4,
        text: 'like everything is.',
        visualization: 'none', // Text only slide
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
  
    // DOM elements
    const verseNumber = document.getElementById('verse-number');
    const verseText = document.getElementById('verse-text');
    const vizTitle = document.getElementById('viz-title');
    const visualization = document.getElementById('visualization');
    const slideIndicator = document.getElementById('slide-indicator');
    const prevButton = document.getElementById('prev-button');
    const nextButton = document.getElementById('next-button');
  
    // Update slide content
    function updateSlide(index) {
      const slide = slides[index];
      
      // Update verse content
      verseNumber.textContent = slide.verse;
      
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
      
      // Update visualization
      visualization.innerHTML = '';
      visualization.className = 'visualization-placeholder ' + slide.visualization;
      
      // Create visualization based on type
      createVisualization(slide.visualization);
      
      // Update slide indicator
      slideIndicator.textContent = `${index + 1} / ${slides.length}`;
      
      // Update button states
      prevButton.disabled = index === 0;
      nextButton.disabled = index === slides.length - 1;
      
      // Update current index
      currentSlideIndex = index;
    }
  
    // Create visualization based on type
    function createVisualization(vizType) {
      // If no visualization type is specified, let text occupy entire slide
      if (!vizType || vizType === 'none') {
        document.querySelector('.slide-content').classList.add('text-only');
        return;
      } else {
        document.querySelector('.slide-content').classList.remove('text-only');
      }
      
      switch(vizType) {
        case 'ylcbarchart':
          createBarChart();
          break;
        case 'fampboxw':
          createBoxPlot();
          break;
        case 'famplanmap':
          createMap(false);
          break;
        case 'abrbarchart':
          createHorizontalBarChart();
          break;
        case 'dvmap':
          createMap(true);
          break;
        case 'compplot':
          createScatterPlot();
          break;
        case 'compradar':
          createRadarChart();
          break;
      }
    }
  
    // Create simple visualizations
    function createBarChart() {
      const chart = document.createElement('div');
      chart.className = 'bar-chart';
      
      const values = [60, 45, 75, 30, 50];
      
      values.forEach(val => {
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = val + '%';
        chart.appendChild(bar);
      });
      
      visualization.appendChild(chart);
    }
    
    function createBoxPlot() {
      const plot = document.createElement('div');
      plot.className = 'box-plot';
      
      // Create regions
      const regions = ['Africa', 'Asia', 'Latin America', 'Europe', 'Oceania'];
      
      regions.forEach((region, i) => {
        const row = document.createElement('div');
        row.className = 'boxplot-row';
        
        const label = document.createElement('div');
        label.className = 'region-label';
        label.textContent = region;
        
        const container = document.createElement('div');
        container.className = 'boxplot-container';
        
        // Create box elements with varied positions
        const min = document.createElement('div');
        min.className = 'boxplot-min';
        min.style.left = (10 + i * 5) + '%';
        
        const box = document.createElement('div');
        box.className = 'boxplot-box';
        box.style.left = (15 + i * 5) + '%';
        box.style.width = (30 + i * 2) + '%';
        
        const median = document.createElement('div');
        median.className = 'boxplot-median';
        median.style.left = (30 + i * 5) + '%';
        
        const max = document.createElement('div');
        max.className = 'boxplot-max';
        max.style.left = (55 + i * 5) + '%';
        
        container.appendChild(min);
        container.appendChild(box);
        container.appendChild(median);
        container.appendChild(max);
        
        row.appendChild(label);
        row.appendChild(container);
        
        plot.appendChild(row);
      });
      
      visualization.appendChild(plot);
    }
    
    function createMap(isViolence) {
      const mapContainer = document.createElement('div');
      mapContainer.className = isViolence ? 'map-placeholder purple' : 'map-placeholder';
      
      // Add legend
      const legend = document.createElement('div');
      legend.className = 'map-legend';
      legend.style.position = 'absolute';
      legend.style.bottom = '10px';
      legend.style.right = '10px';
      legend.style.background = 'rgba(255,255,255,0.7)';
      legend.style.padding = '5px';
      legend.style.borderRadius = '3px';
      legend.innerHTML = '<div style="font-size:0.8rem;">Legend</div>';
      
      mapContainer.appendChild(legend);
      visualization.appendChild(mapContainer);
    }
    
    function createHorizontalBarChart() {
      const chart = document.createElement('div');
      chart.className = 'horizontal-bars';
      
      const countries = ['Country A', 'Country B', 'Country C', 'Country D', 'Country E'];
      const values = [75, 65, 85, 45, 35];
      
      countries.forEach((country, i) => {
        const row = document.createElement('div');
        row.style.display = 'flex';
        row.style.alignItems = 'center';
        row.style.width = '100%';
        
        const label = document.createElement('div');
        label.style.width = '100px';
        label.style.textAlign = 'right';
        label.style.paddingRight = '10px';
        label.textContent = country;
        
        const bar = document.createElement('div');
        bar.className = 'h-bar';
        bar.style.width = values[i] + '%';
        
        const value = document.createElement('div');
        value.style.marginLeft = '10px';
        value.textContent = values[i];
        
        row.appendChild(label);
        row.appendChild(bar);
        row.appendChild(value);
        
        chart.appendChild(row);
      });
      
      visualization.appendChild(chart);
    }
    
    function createScatterPlot() {
      const plot = document.createElement('div');
      plot.className = 'scatter-placeholder';
      
      // Add dots
      const positions = [
        {x: 30, y: 40},
        {x: 40, y: 60},
        {x: 60, y: 30},
        {x: 70, y: 20},
        {x: 80, y: 50},
        {x: 20, y: 70},
        {x: 50, y: 45}
      ];
      
      positions.forEach(pos => {
        const dot = document.createElement('div');
        dot.className = 'dot';
        dot.style.left = pos.x + '%';
        dot.style.top = pos.y + '%';
        plot.appendChild(dot);
      });
      
      // Add regression line
      const line = document.createElement('div');
      line.className = 'regression-line';
      plot.appendChild(line);
      
      // Add axes labels
      const xLabel = document.createElement('div');
      xLabel.style.position = 'absolute';
      xLabel.style.bottom = '5px';
      xLabel.style.left = '50%';
      xLabel.style.transform = 'translateX(-50%)';
      xLabel.style.fontSize = '0.8rem';
      xLabel.textContent = 'Family Planning Access (%)';
      
      const yLabel = document.createElement('div');
      yLabel.style.position = 'absolute';
      yLabel.style.left = '5px';
      yLabel.style.top = '50%';
      yLabel.style.transform = 'translateY(-50%) rotate(-90deg)';
      yLabel.style.fontSize = '0.8rem';
      yLabel.textContent = 'Adolescent Birth Rate';
      
      plot.appendChild(xLabel);
      plot.appendChild(yLabel);
      
      visualization.appendChild(plot);
    }
    
    function createRadarChart() {
      const radar = document.createElement('div');
      radar.className = 'radar-placeholder';
      
      // Add some simple radar elements
      const dimensions = ['Education', 'Health', 'Freedom', 'Safety', 'Income'];
      
      dimensions.forEach((dim, i) => {
        const angle = (i / dimensions.length) * 2 * Math.PI;
        const x = 50 + 40 * Math.cos(angle);
        const y = 50 + 40 * Math.sin(angle);
        
        const point = document.createElement('div');
        point.style.position = 'absolute';
        point.style.left = x + '%';
        point.style.top = y + '%';
        point.style.width = '6px';
        point.style.height = '6px';
        point.style.backgroundColor = 'rgba(220, 120, 140, 0.8)';
        point.style.borderRadius = '50%';
        point.style.transform = 'translate(-50%, -50%)';
        
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.left = (50 + 48 * Math.cos(angle)) + '%';
        label.style.top = (50 + 48 * Math.sin(angle)) + '%';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.fontSize = '0.8rem';
        label.textContent = dim;
        
        radar.appendChild(point);
        radar.appendChild(label);
      });
      
      // Add a polygon to represent data
      const polygon = document.createElement('div');
      polygon.style.position = 'absolute';
      polygon.style.left = '50%';
      polygon.style.top = '50%';
      polygon.style.width = '70%';
      polygon.style.height = '70%';
      polygon.style.transform = 'translate(-50%, -50%) rotate(18deg)';
      polygon.style.clipPath = 'polygon(50% 0%, 100% 38%, 82% 100%, 18% 100%, 0% 38%)';
      polygon.style.backgroundColor = 'rgba(220, 120, 140, 0.3)';
      polygon.style.border = '2px solid rgba(220, 120, 140, 0.8)';
      
      radar.appendChild(polygon);
      visualization.appendChild(radar);
    }
  
    // Event listeners
    prevButton.addEventListener('click', function() {
      if (currentSlideIndex > 0) {
        updateSlide(currentSlideIndex - 1);
      }
    });
  
    nextButton.addEventListener('click', function() {
      if (currentSlideIndex < slides.length - 1) {
        updateSlide(currentSlideIndex + 1);
      }
    });
  
    // Keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        if (currentSlideIndex < slides.length - 1) {
          updateSlide(currentSlideIndex + 1);
        }
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        if (currentSlideIndex > 0) {
          updateSlide(currentSlideIndex - 1);
        }
      }
    });
  
    // Initialize first slide
    updateSlide(0);
  });