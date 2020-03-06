var svg = d3.select("#svg")
    .append("svg")
    .attr("width", 1000)
    .attr("height", 200)

// Create the scale
var x = d3.scaleLog()
    .domain([1,1000])         // This is what is written on the Axis: from 0 to 100
    .range([100, 800])       // This is where the axis is placed: from 100 px to 800px
    .base(10)

// Draw the axis
svg
    .append("g")
    .attr("transform", "translate(0,150)")      // This controls the vertical position of the Axis
    .call(d3.axisBottom(x).tickFormat(d3.format(".2")))
