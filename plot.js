// Reference: https://observablehq.com/@d3/collapsible-tree?collection=@d3/d3-hierarchy
// Also: https://bl.ocks.org/d3noob/1a96af738c89b88723eb63456beb6510

/* Dimensions and base */
/* ------------------- */

const margin = {
    top: window.innerHeight * 0.05,
    left: window.innerWidth * 0.2,
    bottom: window.innerHeight * 0.05,
    right: 10
};

// The chart and screen height.
const chartHeight = 2000;
const screenHeight = window.innerHeight - margin.top - margin.bottom;

// The full width
const chartWidth = 2000;
const screenWidth = window.innerWidth - margin.left - margin.right;

// Tree nodes depth
const depth = 320;
const treeRootX = chartWidth / 10;
const treeRootY = chartHeight / 2;

let i = 0;
let tree = d3.tree().size([chartHeight, chartWidth]);
let elbow = (s, d) => {
    return "M" + s.y + "," + s.x
        + "H" + d.y + "V" + d.x
        + (d.children ? "" : "h" + margin.right);
};

// chart {...}
tree_data[0].children.sort(getSortOrder("name"));
const root = d3.hierarchy(tree_data[0], function(d) { return d.children; });
root.x0 = treeRootX;
root.y0 = treeRootY;

// Default viewbox size
let vx = -20;
let vy = chartHeight / 2 - screenHeight / 4;
let vw = screenWidth - vx;
let vh = screenHeight - vy;

let defaultView = "" + vx + " " + vy + " " + vw + " " + vh;

const svg = d3.select("#svg").append("svg")
    .attr('width', screenWidth)
    .attr('height', screenHeight)
    .attr("viewBox", defaultView)
    .attr("preserveAspectRatio", "xMinYMid meet");

// Zooming listener
const listenerRect = svg
    .append('rect')
    .attr('class', 'listener-rect')
    .attr('x', 0)
    .attr('y', 0)
    .attr('width', chartWidth)
    .attr('height', chartHeight)
    .style('opacity', 0);
    // .style('fill', 'aliceblue') // check the area it covers!
    // .style('opacity', 0.5);

const gTree = svg.insert('g').attr('class', 'tree');

const treatment_nodes = root.children;
const num_treatments = treatment_nodes.length;
d3.select(self.frameElement).style("height", "1080px");

// Define the zoom behaviour
const zoom = d3.zoom()
    .scaleExtent([0.1, 20])
    .translateExtent([[0, 0], [chartWidth, chartHeight]])
    .on('zoom', zoomed);

// Listen for zoom events
listenerRect.call(zoom);

// Zoom function
function zoomed() {
    // Get the transform
    const transform = d3.event.transform;
    transform.x = Math.min(transform.x, 0);

    // Move everything (geometric)
    gTree.attr('transform', transform.toString());
}

function zoom_to_everything() {
    vx = -20;
    vy = 0;
    vw = chartWidth - vx;
    vh = chartHeight - vy;

    defaultView = "" + vx + " " + vy + " " + vw + " " + vh;
    svg.attr("viewBox", defaultView);
    gTree.attr('transform', `translate(${vx},${vy}) scale(1)`);
}

document.getElementById("diagnosis-label").innerText += tree_data[0].diagnosis;
document.getElementById("diagnosis-href").setAttribute("href", "sensitivity.html?var=" + tree_data[0].diagnosis);

treatment_nodes.forEach(treatment_node => {
    if (treatment_node.data.ranking > 2) {
        collapse(treatment_node);
    }

    if (treatment_node.children) {
        treatment_node.children.forEach((c) => {
            if (!c.data.diagnosis) {
                collapse(c);
            }
        });
    } else {
        treatment_node._children.forEach((c) => {
            if (!c.data.diagnosis) {
                collapse(c);
            }
        });
    }
});

update(root);

