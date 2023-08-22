class DatasetPanel {
    constructor(data) {
        this.dataset = new Dataset(data)

        this.graphSelect = document.getElementById("menu-visuals-graph")
        this.graphSelect.addEventListener('change', () => {
            this.setDataset()
        })

        this.showSelect = document.getElementById("menu-visuals-show")
        this.showSelect.addEventListener('change', () => {
            this.setVisibleGraph()
        })

        window.addEventListener('contextmenu', (event) => event.preventDefault())
        this.setDataset()
    }

    setDataset() {
        this.dataset = new Dataset(DATASETS[this.graphSelect.value])
        this.setVisibleGraph()
    }

    // Create visible graph based on a dataset and show parameter
    setVisibleGraph() {
        if (this.visibleGraph) {
            this.visibleGraph.drop()
        }
        // Choose depending on show.value
        switch (this.showSelect.value) {
            case "neighborhood":
                this.visibleGraph = new Neighborhood(this.dataset)
                document.getElementById('menu-visuals-node').disabled = false
                break
            case "whole-graph":
                this.visibleGraph = new Graph(this.dataset)
                document.getElementById('menu-visuals-node').disabled = true
                break
        }
        this.visibleGraph.init()
    }
}

///
// Representation of a visible part of dataset - whole graph or a neighborhood.
// Responsible for drawing and interaction with user.
class VisibleGraph {
    constructor(dataset) {
        this.dataset = dataset
        this.element = document.getElementById('dataset-svg')
        this.nodePrimitives = null // {node -> primitive} on HTML element
        this.edgePrimitives = null // {edge -> primitive} on HTML element

        this.layout = new Layout()

        this.nodeRadius = 15
        this.pad = 30 // additional space around elements to SVG border
        this.scale = 100 // scale to adjust element
        this.scaleMax = 1e4 // maximal scale
        this.scaleMin = 1e0 // minimal scale
        this.zoomFactor = 1.15 // scaling coefficient on zoom
        this.screenPos = new Vec(-300, -400) // left-top of part of SVG visible on screen
        this.svgPos = new Vec(0, 0) // SVG viewBox left-top

        this.alive = true // needed to break draw cycle when destroying
        this.drawCycle()

        // Event processing
        this.nodeGrabbed = null // node which is currently dragged (SVG element)
        this.mousePos = new Vec (0, 0) // mouse position in SVG pixels
        this.svgGrabbed = false // whether user grab svg element

        // Handle nodes and SVG drag&drop
        this.element.onmousedown = (e) => {
            if (e.buttons === 1 && e.ctrlKey) {
                this.svgGrabbed = true
                this.element.style.cursor = 'grabbing'
            }
        }
        window.onmouseup = (e) => {
            this.svgGrabbed = false
            this.nodeGrabbed = null
            this.layout.release()
            this.element.style.cursor = 'default'
        }
        this.element.onmousemove = (e) => {
            this.mousePos.x = e.offsetX
            this.mousePos.y = e.offsetY
            if (this.svgGrabbed) {
                this.screenPos.x -= e.movementX
                this.screenPos.y -= e.movementY
                this.draw()
            }
            else if (this.nodeGrabbed) {
                this.layout.lock(this.nodeGrabbed, Vec.add(this.mousePos, this.svgPos).mul(1/this.scale))
                this.layout.startMoving()
                this.draw()
            }
        }

        // Handle zoom
        this.element.onwheel = (e) => {
            if (e.ctrlKey) {
                e.preventDefault()
                let z = e.wheelDelta > 0 ? this.zoomFactor : 1/this.zoomFactor
                if (this.scale * z > this.scaleMax || this.scale * z < this.scaleMin)
                    return
                this.scale *= z

                // Compute SVG and screen new positions
                this.screenPos.x += (z-1)*(this.mousePos.x + this.svgPos.x)
                this.screenPos.y += (z-1)*(this.mousePos.y + this.svgPos.y)

                this.draw()
                // Update mouse pos AFTER draw
                this.mousePos.x = e.layerX
                this.mousePos.y = e.layerY
            }
        }

        // To avoid computing scroll from screenPos
        this.element.parentElement.onscroll = (e) => {
            this.screenPos.x = this.element.parentElement.scrollLeft + this.svgPos.x
            this.screenPos.y = this.element.parentElement.scrollTop + this.svgPos.y
        }
    }

