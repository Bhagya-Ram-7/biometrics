let data;
d3.json("data/biometric_grades.json").then(loadedData => {
    console.log(loadedData);
    data = loadedData;
    
    populateDropdowns(); 
    const defaultBiometric = d3.select("#biometricDropdown").node().value;
    const defaultExam = d3.select("#examDropdown").node().value;
    updateChart(data, defaultBiometric, defaultExam); 
});

const margin = {top: 20, right: 30, bottom: 50, left: 50};
const width = 600 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

const svg = d3.select("#scatterplot")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

const biometricDropdown = d3.select("#biometricDropdown");
const examDropdown = d3.select("#examDropdown");

function populateDropdowns() {
    const biometricOptions = ["Temperature", "Electradermal Activity", "Heart Rate", "IBI"];
    const examOptions = ["Midterm 1", "Midterm 2", "Final"];
    biometricDropdown.selectAll("option").remove();
    examDropdown.selectAll("option").remove();
    biometricOptions.forEach(option => biometricDropdown.append("option").text(option).attr("value", option));
    examOptions.forEach(option => examDropdown.append("option").text(option).attr("value", option));
    biometricDropdown.on("change", () => updateChart(data, biometricDropdown.node().value, examDropdown.node().value));
    examDropdown.on("change", () => updateChart(data, biometricDropdown.node().value, examDropdown.node().value));
}

function updateChart(data, selectedBiometric, selectedExam) {
    const svgGroup = d3.select("#scatterplot g");
    svgGroup.selectAll("*").remove(); 

    const xExtent = d3.extent(data, d => d.biometric[selectedBiometric][selectedExam]);
    const xPadding = (xExtent[1] - xExtent[0]) * 0.1; 

    const xScale = d3.scaleLinear()
        .domain([xExtent[0] - xPadding, xExtent[1] + xPadding])
        .range([50, 550]);

    const yScale = d3.scaleLinear()
        .domain([0, 100])  
        .range([350, 50]);

        svgGroup.selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", d => xScale(d.biometric[selectedBiometric][selectedExam]))
        .attr("cy", d => yScale(d.grades[selectedExam]))
        .attr("r", 6)
        .attr("fill", "blue")
        .on("mouseover", (event, d) => {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 10); //dot becomes enlarged when hovering over it
            d3.select("#tooltip").style("display", "block")
                .html(`${d.student}: ${d.biometric[selectedBiometric][selectedExam]}, Grade: ${d.grades[selectedExam]}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 10) + "px");
        })
        .on("mouseout", function() {
            d3.select(this)
                .transition()
                .duration(200)
                .attr("r", 6);
                d3.select("#tooltip").style("display", "none");
        });
        svgGroup.append("g")
        .attr("transform", "translate(0,350)")
        .call(d3.axisBottom(xScale));

    svgGroup.append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(yScale));


    svgGroup.append("text")
        .attr("class", "x axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom )
        .text(selectedBiometric);

    svgGroup.append("text")
        .attr("class", "y axis-label")
        .attr("text-anchor", "middle")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -margin.left + 60)
        .text(selectedExam);

    const xValues = data.map(d => d.biometric[selectedBiometric][selectedExam]);
    const yValues = data.map(d => d.grades[selectedExam]);
    function linearRegression(x, y) {
        const n = x.length;
        const sumX = d3.sum(x);
        const sumY = d3.sum(y);
        const sumXY = d3.sum(x.map((xi, i) => xi * y[i]));
        const sumX2 = d3.sum(x.map(xi => xi * xi));
        const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        return { slope, intercept };}
    const { slope, intercept } = linearRegression(xValues, yValues);

    const x1 = xExtent[0] - xPadding;
    const y1 = slope * x1 + intercept;

    const x2 = xExtent[1] + xPadding;
    const y2 = slope * x2 + intercept;
    svgGroup.append("line")
        .attr("x1", xScale(x1))
        .attr("y1", yScale(y1))
        .attr("x2", xScale(x2))
        .attr("y2", yScale(y2))
        .attr("stroke", "red")
        .attr("stroke-width", 2);
}

const tooltip = d3.select("body").append("div")
    .attr("id", "tooltip")
    .style("position", "absolute")
    .style("background", "lightgrey")
    .style("padding", "5px")
    .style("display", "none");