function update(source) {

    let treeData = tree(root);

    const duration = d3.event && d3.event.altKey ? 2500 : 250;
    const nodes = treeData.descendants();
    const links = treeData.descendants().slice(1);
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * depth; });

    // Update the nodes…
    const node = gTree.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));

    // Init: enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter().append("g")
        .attr('class', d => { return d.depth == 0 ? 'node root' :
                                        d.depth === 2 ? 'node prob-root' :
                                        d.depth === 3 ? 'node leaf' : 'node'})
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .on("click", click);

    // Circle: clickable nodes
    nodeEnter.append("circle")
        .attr("class", "node")
        .attr("r", 12)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
        .style("opacity", function (d) { return d.data.ranking ? ranking_to_opacity(d.data.ranking, 5) :
            (d.depth === 0 || d.depth === 3 ? 0 :
                d.children || d._children ? 1 : 0); });

    // Square root node
    nodeEnter.append("rect")
        .attr("x", -16)
        .attr("y", -16)
        .attr("width", 32)
        .attr("height", 32)
        .style("opacity", function(d) { return d.depth === 0 ? 1 : 0})
        .style("fill", "lightsteelblue");

    // Show name for each node (above the line)
    nodeEnter.append("text")
        .attr("x", -15)
        .attr("dy", -6)
        .attr("text-anchor", function(d) { return "end"; })
        .text(function(d) { return d.data.name; })
        .style("fill-opacity", 1e-6)
        .style("font-size", "16pt")
        .style("font-weight", function (d) { return d.data.ranking && d.data.ranking === 1 ? "bold" : "normal"; });

    // Show ranking of treatments (left to the node)
    nodeEnter.append("text")
        .attr("x", 20)
        .attr("dy", 8)
        .attr("text-anchor", function(d) { return "start"; })
        .text(function(d) { return "#" + d.data.ranking; })
        .style("fill-opacity", function (d) { return d.data.ranking ? ranking_to_opacity(d.data.ranking, num_treatments) : 0; })
        .style("font-size", "16pt")
        .style("font-weight", function (d) { return d.data.ranking && d.data.ranking === 1 ? "bold" : "normal"; });

    /* Three possible captions below the line (determined by depth of node):
        (1) utility (currently 90-day mortality rate
        (2) diagnosis probability
        (3) transitional probability
   */
    nodeEnter.append("text")
        .attr("x", -15)
        .attr("y", 8)
        .attr("dy", 6)
        .attr("text-anchor", function(d) { return "end"; })
        .text(function(d) { return d.depth === 1 ? `90-day mortality: ${Math.floor(d.data.mortality * 100)}%` :
                                    d.depth === 2 ? `${d.data.diagnosis_prob}`:
                                   d.depth === 3 ? `${d.data.tr_prob.toFixed(3)}`
                                    : ''
        ; })
        .style("font-size", "12pt")
        .style("fill-opacity", function (d) { return d.data.ranking ? ranking_to_opacity(d.data.ranking, num_treatments) : 1; })
        .style("font-weight", function (d) { return d.data.ranking && d.data.ranking === 1 ? "bold" : "normal"; });

    plot_bar_charts(gTree);
    // nodeEnter.append("rect")
    //     .attr("x", -15)
    //     .attr("y", -10)
    //     .attr("height", function (d)  { return d.data.tr_prob ? d.data.tr_prob * 120 : 0 })
    //     .attr("width", function (d)  { return d.data.tr_prob ? 20 : 0 })
    //     .style("fill", function (d) {
    //         if (d.depth === 3 && d.parent && d.parent.children) {
    //             return d3.interpolateRdYlGn(1 - d.data.severity / d.parent.children.length);
    //         } else {
    //             return "#fff";
    //         }
    //     });

    const nodeRoot = gTree.selectAll('g.root');

    // Transition nodes to their new position.
    const nodeUpdate = nodeEnter.merge(node);

    // Update the node attributes and style
    nodeUpdate.select('circle.node')
        .attr('r', 12)
        .style("fill", function(d) {
            return d._children ? "lightsteelblue" : "#fff";
        })
        .attr('cursor', 'pointer');

    nodeUpdate.transition()
        .duration(duration)
        .attr("transform", d => `translate(${d.y},${d.x})`)
        .attr("fill-opacity", 1)
        .attr("stroke-opacity", 1);

    nodeUpdate.select("text")
        .style("fill-opacity", function (d) { return d.data.ranking ? ranking_to_opacity(d.data.ranking, num_treatments) : 1; });

    // Transition exiting nodes to the parent's new position.
    const nodeExit = node.exit().transition().duration(duration)
        .attr("transform", d => `translate(${source.y},${source.x})`)
        .attr("fill-opacity", 0)
        .attr("stroke-opacity", 0)
        .remove();

    // Update the links…
    const link = gTree.selectAll('path.link')
        .data(links, d => d.id);

    const linkEnter = link.enter().insert('path', "g")
        .attr("class", "link")
        .attr('d', function(d){
            const o = {x: source.x0, y: source.y0};
            return elbow(o, o)
        });

    // Transition links to their new position.
    const linkUpdate = linkEnter.merge(link);

    // Transition back to the parent element position
    linkUpdate.transition()
        .duration(duration)
        .attr('d', function(d){ return elbow(d, d.parent) });

    // Remove any exiting links
    const linkExit = link.exit().transition()
        .duration(duration)
        .attr('d', function(d) {
            const o = {x: source.x, y: source.y};
            return elbow(o, o)
        })
        .remove();

    // Stash the old positions for transition.
    root.eachBefore(d => {
        d.x0 = d.x;
        d.y0 = d.y;
    });
}

