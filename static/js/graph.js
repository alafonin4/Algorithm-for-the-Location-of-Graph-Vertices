class Graph extends VisibleGraph {
    constructor(dataset) {
        super(dataset)

        this.nodes = null // Set of node ids
        this.adj = null // dict {i -> Set(j1, j2, ...)}

        this.nodeColor = '#ffffff'
        this.edgeColor = '#000000'
    }

    init() {
        // Set graph data from dataset
        [this.nodes, this.adj] = this.dataset.getGraph()
        this.setLayout()
        super.init()
    }

    setLayout() {
        this.layout.stopMoving()
        this.layout = new ForceLayout()
        this.layout.setVisibleGraph(this)
        this.draw()
    }

    getNodes() {
        return this.nodes
    }

    getEdges() {
        let edges = new Set() // FIXME copying is not good
        for (const n of this.nodes) {
            for (const nn of this.adj[n]) {
                if (n < nn) {
                    edges.add([n, nn])
                }
            }
        }
        return edges
    }

    // Create HTML for SVG primitives on the given element
    createPrimitives() {
        this.element.innerHTML = ''
        this.edgePrimitives = {}
        this.nodePrimitives = {}

        // Edges
        for (const n of this.nodes)
            for (const nn of this.adj[n])
                if (n < nn)
                    this.addEdgePrimitive(this.element, n, nn, this.edgeColor, 1, true)

        // Nodes
        for (const n of this.nodes)
            this.addNodePrimitive(this.element, n, this.nodeRadius, this.nodeColor, true)

        super.createPrimitives()
    }

}