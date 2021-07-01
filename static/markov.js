let s = Snap("#svgout");
let nodes = {};
let arcs = {};
let selectedNodes = {};
let selectedArcs = {};
let startNode;
let animObj;
let arcsTable = document.getElementById("arcsTable").getElementsByTagName('tbody')[0];
let nodesTable = document.getElementById("nodesTable").getElementsByTagName('tbody')[0];
let animating = false;
let animTotal = 0;
let animSpeed = 200 * 3;

// Drag and drop functions
const moveNode = function (dx, dy) {
    this.attr({
        transform: this.data('origTransform') + (this.data('origTransform') ? "T" : "t") + [dx, dy]
    });
    let coords = this.getBBox()
    nodes[this.id].move(coords.cx, coords.cy);
};
const start = function () {
    this.data('origTransform', this.transform().local);
};
const stop = function () {
};

const changeSpeed = function (spd) {
    animSpeed = 200 * spd;
}

// for getting the lengths of nodes, arcs and selectedNodes
const getLen = function (obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

// for getting the last element of objects
// https://stackoverflow.com/a/16590272/10932589
const getLastElem = function (obj) {
    return obj[Object.keys(obj)[Object.keys(obj).length - 1]];
}


// click function
const clickNode = function (event) {
    // selects only in the event of a double click
    if (event.detail === 2) {
        nodes[this.id].select();
        if (nodes[this.id].selected) {
            togglePanel("selectedNodePanel", "open");
            document.getElementById("selectedNodeId").innerText = this.id;
            document.getElementById("nodeNameSelected").value = nodes[this.id].name;
            if (startNode === nodes[this.id]) {
                document.getElementById("startNode").checked = true;
            } else {
                document.getElementById("startNode").checked = false;
            }
        } else {
            togglePanel("selectedNodePanel");
        }
    }
};

const clickArc = function (event) {
    if (event.detail === 2) {
        arcs[this.ofArc].select();
        if (arcs[this.ofArc].selected) {
            togglePanel("selectedArcPanel", "open");
            document.getElementById("selectedArcId").innerText = this.ofArc;
            document.getElementById("probSelected").value = arcs[this.ofArc].prob.toFixed(2);
            document.getElementById("pos" + arcs[this.ofArc].selfDirection.toFixed(2)).checked = true;
        } else {
            togglePanel("selectedArcPanel");
        }
    }
}

// node creation
const createNode = function (newNodeName, x = 35, y = 35) {
    let createdNode = new Node(newNodeName, x, y);
    if (getLen(nodes) === 0) {
        startNode = createdNode;
    }
    createdNode.draw();
    let newRow = nodesTable.insertRow(nodesTable.rows.length);
    newRow.innerHTML = `<td>${createdNode.id}</td>
                        <td id="row_${createdNode.id}_name">${createdNode.name}</td>
                        <td id="row_${createdNode.id}_count">0</td>
                        <td id="row_${createdNode.id}_pct">0%</td>`;
    newRow.id = "row_" + createdNode.id;
    return createdNode;
};

const createNodeFromPanel = function () {
    let newNodeName = document.getElementById("nodeNameCreate").value;
    createNode(newNodeName);
    togglePanel("createNodePanel");
}

// node updating
const updateNode = function () {
    let nodeId = document.getElementById("selectedNodeId").innerText;
    nodes[nodeId].name = document.getElementById("nodeNameSelected").value;
    nodes[nodeId].text.attr({'text': nodes[nodeId].name});
    document.getElementById(`row_${nodeId}_name`).innerHTML = nodes[nodeId].name;
    for (let arc of nodes[nodeId].connectedArcs) {
        if (arc.from === nodes[nodeId]) {
            document.getElementById(`row_${arc.id}_from`).innerText = nodes[nodeId].name;
        }
        if (arc.to === nodes[nodeId]) {
            document.getElementById(`row_${arc.id}_to`).innerText = nodes[nodeId].name;
        }
    }
    if (document.getElementById("startNode").checked) {
        startNode = nodes[nodeId];
    } else {
        if (startNode === nodes[nodeId]) {
            startNode = "";
        }
    }
}

const verifyStates = function () {
    for (let key in nodes) {
        let compoundedArcs = [];
        let comp = 0.0;

        for (let arc of nodes[key].connectedArcs) {
            if (arc.from === nodes[key]) {
                if (!compoundedArcs.includes(arc)) {
                    comp += arc.prob;
                    compoundedArcs.push(arc);
                }
            }
        }

        if (comp !== 1.0) {
            alert(`The probability of outgoing arcs from Node: ${nodes[key].name} should have a total value of 1.0`);
            return false;
        }
    }
    return true;
}

const updateArc = function () {
    let arcId = document.getElementById("selectedArcId").innerText;
    arcs[arcId].prob = parseFloat(document.getElementById("probSelected").value);
    arcs[arcId].text.attr({text: arcs[arcId].prob.toFixed(2)});
    document.getElementById(`row_${arcId}_prob`).innerText = arcs[arcId].prob.toFixed(2);
    arcs[arcId].rotate(parseFloat(document.querySelector('input[name="direction"]:checked').value));
}

// panel controls
const togglePanel = function (panel_id, force = "") {
    let panel = document.getElementById(panel_id);
    if (force) {
        if (force === "open") {
            panel.hidden = false;
        } else if (force === "close") {
            panel.hidden = true;
        }
    } else {
        if (panel_id === 'selectedNodePanel' && getLen(selectedNodes) > 0) {
            let lastElem = getLastElem(selectedNodes);
            document.getElementById("selectedNodeId").innerText = lastElem.id;
            document.getElementById("nodeNameSelected").value = nodes[lastElem.id].name;
        } else if (panel_id === 'selectedArcPanel' && getLen(selectedArcs) > 0) {
            let lastElem = getLastElem(selectedArcs);
            document.getElementById("selectedArcId").innerText = lastElem.id;
            document.getElementById("probSelected").value = arcs[lastElem.id].prob.toFixed(2);
            document.getElementById("pos" + arcs[lastElem.id].selfDirection.toFixed(2)).checked = true;
        } else {
            panel.hidden = !panel.hidden;
        }
    }
}

const createArcRow = function (arc) {
    let newRow = arcsTable.insertRow(arcsTable.rows.length);
    newRow.innerHTML = `<td>${arc.id}</td>
                        <td id="row_${arc.id}_from">${arc.from.name}</td>
                        <td id="row_${arc.id}_to">${arc.to.name}</td>
                        <td id="row_${arc.id}_prob">${arc.prob.toFixed(2)}</td>`;
    newRow.id = "row_" + arc.id;
}

// arc creation function
const createArc = function (from, to, prob, dir = 0.5) {
    let createdArc = new Arc(from, to, prob, dir);
    createdArc.draw();
    createArcRow(createdArc);
}

const createArcFromPanel = function () {
    if (getLen(selectedNodes) === 2) {
        let prob = parseFloat(window.prompt("Probability of the transition", "0.0"));
        let fromId = Object.keys(selectedNodes)[0];
        let toId = Object.keys(selectedNodes)[1];
        createArc(nodes[fromId], nodes[toId], prob);
    } else if (getLen(selectedNodes) === 1) {
        let prob = parseFloat(window.prompt("Probability of the transition", "0.0"));
        let fromId = Object.keys(selectedNodes)[0];
        createArc(nodes[fromId], nodes[fromId], prob);
    } else {
        alert('You need to select 1 or 2 nodes to add an arc.');
    }
}

// removes all references to the arc and deletes the snap object from the canvas
const deleteArc = function (arc) {
    togglePanel("selectedArcPanel", "close");
    let fromIndex = arc.from.connectedArcs.indexOf(arc);
    let toIndex = arc.to.connectedArcs.indexOf(arc);
    delete selectedArcs[arc.id];
    arc.from.connectedArcs.splice(fromIndex, 1);
    arc.to.connectedArcs.splice(toIndex, 1);
    document.getElementById(`row_${arc.id}`).remove();
    delete arcs[this.id];
    arc.object.remove();
    arc.arrowHeads[0].remove();
    arc.arrowHeads[1].remove();
    arc.textBox.remove();
    arc.text.remove();
    delete arc.arrowHeads;
    delete arc.object;
}

// deletes connected arcs to the node, and removes all references to the node
const deleteNode = function (node) {
    // If I do this once, the last added arc to that node is not deleted.
    // After a couple of hours troubleshooting this issue, I found this solution (it's ugly, I know)
    for (let arc of node.connectedArcs) {
        deleteArc(arc);
    }
    for (let arc of node.connectedArcs) {
        deleteArc(arc);
    }
    node.select();
    document.getElementById(`row_${node.id}`).remove();
    delete selectedNodes[node.id];
    delete nodes[node.id];
    node.text.remove();
    node.object.remove();
    delete node.object;
    togglePanel("selectedNodePanel");
}


const getNextNode = function (node) {
    let compound = 0.0;
    let dice = Math.random();
    let compoundedArcs = [];
    for (let arc of node.connectedArcs) {
        if (arc.from === node && !compoundedArcs.includes(arc)) {
            if ((compound + arc.prob) >= dice) {
                return arc.to;
            } else {
                compound += arc.prob;
                compoundedArcs.push(arc);
            }
        }
    }
}
const clearTable = function () {
    for (let key in nodes) {
        let currNode = nodes[key];
        document.getElementById(`row_${currNode.id}_count`).innerHTML = "0";
        document.getElementById(`row_${currNode.id}_pct`).innerHTML = "0%";
    }
}

const startAnimation = function () {
    clearTable();

    animating = true;
    animateBtwNodes(startNode, getNextNode(startNode));
}
const stopAnimation = function () {
    animating = false;
    animTotal = 0;
}
const updateTable = function (node) {
    animTotal += 1;
    for (let key in nodes) {
        let countElem = document.getElementById(`row_${key}_count`);
        let pctElem = document.getElementById(`row_${key}_pct`);
        let count = parseInt(countElem.innerHTML);
        if (key === node.id) {
            count += 1;
            countElem.innerHTML = count.toString();
        }
        pctElem.innerHTML = ((count / animTotal) * 100).toFixed(1) + "%";
    }
}
const animateBtwNodes = function (fromNode, toNode) {
    updateTable(toNode);
    let speed = animSpeed;
    let arcBtw;
    let xCum;
    let yCum;
    animObj = s.circle(fromNode.pos_x, fromNode.pos_y, 10).attr({fill: "blue", id: "animObj", visibility: "visible"});
    for (let arc of fromNode.connectedArcs) {
        if (arc.from === fromNode && arc.to === toNode) {
            arcBtw = arc;
        }
    }
    let len = Snap.path.getTotalLength(arcBtw.pathStr);


    let animAlongPath = function () {
        Snap.animate(0, len, function (value) {
            let movePoint = Snap.path.getPointAtLength(arcBtw.pathStr, value);
            animObj.attr({cx: movePoint.x - xCum, cy: movePoint.y - yCum});
        }, speed, mina.linear, function () {
            let coords = animObj.getBBox();
            // removing and re-adding the animated object because the positions get messed up after animating along path.
            animObj.remove();
            animObj = s.circle(coords.cx, coords.cy, 10).attr({fill: "blue", id: "animObj", visibility: "visible"});
            animObj.animate({transform: "T" + (toNode.pos_x - coords.cx).toFixed(2) + " " + (toNode.pos_y - coords.cy).toFixed(2)}, speed / 5, mina.linear, function () {
                animObj.remove();
                if (animating) {
                    animateBtwNodes(toNode, getNextNode(toNode));
                }
            });
        });
    }
    xCum = (arcBtw.startX - fromNode.pos_x);
    yCum = (arcBtw.startY - fromNode.pos_y);
    animObj.animate({transform: "T" + xCum.toFixed(2) + " " + yCum.toFixed(2)}, speed / 5, mina.linear, animAlongPath)
}

class Node {
    constructor(name, pos_x, pos_y) {
        this.pos_x = pos_x;
        this.pos_y = pos_y;
        this.name = name;
    }

    id = -1;
    object = 0;
    radius = 30;
    selected = false;
    connectedArcs = [];
    text;

    draw() {
        // this.id = Object.keys(nodes).length;
        this.object = s.circle(this.pos_x, this.pos_y, this.radius).attr({
            stroke: '#000000',
            'strokeWidth': 1.5,
            strokeOpacity: 0.7,
            fill: 'lightpink',
        });
        this.id = this.object.id;
        nodes[this.id] = this;
        this.object.drag(moveNode, start, stop);
        this.object.click(clickNode);
        this.text = s.text(this.pos_x, this.pos_y, this.name);
        this.text.attr({'text-anchor': 'middle', fontSize: '12px',});
    }

    move(dx, dy) {
        this.pos_x = dx;
        this.pos_y = dy;
        for (let arc of this.connectedArcs) {
            arc.redraw();
        }
        this.text.animate({x: dx, y: dy}, 0);
    }

    select() {
        if (this.selected) {
            // unselect
            this.object.attr({
                stroke: '#000000',
                'strokeWidth': 1.5,
            });
            this.selected = false;
            delete selectedNodes[this.id];
        } else {
            // select
            this.object.attr({
                stroke: 'red',
                'strokeWidth': 5,
            });
            this.selected = true;
            selectedNodes[this.id] = this;
        }
    }
}

class Arc {
    constructor(from, to, prob = 0.0, dir = 0.5) {
        this.from = from;
        this.to = to;
        from.connectedArcs.push(this);
        to.connectedArcs.push(this);
        this.prob = prob;
        this.selfDirection = dir;
    }

    id;
    object;
    arrowHeads;
    pathStr;
    text;
    textBox;
    textBoxX;
    textBoxY;
    textBoxSize = 10 * Math.sqrt(2);
    group;
    selected = false;
    startX;
    startY;
    endX;
    endY;

    getNewPath() {
        if (this.from === this.to) {
            let offset = 8;
            let spread = 0.5;
            let selfRads = Math.PI * this.selfDirection;
            let line1StartX = this.from.pos_x + ((this.from.radius + offset) * Math.cos(selfRads + spread));
            this.startX = line1StartX;
            let line1StartY = this.from.pos_y + ((this.from.radius + offset) * Math.sin(selfRads + spread));
            this.startY = line1StartY;
            let line1EndX = line1StartX + ((this.from.radius * 1.5) * Math.cos(selfRads));
            let line1EndY = line1StartY + ((this.from.radius * 1.5) * Math.sin(selfRads));
            let curve1PointX = line1EndX + ((this.from.radius * 1.5) * Math.cos(selfRads));
            let curve1PointY = line1EndY + ((this.from.radius * 1.5) * Math.sin(selfRads));
            let line2EndX = this.from.pos_x + ((this.from.radius + offset) * Math.cos(selfRads - spread));
            this.endX = line2EndX;
            let line2EndY = this.from.pos_y + ((this.from.radius + offset) * Math.sin(selfRads - spread));
            this.endY = line2EndY;
            let line2StartX = line2EndX + ((this.from.radius * 1.5) * Math.cos(selfRads));
            let line2StartY = line2EndY + ((this.from.radius * 1.5) * Math.sin(selfRads));
            let curve2PointX = line2StartX + ((this.from.radius * 1.5) * Math.cos(selfRads));
            let curve2PointY = line2StartY + ((this.from.radius * 1.5) * Math.sin(selfRads));
            let curveCenterX = (curve1PointX + curve2PointX) / 2;
            let curveCenterY = (curve1PointY + curve2PointY) / 2;
            let edges = ["M" + line1StartX.toFixed(2) + " " + line1StartY.toFixed(2) +
            " L" + line1EndX.toFixed(2) + " " + line1EndY.toFixed(2) +
            " Q" + curve1PointX.toFixed(2) + " " + curve1PointY.toFixed(2) +
            " " + curveCenterX.toFixed(2) + " " + curveCenterY.toFixed(2) +
            " Q" + curve2PointX.toFixed(2) + " " + curve2PointY.toFixed(2) +
            " " + line2StartX.toFixed(2) + " " + line2StartY.toFixed(2) +
            " L" + line2EndX.toFixed(2) + " " + line2EndY.toFixed(2)];

            let angRads = Math.atan2(line2EndY - line2StartY, line2EndX - line2StartX);
            let angRadsOffset = 2.5;
            let arrowHeadLen = 10;
            let arrEdge1X = (line2EndX + (arrowHeadLen * Math.cos(angRads + angRadsOffset))).toFixed(2);
            let arrEdge1Y = (line2EndY + (arrowHeadLen * Math.sin(angRads + angRadsOffset))).toFixed(2);
            let arrEdge2X = (line2EndX + (arrowHeadLen * Math.cos(angRads - angRadsOffset))).toFixed(2);
            let arrEdge2Y = (line2EndY + (arrowHeadLen * Math.sin(angRads - angRadsOffset))).toFixed(2);
            edges.push("M" + arrEdge1X + " " + arrEdge1Y + "L" + line2EndX + " " + line2EndY);
            edges.push("M" + arrEdge2X + " " + arrEdge2Y + "L" + line2EndX + " " + line2EndY);
            this.pathStr = edges[0];
            this.textBoxX = ((line1StartX + line1EndX) / 2);
            this.textBoxY = ((line1StartY + line1EndY) / 2);
            return edges
        } else {
            let accuracy = 2;
            let offset = 8;
            let offsetRads = 0.4;
            let angRads1 = Math.atan2(this.to.pos_y - this.from.pos_y, this.to.pos_x - this.from.pos_x) + offsetRads;
            let angRads2 = Math.atan2(this.from.pos_y - this.to.pos_y, this.from.pos_x - this.to.pos_x) - offsetRads;
            let edgeX1 = (this.from.pos_x + ((this.from.radius + offset) * Math.cos(angRads1)));
            let edgeY1 = (this.from.pos_y + ((this.from.radius + offset) * Math.sin(angRads1)));
            let edgeX2 = (this.to.pos_x + ((this.to.radius + offset) * Math.cos(angRads2)));
            let edgeY2 = (this.to.pos_y + ((this.to.radius + offset) * Math.sin(angRads2)));
            this.startX = edgeX1;
            this.startY = edgeY1;
            this.endX = edgeX2;
            this.endY = edgeY2;

            //arrow heads
            let angRads = Math.atan2(edgeY2 - edgeY1, edgeX2 - edgeX1)

            //angle to offset from the angle of the arc
            let angRadsOffset = 2.5
            let arrowHeadLen = 10;

            let arrEdge1X = (edgeX2 + (arrowHeadLen * Math.cos(angRads + angRadsOffset))).toFixed(accuracy);
            let arrEdge1Y = (edgeY2 + (arrowHeadLen * Math.sin(angRads + angRadsOffset))).toFixed(accuracy);
            let arrEdge2X = (edgeX2 + (arrowHeadLen * Math.cos(angRads - angRadsOffset))).toFixed(accuracy);
            let arrEdge2Y = (edgeY2 + (arrowHeadLen * Math.sin(angRads - angRadsOffset))).toFixed(accuracy);

            let edges = ["M" + edgeX1.toFixed(accuracy) + " " + edgeY1.toFixed(accuracy) + "L" + edgeX2.toFixed(accuracy) + " " + edgeY2.toFixed(accuracy)]
            edges.push("M" + arrEdge1X + " " + arrEdge1Y + "L" + edgeX2 + " " + edgeY2);
            edges.push("M" + arrEdge2X + " " + arrEdge2Y + "L" + edgeX2 + " " + edgeY2);
            this.pathStr = edges[0];
            this.textBoxX = (4 * edgeX1 + edgeX2) / 5;
            this.textBoxY = (4 * edgeY1 + edgeY2) / 5;
            return edges
        }
    }

    draw() {
        let newPath = this.getNewPath();
        this.object = s.path(newPath[0]);
        this.object.attr({
            fill: 'none',
            stroke: 'black'
        });
        this.id = this.object.id;
        arcs[this.id] = this;
        this.arrowHeads = [s.path(newPath[1]), s.path(newPath[2])]

        for (let arrowHead of this.arrowHeads) {
            arrowHead.attr({
                fill: 'none',
                stroke: 'black'
            });
        }
        this.textBox = s.rect(this.textBoxX - this.textBoxSize, this.textBoxY - this.textBoxSize * (5 / 8), this.textBoxSize * 2, this.textBoxSize * 1.25, 3);
        this.textBox.attr({
            fill: 'black',
        })
        this.text = s.text(this.textBoxX - this.textBoxSize, this.textBoxY + this.textBoxSize / 2, this.prob.toFixed(2));
        this.text.attr({fill: "yellow"})
        this.object.attr({})
        this.group = s.g(this.textBox, this.text, this.object);
        this.group['ofArc'] = this.id;
        this.group.click(clickArc);
    }

    redraw() {
        let newPath = this.getNewPath();
        this.object.animate({d: newPath[0]}, 0)
        this.arrowHeads[0].animate({d: newPath[1]}, 0);
        this.arrowHeads[1].animate({d: newPath[2]}, 0);
        this.textBox.animate({
            x: this.textBoxX - this.textBoxSize,
            y: this.textBoxY - this.textBoxSize * (5 / 8)
        }, 0);
        this.text.animate({x: this.textBoxX - this.textBoxSize, y: this.textBoxY + this.textBoxSize / 2}, 0);
    }

    rotate(direction) {
        this.selfDirection = direction;
        this.redraw();
    }

    select() {
        if (this.selected) {
            // unselect
            this.textBox.attr({
                stroke: '#000000',
                'strokeWidth': 1.5,
            });
            this.selected = false;
            delete selectedArcs[this.id];
        } else {
            // select
            this.textBox.attr({
                stroke: 'red',
                'strokeWidth': 5,
            });
            this.selected = true;
            selectedArcs[this.id] = this;
        }
    }

}