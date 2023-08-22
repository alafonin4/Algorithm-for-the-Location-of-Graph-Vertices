///
// Node and edges info of the 2nd neighborhood of some node.
// Keeps SVG primitives to draw.
class Neighborhood extends VisibleGraph {
    constructor(dataset) {
        super(dataset)

        this.n0 = null // string
        this.n1 = null // Set of 1st neighbors
        this.n2 = null // Set of 2nd neighbors (except 1st)
        this.e11 = null // Adj between 1st neighbors
        this.e12 = null // Adj from 1st to 2nd neighbors
        this.e22 = null // Adj between 2nd neighbors

        // Drawing params
        this.show2 = true // whether to show 2 nodes
        this.show12 = true // whether to show 2-2 edges
        this.show22 = false // whether to show 2-2 edges

        this.nodeColor = '#ffffff'
        this.edgeColor = {
            0: '#000000',
            1: '#222222',
            2: '#838383',
            22: '#d0d0d0',
        }
        this.nodeRadiuses = {0: 30, 1: 20, 2: 10}
        this.nodeRadius = this.nodeRadiuses[0]

        this.nodeInput = document.getElementById('menu-visuals-node')
        this.nodeInput.addEventListener('change', () => this.init())

        // Adjust nodeInput min/max and check node is in the range
        let nodes = Object.keys(dataset.adj).map((id) => Number(id))
        let min = Math.min.apply(null, nodes)
        let max = Math.max.apply(null, nodes)
        this.nodeInput.setAttribute("min", min)
        this.nodeInput.setAttribute("max", max)
        let node = this.nodeInput.value
        if (node > max) node = max
        else if (node < min) node = min
        this.nodeInput.value = node
    }

    // Initialize elements and start layout
    init() {
        let node = this.nodeInput.value
        if (node !== this.n0) { // Node changed - set graph data from dataset
            [this.n0, this.n1, this.n2, this.e11, this.e12, this.e22] = this.dataset.getNeighborhood(node)
            this.createPrimitives()
            this.setLayout()
        }

        super.init()
    }

    setLayout() {
        this.layout.stopMoving()
        this.layout = new ForceNeighborhoodLayout()
        this.layout.setVisibleGraph(this)
        this.draw()
    }

    getNodes(exceptMain=false) {
        return exceptMain ? new Set([...this.n1, ...this.n2]) :
            new Set([this.n0, ...this.n1, ...this.n2])
    }

    getEdges() {
        console.error('UNDEFINED getEdges() for Neighborhood')
    }

    // Get the number of edges depending on show options
    numEdges() {
        let e = this.n1.size
        e += Object.values(this.e11).map((js) => js.size).reduce((a, b) => a + b, 0) / 2
        if (this.show12)
            e += Object.values(this.e12).map((js) => js.size).reduce((a, b) => a + b, 0) / 2
        if (this.show22)
            e += Object.values(this.e22).map((js) => js.size).reduce((a, b) => a + b, 0) / 2
        return e
    }

    // Create HTML for SVG primitives on the given element
    createPrimitives() {
        this.element.innerHTML = ''
        this.edgePrimitives = {}
        this.nodePrimitives = {}

        // Edges 2-2
        for (const [i, js] of Object.entries(this.e22))
            for (const j of js)
                if (this.n2.has(j) && i < j) // TODO this is for undirected graphs
                    this.addEdgePrimitive(this.element, i, j, this.edgeColor[22], 1, this.show22)
        // Edges 1-2
        for (const [i, js] of Object.entries(this.e12))
            for (const j of js)
                if (i < j) // TODO this is for undirected graphs
                    this.addEdgePrimitive(this.element, i, j, this.edgeColor[2], 1, this.show12)
        // Nodes 2
        for (const n of this.n2)
            this.addNodePrimitive(this.element, n, this.nodeRadiuses[2], this.nodeColor, this.show2)
        // Edges 1-1
        for (const [i, js] of Object.entries(this.e11))
            for (const j of js)
                this.addEdgePrimitive(this.element, i, j, this.edgeColor[1], 2, true)
        // Edges 0-1
        for (const n of this.n1)
            this.addEdgePrimitive(this.element, this.n0, n, this.edgeColor[0], 3, true)

        // Nodes 1
        for (const n of this.n1)
            this.addNodePrimitive(this.element, n, this.nodeRadiuses[1], this.nodeColor, true)
        this.addNodePrimitive(this.element, this.n0, this.nodeRadiuses[0], this.nodeColor, true)

        super.createPrimitives()
    }
}

