const margin = {top: 20, right: 0, bottom: 20, left: 300},
    width = 1920 - margin.right - margin.left,
    height = 1080 - margin.top - margin.bottom;

let i = 0,
    duration = 200,
    root;

const tree = d3.layout.tree()
    .size([height, width]);

const svg = d3.select("body").append("svg")
    .attr("width", width + margin.right + margin.left)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

treeData[0].children.sort(GetSortOrder("name"));
root = treeData[0];
root.x0 = height / 2;
root.y0 = 0;

const treatment_nodes = root.children;
const num_treatments = treatment_nodes.length;
d3.select(self.frameElement).style("height", "1080px");
update(root);

for (i = 0; i < num_treatments; i++) {
    if (treatment_nodes[i].ranking > 2) {
        collapse(treatment_nodes[i]);
    }
}

function update(source) {

    // Compute the new tree layout.
    let nodes = tree.nodes(root).reverse(),
        links = tree.links(nodes);

    // Normalize for fixed-depth.
    nodes.forEach(function(d) { d.y = d.depth * 320; });

    // Update the nodes…
    let node = svg.selectAll("g.node")
        .data(nodes, function(d) { return d.id || (d.id = ++i); });

    // Init: enter any new nodes at the parent's previous position.
    let nodeEnter = node.enter().append("g")
        .attr("class", function (d) { return d.depth === 2 ? "node leaf" : "node"} )
        .attr("x", function (d) { return d.x; })
        .attr("y", function (d) { return d.y; })
        .attr("transform", "translate(" + source.y0 + "," + source.x0 + ")" )
        .on("click", click);

    nodeEnter.append("circle")
        .attr("r", 1e-6);

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
        .text(function(d) { return d.name; })
        .style("fill-opacity", 1e-6)
        .style("font-size", "16pt")
        .style("font-weight", function (d) { return d.ranking && d.ranking === 1 ? "bold" : "normal"; });

    nodeEnter.append("text")
        .attr("x", -20)
        .attr("dy", 8)
        .attr("text-anchor", function(d) { return "end"; })
        .text(function(d) { return "#" + d.ranking; })
        .style("fill-opacity", function (d) { return d.ranking ? ranking_to_opacity(d.ranking, num_treatments) : 0; })
        .style("font-size", "16pt")
        .style("font-weight", function (d) { return d.ranking && d.ranking === 1 ? "bold" : "normal"; });

    nodeEnter.append("text")
        .attr("x", 15)
        .attr("y", 8)
        .attr("dy", 6)
        /* Three possible captions: utility by hours or transitional probability
            determined by which layer the node is in in the tree
         */
        .text(function(d) { return d.depth === 1 ? `90-day mortality: ${Math.floor(d.mortality * 100)}%` : (
                                   d.depth === 3 ? `${d.tr_prob.toFixed(3)}`
                                                 : ''
        ); })
        .style("font-size", "12pt")
        .style("fill-opacity", function (d) { return d.ranking ? ranking_to_opacity(d.ranking, num_treatments) : 1; })
        .style("font-weight", function (d) { return d.ranking && d.ranking === 1 ? "bold" : "normal"; });

    // Bars for showing transitional probability
    nodeEnter.append("rect")
        .attr("x", -15)
        .attr("y", -10)
        .attr("height", function (d)  { return d.tr_prob ? d.tr_prob * 120 : 0 })
        .attr("width", function (d)  { return d.tr_prob ? 20 : 0 })
        .style("fill", function (d) {
            if (d.parent.children) {
                return d3.interpolateRdYlGn(1 - d.severity / d.parent.children.length);
            } else {
                return "#fff";
            }
        });
    // Transition nodes to their new position.
    var nodeUpdate = node.transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + d.y + "," + d.x + ")"; });

    // Draw circles; hide the circle at root node
    nodeUpdate.select("circle")
        .attr("r", 12)
        .style("fill", function(d) { return d._children ? "lightsteelblue" : "#fff"; })
        .style("opacity", function (d) { return d.ranking ? ranking_to_opacity(d.ranking, num_treatments) :
            (d.depth === 0 || d.depth === 3 ? 0 : 1); });

    nodeUpdate.select("text")
        .style("fill-opacity", function (d) { return d.ranking ? ranking_to_opacity(d.ranking, num_treatments) : 1; });

    // Transition exiting nodes to the parent's new position.
    var nodeExit = node.exit().transition()
        .duration(duration)
        .attr("transform", function(d) { return "translate(" + source.y + "," + source.x + ")"; })
        .remove();

    nodeExit.select("circle")
        .attr("r", 1e-6);

    nodeExit.select("text")
        .style("fill-opacity", 1e-6);

    // Update the links…
    let link = svg.selectAll("path.link")
        .data(links, function(d) { return d.target.id; });

    link.enter().insert("path", "g")
        .attr("class", "link")
        .attr("d", elbow);

    // Transition links to their new position.
    link.transition()
        .duration(duration)
        .attr("d", elbow);

    // Transition exiting nodes to the parent's new position.
    link.exit().transition()
        .duration(duration)
        .attr("d", function(d) {
            let o = {x: source.x, y: source.y};
            return elbow({source: o, target: o});
        })
        .remove();

    // Stash the old positions for transition.
    nodes.forEach(function(d) {
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
}

function collapse(d) {
   if (d.children) {
       d._children = d.children.slice();
       d.children = null;
       update(d);
   }
}

function click(d) {
    if (d.depth === 0) {
        hideAll(d);
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
}

function ranking_to_opacity(r, total) {
    if (r <= 1) {
        return 1;
    } else {
        return 0.2 + (1 - r / total) * 0.8;
    }
}

function elbow(d, i) {
    return "M" + d.source.y + "," + d.source.x
        + "H" + d.target.y + "V" + d.target.x
        + (d.target.children ? "" : "h" + margin.right);
}