    async drawCycle() {
        //this.draw()
        while (true) {
            if (this.layout.moving) {
                this.draw()
            }
            if (!this.alive) {
                break
            }
            await sleep(100)
        }
    }

    // Initialize elements and start layout
    init() {
        this.draw()
    }

    // Stop showing visible graph and associated menu elements
    drop() {
        this.alive = false
        this.layout.stopMoving()
        this.element.innerHTML = ''
    }

    // Set or Update graph layout
    setLayout() {
    }

    // Get a set of all nodes
    getNodes() {
    }

    // Get a list of all edges
    getEdges() {
    }

    // Create HTML for SVG primitives on the given element
    createPrimitives() {
        // Add attributes elements
        for (const [i, node] of Object.entries(this.nodePrimitives)) {
            this.element.appendChild(node.circle)
            this.element.appendChild(node.text)
        }
    }

    // Draw an edge
    addEdgePrimitive(element, i, j, color, width, show) {
        if (i > j) // FIXME this is for undirected
            [i, j] = [j, i]
        if (!(i in this.edgePrimitives))
            this.edgePrimitives[i] = {}
        let edge = new SvgEdge(0, 0, 0, 0, color, width, show)
        this.edgePrimitives[i][j] = edge
        element.appendChild(edge.path)
    }

    // Draw a node
    addNodePrimitive(element, i, radius, color, show) {
        let node = new SvgNode(0, 0, radius, color, i.toString(), show)
        this.nodePrimitives[i] = node

        // Add listeners
        node.circle.onmousedown = (e) => {
            this.nodeGrabbed = i
        }
    }

    // Adjust SVG viewBox, visible view and scroll according to elements positions on SVG
    adjustVisibleArea() {
        let parent = this.element.parentElement

        // Define new SVG viewBox - minimal rectangle covering SVG bbox and current visible screen
        let bbox = this.element.getBBox()
        this.svgPos.x = Math.min(this.screenPos.x, bbox.x - this.pad)
        this.svgPos.y = Math.min(this.screenPos.y, bbox.y - this.pad)
        let svgX1 = Math.max(this.screenPos.x + parent.clientWidth, bbox.x + bbox.width + this.pad)
        let svgY1 = Math.max(this.screenPos.y + parent.clientHeight, bbox.y + bbox.height + this.pad)
        let w = svgX1 - this.svgPos.x
        let h = svgY1 - this.svgPos.y
        this.element.setAttribute("viewBox", `${this.svgPos.x} ${this.svgPos.y} ${w} ${h}`)
        this.element.style.width = `${w}px`
        this.element.style.height = `${h-4}px` // FIXME what the magic number: 4px ?

        // Set scroll after SVG resize
        parent.scrollLeft = Math.max(0, this.screenPos.x - this.svgPos.x)
        parent.scrollTop = Math.max(0, this.screenPos.y - this.svgPos.y)
    }

    // Change SVG elements positions according to layout positions and scale
    draw() {
        console.log('draw')
        if (this.nodePrimitives == null) {
            // At first time - create primitives
            this.createPrimitives()
        }

        // Update SVG elements according to layout and scale
        for (const [n, node] of Object.entries(this.nodePrimitives)) {
            let newPos = Vec.mul(this.layout.pos[n], this.scale)
            node.moveTo(newPos.x, newPos.y)
            node.scale(this.scale/100)
        }
        for (const [n1, edges] of Object.entries(this.edgePrimitives)) {
            for (const [n2, edge] of Object.entries(edges)) {
                let pos1 = Vec.mul(this.layout.pos[n1], this.scale)
                let pos2 = Vec.mul(this.layout.pos[n2], this.scale)
                edge.moveTo(pos1.x, pos1.y, pos2.x, pos2.y)
            }
        }

        this.adjustVisibleArea()
    }
}