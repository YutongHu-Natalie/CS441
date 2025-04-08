document.addEventListener('DOMContentLoaded', function() {
    // Visualization mappings
    const visualizations = {
      1: { type: 'ylcbarchart', title: 'Youth Literacy Disparity (M - F)' },
      2: { type: 'fampboxw', title: 'Female Access to Family Planning by SDG Region' },
      3: { type: 'famplanmap', title: 'Women with Access to Adequate Family Planning' },
      4: { type: 'abrbarchart', title: 'Adolescent Birth Rate' },
      5: { type: 'dvmap', title: 'Women Subjected to Intimate Partner Violence' },
      6: { type: 'compplot', title: 'Family Planning Access vs Adolescent Birth Rate' },
      7: { type: 'dvmap', title: 'Women Subjected to Intimate Partner Violence' },
      8: { type: 'compplot', title: 'Family Planning Access vs Adolescent Birth Rate' },
      9: { type: 'compradar', title: 'Dimensions of Gender Inequality' }
    };
  
    // DOM elements
    const leftColumn = document.getElementById('left-column-content');
    const vizContainer = document.getElementById('visualization-container');
    const verses = document.querySelectorAll('.verse');
    const backwardButton = document.getElementById('backward-button');
    const forwardButton = document.getElementById('forward-button');
    
    // State variables
    let activeVerse = 1;
    const verseRefs = [];
    
    // Initialize verse refs
    verses.forEach(verse => {
      verseRefs.push(verse);
    });
    
    // Function to update active verse
    function updateActiveVerse(verseId) {
      // Reset previous active verse
      document.querySelectorAll('.verse').forEach(v => {
        v.classList.remove('active-verse');
      });
      document.querySelectorAll('.line').forEach(l => {
        l.classList.remove('active-line');
      });
      
      // Set new active verse
      const verse = document.getElementById(`verse${verseId}`);
      verse.classList.add('active-verse');
      
      // Set all lines in verse as active
      const lines = verse.querySelectorAll('.line');
      lines.forEach(line => {
        line.classList.add('active-line');
      });
      
      // Update active verse state
      activeVerse = verseId;
      
      // Update visualization
      updateVisualization(verseId);
    }
    
    // Function to scroll to active verse
    function scrollToVerse(verseId) {
      const verse = document.getElementById(`verse${verseId}`);
      const leftColumnRect = leftColumn.getBoundingClientRect();
      const verseRect = verse.getBoundingClientRect();
      
      const desiredScrollTop = verse.offsetTop - (leftColumnRect.height - verseRect.height) / 2;
      
      leftColumn.scrollTo({
        top: desiredScrollTop,
        behavior: 'smooth'
      });
    }
    
    // Function to update visualization based on active verse
    function updateVisualization(verseId) {
      // Clear previous visualization
      vizContainer.innerHTML = '';
      
      // Get visualization information
      const vizInfo = visualizations[verseId];
      
      // Create visualization container
      const visualization = document.createElement('div');
      visualization.className = 'visualization';
      
      // Add title
      const title = document.createElement('h3');
      title.className = 'viz-title';
      title.textContent = vizInfo.title;
      visualization.appendChild(title);
      
      // Create specific visualization based on type
      switch(vizInfo.type) {
        case 'ylcbarchart':
          createBarChart(visualization);
          break;
        case 'fampboxw':
          createBoxPlot(visualization);
          break;
        case 'famplanmap':
          createMap(visualization, false);
          break;
        case 'abrbarchart':
          createHorizontalBarChart(visualization);
          break;
        case 'dvmap':
          createMap(visualization, true);
          break;
        case 'compplot':
          createScatterPlot(visualization);
          break;
        case 'compradar':
          createRadarChart(visualization);
          break;
      }
      
      vizContainer.appendChild(visualization);
    }
    
    // Create bar chart
    function createBarChart(container) {
      const chart = document.createElement('div');
      chart.className = 'bar-chart';
      
      // Create bars with different heights
      const values = [60, 45, 75, 30, 50];
      const countries = ['Country A', 'Country B', 'Country C', 'Country D', 'Country E'];
      
      for (let i = 0; i < values.length; i++) {
        const barContainer = document.createElement('div');
        barContainer.style.display = 'flex';
        barContainer.style.flexDirection = 'column';
        barContainer.style.alignItems = 'center';
        
        const bar = document.createElement('div');
        bar.className = 'bar';
        bar.style.height = values[i] + '%';
        
        const label = document.createElement('div');
        label.style.marginTop = '5px';
        label.style.fontSize = '0.8rem';
        label.style.transform = 'rotate(-45deg)';
        label.textContent = countries[i];
        
        barContainer.appendChild(bar);
        barContainer.appendChild(label);
        chart.appendChild(barContainer);
      }
      
      // Add axes labels
      const xAxisLabel = document.createElement('div');
      xAxisLabel.style.textAlign = 'center';
      xAxisLabel.style.marginTop = '30px';
      xAxisLabel.textContent = 'Country';
      
      const yAxisLabel = document.createElement('div');
      yAxisLabel.style.position = 'absolute';
      yAxisLabel.style.left = '10px';
      yAxisLabel.style.top = '50%';
      yAxisLabel.style.transform = 'rotate(-90deg) translateX(-50%)';
      yAxisLabel.textContent = 'Gender Disparity (%)';
      
      container.appendChild(chart);
      container.appendChild(xAxisLabel);
      container.appendChild(yAxisLabel);
    }
    
    // Create box plot
    function createBoxPlot(container) {
      const plot = document.createElement('div');
      plot.className = 'box-plot';
      
      // Create regions with box plots
      const regions = ['Africa', 'Asia', 'Latin America', 'Europe', 'Oceania'];
      
      for (let i = 0; i < regions.length; i++) {
        const row = document.createElement('div');
        row.className = 'boxplot-row';
        
        const label = document.createElement('div');
        label.className = 'region-label';
        label.textContent = regions[i];
        
        const boxContainer = document.createElement('div');
        boxContainer.className = 'boxplot-container';
        
        // Position elements based on region
        const offset = i * 5;
        
        const min = document.createElement('div');
        min.className = 'boxplot-min';
        min.style.left = (10 + offset) + '%';
        
        const box = document.createElement('div');
        box.className = 'boxplot-box';
        box.style.left = (10 + offset) + '%';
        box.style.width = (40 - i * 2) + '%';
        
        const median = document.createElement('div');
        median.className = 'boxplot-median';
        median.style.left = (30 + offset) + '%';
        
        const max = document.createElement('div');
        max.className = 'boxplot-max';
        max.style.left = (60 - i) + '%';
        
        boxContainer.appendChild(min);
        boxContainer.appendChild(box);
        boxContainer.appendChild(median);
        boxContainer.appendChild(max);
        
        row.appendChild(label);
        row.appendChild(boxContainer);
        
        plot.appendChild(row);
      }
      
      container.appendChild(plot);
    }
    
    // Create map
    function createMap(container, isViolenceMap) {
      const mapContainer = document.createElement('div');
      mapContainer.className = isViolenceMap ? 'map-placeholder violence-map' : 'map-placeholder';
      
      // Simulate map with some labels
      const regions = ['Africa', 'Europe', 'Asia', 'Americas', 'Oceania'];
      const positions = [
        { left: '20%', top: '60%' },
        { left: '45%', top: '30%' },
        { left: '70%', top: '45%' },
        { left: '30%', top: '40%' },
        { left: '80%', top: '70%' }
      ];
      
      for (let i = 0; i < regions.length; i++) {
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.left = positions[i].left;
        label.style.top = positions[i].top;
        label.style.fontSize = '0.8rem';
        label.style.color = '#333';
        label.style.textShadow = '0 0 3px white';
        label.textContent = regions[i];
        
        mapContainer.appendChild(label);
      }
      
      // Add legend
      const legend = document.createElement('div');
      legend.style.position = 'absolute';
      legend.style.right = '10px';
      legend.style.bottom = '10px';
      legend.style.background = 'rgba(255, 255, 255, 0.7)';
      legend.style.padding = '5px';
      legend.style.borderRadius = '3px';
      legend.style.fontSize = '0.8rem';
      legend.innerHTML = `
        <div style="font-weight: bold">Legend</div>
        <div style="display: flex; align-items: center; margin-top: 5px;">
          <div style="width: 10px; height: 10px; background-color: ${isViolenceMap ? 'rgba(128, 0, 128, 0.8)' : 'rgba(220, 120, 140, 0.8)'}; margin-right: 5px;"></div>
          <div>High</div>
        </div>
        <div style="display: flex; align-items: center; margin-top: 3px;">
          <div style="width: 10px; height: 10px; background-color: ${isViolenceMap ? 'rgba(128, 0, 128, 0.3)' : 'rgba(220, 120, 140, 0.3)'}; margin-right: 5px;"></div>
          <div>Low</div>
        </div>
      `;
      
      mapContainer.appendChild(legend);
      container.appendChild(mapContainer);
    }
    
    // Create horizontal bar chart
    function createHorizontalBarChart(container) {
      const chart = document.createElement('div');
      chart.className = 'horizontal-bar-chart';
      
      // Create bars with different widths
      const countries = ['Country A', 'Country B', 'Country C', 'Country D', 'Country E'];
      const values = [75, 65, 85, 45, 35];
      
      for (let i = 0; i < countries.length; i++) {
        const row = document.createElement('div');
        row.className = 'h-bar-row';
        
        const label = document.createElement('div');
        label.className = 'country-label';
        label.textContent = countries[i];
        
        const bar = document.createElement('div');
        bar.className = 'h-bar';
        bar.style.width = values[i] + '%';
        
        const value = document.createElement('div');
        value.className = 'value-label';
        value.textContent = values[i];
        
        row.appendChild(label);
        row.appendChild(bar);
        row.appendChild(value);
        
        chart.appendChild(row);
      }
      
      // Add title for y-axis
      const yAxisTitle = document.createElement('div');
      yAxisTitle.style.textAlign = 'right';
      yAxisTitle.style.paddingRight = '20px';
      yAxisTitle.style.marginBottom = '10px';
      yAxisTitle.style.fontWeight = 'bold';
      yAxisTitle.textContent = 'Country';
      
      // Add title for x-axis
      const xAxisTitle = document.createElement('div');
      xAxisTitle.style.textAlign = 'center';
      xAxisTitle.style.marginTop = '15px';
      xAxisTitle.textContent = 'Births per 1,000 adolescents';
      
      container.appendChild(yAxisTitle);
      container.appendChild(chart);
      container.appendChild(xAxisTitle);
    }
    
    // Create scatter plot
    function createScatterPlot(container) {
      const plot = document.createElement('div');
      plot.className = 'scatter-plot';
      
      // Add dots with different positions
      const positions = [
        { x: 20, y: 70 },
        { x: 30, y: 60 },
        { x: 40, y: 50 },
        { x: 50, y: 40 },
        { x: 60, y: 30 },
        { x: 70, y: 20 },
        { x: 80, y: 15 }
      ];
      
      positions.forEach(pos => {
        const dot = document.createElement('div');
        dot.className = 'scatter-point';
        dot.style.left = pos.x + '%';
        dot.style.top = pos.y + '%';
        plot.appendChild(dot);
      });
      
      // Add trend line
      const trendLine = document.createElement('div');
      trendLine.className = 'trend-line';
      plot.appendChild(trendLine);
      
      // Add axis labels
      const xAxisLabel = document.createElement('div');
      xAxisLabel.style.position = 'absolute';
      xAxisLabel.style.bottom = '5px';
      xAxisLabel.style.left = '50%';
      xAxisLabel.style.transform = 'translateX(-50%)';
      xAxisLabel.style.fontSize = '0.8rem';
      xAxisLabel.textContent = 'Family Planning Access (%)';
      
      const yAxisLabel = document.createElement('div');
      yAxisLabel.style.position = 'absolute';
      yAxisLabel.style.left = '-35px';
      yAxisLabel.style.top = '50%';
      yAxisLabel.style.transform = 'translateY(-50%) rotate(-90deg)';
      yAxisLabel.style.fontSize = '0.8rem';
      yAxisLabel.textContent = 'Adolescent Birth Rate';
      
      plot.appendChild(xAxisLabel);
      plot.appendChild(yAxisLabel);
      
      // Add correlation information
      const correlationInfo = document.createElement('div');
      correlationInfo.style.position = 'absolute';
      correlationInfo.style.top = '10px';
      correlationInfo.style.right = '10px';
      correlationInfo.style.fontSize = '0.8rem';
      correlationInfo.style.background = 'rgba(255, 255, 255, 0.7)';
      correlationInfo.style.padding = '5px';
      correlationInfo.style.borderRadius = '3px';
      correlationInfo.innerHTML = '<strong>R² = 0.78</strong><br>Negative correlation';
      
      plot.appendChild(correlationInfo);
      container.appendChild(plot);
    }
    
    // Create radar chart
    function createRadarChart(container) {
      const radar = document.createElement('div');
      radar.className = 'radar-chart';
      
      // Add web lines
      for (let i = 1; i <= 4; i++) {
        const web = document.createElement('div');
        web.style.position = 'absolute';
        web.style.left = '50%';
        web.style.top = '50%';
        web.style.width = (i * 25) + '%';
        web.style.height = (i * 25) + '%';
        web.style.transform = 'translate(-50%, -50%)';
        web.style.border = '1px solid rgba(0, 0, 0, 0.1)';
        web.style.borderRadius = '50%';
        radar.appendChild(web);
      }
      
      // Add dimensions
      const dimensions = ['Education', 'Health', 'Employment', 'Safety', 'Decision-making'];
      const dimensionValues = [0.4, 0.6, 0.3, 0.7, 0.5]; // Values from 0 to 1
      
      for (let i = 0; i < dimensions.length; i++) {
        const angle = (i / dimensions.length) * 2 * Math.PI - Math.PI / 2;
        const x = 50 + 45 * Math.cos(angle);
        const y = 50 + 45 * Math.sin(angle);
        
        // Add axis
        const axis = document.createElement('div');
        axis.style.position = 'absolute';
        axis.style.left = '50%';
        axis.style.top = '50%';
        axis.style.width = '50%';
        axis.style.height = '1px';
        axis.style.backgroundColor = 'rgba(0, 0, 0, 0.2)';
        axis.style.transform = `translate(-50%, -50%) rotate(${angle * 180 / Math.PI}deg)`;
        axis.style.transformOrigin = 'left center';
        radar.appendChild(axis);
        
        // Add label
        const label = document.createElement('div');
        label.style.position = 'absolute';
        label.style.left = x + '%';
        label.style.top = y + '%';
        label.style.transform = 'translate(-50%, -50%)';
        label.style.fontSize = '0.8rem';
        label.textContent = dimensions[i];
        radar.appendChild(label);
        
        // Add data point
        const pointDist = dimensionValues[i] * 45;
        const pointX = 50 + pointDist * Math.cos(angle);
        const pointY = 50 + pointDist * Math.sin(angle);
        
        const point = document.createElement('div');
        point.style.position = 'absolute';
        point.style.left = pointX + '%';
        point.style.top = pointY + '%';
        point.style.width = '6px';
        point.style.height = '6px';
        point.style.backgroundColor = 'rgba(220, 120, 140, 0.8)';
        point.style.borderRadius = '50%';
        point.style.transform = 'translate(-50%, -50%)';
        radar.appendChild(point);
      }
      
      // Add data polygon
      const polygon = document.createElement('div');
      polygon.style.position = 'absolute';
      polygon.style.left = '50%';
      polygon.style.top = '50%';
      polygon.style.width = '100%';
      polygon.style.height = '100%';
      polygon.style.transform = 'translate(-50%, -50%)';
      
      // Create clip path for the polygon based on values
      let clipPath = 'polygon(';
      for (let i = 0; i < dimensions.length; i++) {
        const angle = (i / dimensions.length) * 2 * Math.PI - Math.PI / 2;
        const dist = dimensionValues[i] * 45;
        const x = 50 + dist * Math.cos(angle);
        const y = 50 + dist * Math.sin(angle);
        clipPath += `${x}% ${y}%`;
        if (i < dimensions.length - 1) clipPath += ', ';
      }
      clipPath += ')';
      
      polygon.style.clipPath = clipPath;
      polygon.style.backgroundColor = 'rgba(220, 120, 140, 0.3)';
      polygon.style.border = '1px solid rgba(220, 120, 140, 0.8)';
      
      radar.appendChild(polygon);
      container.appendChild(radar);
      
      // Add legend
      const legend = document.createElement('div');
      legend.style.marginTop = '20px';
      legend.style.fontSize = '0.8rem';
      legend.style.textAlign = 'center';
      legend.innerHTML = 'Gender equality index across different dimensions<br>(higher values indicate more equality)';
      
      container.appendChild(legend);
    }
    
    // Handle scroll events
    leftColumn.addEventListener('scroll', function() {
      // Calculate which verse is most centered in the viewport
      const scrollPosition = leftColumn.scrollTop;
      const viewportHeight = leftColumn.clientHeight;
      const centerPosition = scrollPosition + viewportHeight / 2;
      
      let closestVerse = 1;
      let minDistance = Infinity;
      
      verseRefs.forEach((verse, index) => {
        const versePosition = verse.offsetTop + verse.clientHeight / 2;
        const distance = Math.abs(versePosition - centerPosition);
        
        if (distance < minDistance) {
          minDistance = distance;
          closestVerse = index + 1;
        }
      });
      
      // Only update if verse changed
      if (closestVerse !== activeVerse) {
        updateActiveVerse(closestVerse);
      }
    });
    
    // Forward button click handler
    forwardButton.addEventListener('click', function() {
      if (activeVerse < verses.length) {
        updateActiveVerse(activeVerse + 1);
        scrollToVerse(activeVerse);
      }
    });
    
    // Backward button click handler
    backwardButton.addEventListener('click', function() {
      if (activeVerse > 1) {
        updateActiveVerse(activeVerse - 1);
        scrollToVerse(activeVerse);
      }
    });
    
    // Handle keyboard navigation
    document.addEventListener('keydown', function(e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        if (activeVerse < verses.length) {
          updateActiveVerse(activeVerse + 1);
          scrollToVerse(activeVerse);
        }
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        if (activeVerse > 1) {
          updateActiveVerse(activeVerse - 1);
          scrollToVerse(activeVerse);
        }
      }
    });
    
    // Initialize first verse as active
    updateActiveVerse(1);
    
    // Initial scroll position to show first verse
    setTimeout(() => {
      scrollToVerse(1);
    }, 200);
  });