// Toggle children on click.
function toggle(d) {
    if (d.children) {
        collapse(d);
    } else {
        expand(d);
    }
}

function expand(d) {
   if (d._children) {
       d.children = d._children;
       d._children = null;
   }
   isHideAll = false;
}

function collapse(d) {
   if (d.children) {
       d._children = d.children;
       d.children = null;
   }
}

let isHideAll = false;
function click(d) {
    if (d.depth === 0) {
        if (!isHideAll) {
            hideAll(d);
            zoom_to_everything();
        } else {
            showAll(d);
        }
    } else if (d.depth === 1) {
        // Show complete subtree only for diagnosis
        if (d._children) {
            expand(d);
            d.children.forEach((c) => {
                if (c.data.diagnosis) {
                    expand(c);
                } else {
                    collapse(c);
                }
            });
        } else {
            collapse(d);
        }
    } else {
        toggle(d);
    }
    update(d);
}

function hideAll(r) {
    // Should only be called on root node
    if (r.children) {
        for (i = 0; i < r.children.length; i++) {
            let c = r.children[i];
            if (c.children) {
                click(c);
            }
        }
    }
    isHideAll = true;
}

function showAll(r) {
    // Should only be called on root node
    if (r.children) {
        for (i = 0; i < r.children.length; i++) {
            let c = r.children[i];
            expand(c);
        }
    }
}

function ranking_to_opacity(r, total) {
    if (r <= 1) {
        return 1;
    } else {
        return 0.2 + (1 - r / total) * 0.8;
    }
}

function prepare_stacked_bar_chart_data(d) {
    if (d.depth !== 2 || !d.children) {
        return [];
    }
    let re = {};
    let keys = [];
    d.children.forEach((c, i) => {
        re[c.data.name] = c.data.tr_prob;
        keys.push(c.data.name)
    });
    let stack = d3.stack().keys(keys).order(d3.stackOrderNone).offset(d3.stackOffsetNone);
    return stack([re]);
}

function plot_bar_charts(svg) {
    // Bars for showing transitional probability
    svg.selectAll(".prob-root").each(function(d, i) {
        let data = prepare_stacked_bar_chart_data(d);
        let keys = [];
        if (d.children) {
            d.children.forEach(c => keys.push(c.data.name));
        }
        let color = d3.scaleOrdinal()
            .domain(keys.reverse())
            .range(d3.schemeSpectral[Math.max(keys.length, 3)])
            .unknown("#ccc");
        // let x = d3.scaleBand()
        //     .domain()
        //     .range([margin.top, height - margin.bottom])
        //     .padding(0.08);
        let y_begin = 0, y_end = 0;
        if (d.children) {
            // TODO: why is x instead of y?
            y_begin = d.children[0].x;
            y_end = d.children[d.children.length - 1].x;
        }
        let bar_h = y_end - y_begin;
        let y_scaler = d3.scaleLinear().range([0, bar_h]);
        let x0 = d.x;
        let y0 = d.y;
        const bar = d3.select(this).selectAll("rect")
            .data(data);
        bar.enter().append("rect")
            .attr("fill", d => color(d.key))
            // .selectAll("rect")
            // .data(d => d)
            // .join("rect")
            .attr("x", depth / 2)
            .attr("y", d => y_scaler(d[0][0]) - bar_h / 2 )
            .attr("width", depth / 2)
            .attr("height", d => y_scaler(d[0][1] - d[0][0]));
        // .append("title")
        // .text(d => `${d.data.name} ${d.key}
        bar.exit().remove();
    });
}
