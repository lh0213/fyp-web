// Reference: https://observablehq.com/@d3/collapsible-tree?collection=@d3/d3-hierarchy
// Also: https://bl.ocks.org/d3noob/1a96af738c89b88723eb63456beb6510

// Constants and plotting helper functions
const margin = {top: 20, right: 0, bottom: 20, left: 300},
    width = 1920 - margin.right - margin.left,
    height = 1080 - margin.top - margin.bottom;
let i = 0;
let tree = d3.tree().size([height, width]);
let elbow = (s, d) => {
    return "M" + s.y + "," + s.x
        + "H" + d.y + "V" + d.x
        + (d.children ? "" : "h" + margin.right);
};

// chart {...}
treeData[0].children.sort(GetSortOrder("name"));
const root = d3.hierarchy(treeData[0], function(d) { return d.children; });
root.x0 = height / 2;
root.y0 = 0;
// root.descendants().forEach((d, i) => {
//     d.id = i;
//     d._children = d.children;
// });

const svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .call(d3.zoom().scaleExtent([1/2, 4])
        .extent([[margin.left, margin.top], [margin.left + width, margin.top + height]]).on("zoom", function () {
        svg.attr("transform", d3.event.transform)
    }));

const g = svg.append("g")
    .attr("transform", "translate("
        + margin.left + "," + margin.top + ")");

const treatment_nodes = root.children;
const num_treatments = treatment_nodes.length;
d3.select(self.frameElement).style("height", "1080px");

update(root);

for (i = 0; i < num_treatments; i++) {
    if (treatment_nodes[i].data.ranking > 2) {
        collapse(treatment_nodes[i]);
    }
}


function update(source) {

    let treeData = tree(root);

    const duration = d3.event && d3.event.altKey ? 2500 : 250;
    const nodes = treeData.descendants();
    const links = treeData.descendants().slice(1);
    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 320; });

    // Update the nodes…
    const node = svg.selectAll('g.node')
        .data(nodes, d => d.id || (d.id = ++i));

    // Init: enter any new nodes at the parent's previous position.
    const nodeEnter = node.enter().append("g")
        .attr('class', 'node')
        .attr("transform", d => `translate(${source.y0},${source.x0})`)
        .on("click", click);

    nodeEnter.append("circle")
        .attr("class", "node")
        .attr("r", 12)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
        .style("opacity", function (d) { return d.data.ranking ? ranking_to_opacity(d.data.ranking, 5) :
            (d.depth === 0 || d.depth === 3 ? 0 : 1); });

    nodeEnter.append("rect")
        .attr("x", -16)
        .attr("y", -16)
        .attr("width", 32)
        .attr("height", 32)
        .style("opacity", function(d) { return d.depth === 0 ? 1 : 0})
        .style("fill", "lightsteelblue");

    nodeEnter.append("text")
        .attr("x", 15)
        .attr("dy", -6)
        .attr("text-anchor", function(d) { return "start"; })
        .text(function(d) { return d.data.name; })
        .style("fill-opacity", 1e-6)
        .style("font-size", "16pt")
        .style("font-weight", function (d) { return d.data.ranking && d.data.ranking === 1 ? "bold" : "normal"; });

    nodeEnter.append("text")
        .attr("x", -20)
        .attr("dy", 8)
        .attr("text-anchor", function(d) { return "end"; })
        .text(function(d) { return "#" + d.data.ranking; })
        .style("fill-opacity", function (d) { return d.data.ranking ? ranking_to_opacity(d.data.ranking, num_treatments) : 0; })
        .style("font-size", "16pt")
        .style("font-weight", function (d) { return d.data.ranking && d.data.ranking === 1 ? "bold" : "normal"; });

    nodeEnter.append("text")
        .attr("x", 15)
        .attr("y", 8)
        .attr("dy", 6)
        /* Three possible captions: utility by hours or transitional probability
            determined by which layer the node is in in the tree
         */
        .text(function(d) { return d.depth === 1 ? `90-day mortality: ${Math.floor(d.data.mortality * 100)}%` : (
                                   d.depth === 3 ? `${d.data.tr_prob.toFixed(3)}`
        : ''
        ); })
        .style("font-size", "12pt")
        .style("fill-opacity", function (d) { return d.data.ranking ? ranking_to_opacity(d.data.ranking, num_treatments) : 1; })
        .style("font-weight", function (d) { return d.data.ranking && d.data.ranking === 1 ? "bold" : "normal"; });

    // Bars for showing transitional probability
    // nodeEnter.append("rect")
    //     .attr("x", -15)
    //     .attr("y", -10)
    //     .attr("height", function (d)  { return d.tr_prob ? d.tr_prob * 120 : 0 })
    //     .attr("width", function (d)  { return d.tr_prob ? 20 : 0 })
    //     .style("fill", function (d) {
    //         if (d.parent.children) {
    //             return d3.interpolateRdYlGn(1 - d.severity / d.parent.children.length);
    //         } else {
    //             return "#fff";
    //         }
    //     });

    // Transition nodes to their new position.
    const nodeUpdate = nodeEnter.merge(node);
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
    const link = svg.selectAll('path.link')
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
       d.children = d._children.slice();
       d._children = null;
       update(d);
   }
   isHideAll = false;
}

function collapse(d) {
   if (d.children) {
       d._children = d.children.slice();
       d.children = null;
       update(d);
   }
}

let isHideAll = false;
function click(d) {
    if (d.depth === 0) {
        if (!isHideAll) {
            hideAll(d);
        } else {
            showAll(d);
        }
    } else if (d.depth === 1) {
        // Show complete subtree
        if (d._children) {
            expand(d);
            for (i = 0; i < d.children.length; i++) {
                expand(d.children[i]);
            }
        } else {
            collapse(d);
        }
    } else if (d.depth === 2) {
        toggle(d);
    }
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
