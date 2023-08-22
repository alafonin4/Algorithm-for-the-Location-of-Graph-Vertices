// Common class managing Neighborhood nodes positions according to some layout.
// Layout model is defined in subclasses.
class Layout {
    constructor() {
        this.visibleGraph = null

        this.dt = 0.1
        this.moving = false // whether are still moving
        this.iteration = 0 // number of iterations
        this.pos = {} // node -> position
        this.lockedNode = null // node grabbed by user, its position is fixed
    }

    // Set the VisibleGraph
    setVisibleGraph(visibleGraph) {
        this.visibleGraph = visibleGraph
        this.respawn()
        this.startMoving()
        this.run()
    }

    // Respawn positions when a first show
    respawn() {
        this.iteration = 0
        this.pos = {}
        let nodes = this.visibleGraph.getNodes()
        let r = nodes.size ** 0.5
        for (const n of nodes)
            // TODO increase zone according to num of nodes
            this.pos[n] = new Vec(r*Math.random(), r*Math.random())
    }

    // Start recomputing positions - when respawn or manual move
    startMoving() {
        this.iteration = 0
        if (!this.moving) {
            this.moving = true
            this.run()
        }
    }

    // Stop running
    stopMoving() {
        this.moving = false
    }

    // Start a cycle of searching an optimal position
    async run() {
        let count = 0
        //this.iteration = 0
        while (this.moving) {
            //let t = performance.now()
            this.step()
            count++;
            //console.log(`Time of step(): ${performance.now() - t}ms`)
            await sleep(50)
        }
        console.log("count: " + count)
    }

    // Changes nodes to an array with node coordinates and their numbers
    changeNodes(nodes) {
        let nodesInCoordinates = [];
        for (const n of nodes) {
            let vertexCoordinates = [0, 0, 0];
            vertexCoordinates[0] = this.pos[n].x;
            vertexCoordinates[1] = this.pos[n].y;
            vertexCoordinates[2] = n
            nodesInCoordinates.push(vertexCoordinates);
        }
        return nodesInCoordinates;
    }

    // Changes the node to an array with the coordinates of the node and its number
    changeNode(node) {
        let vertexCoordinates = [0, 0, 0];
        vertexCoordinates[0] = this.pos[node].x;
        vertexCoordinates[1] = this.pos[node].y;
        vertexCoordinates[2] = node;
        return vertexCoordinates;
    }

    // Finding the ideal distance between the vertices of the graph,
    // which depends on the parameters of the visible area of the SVG
    findIdealDistanceBetweenVertices() {
        let nodes = this.visibleGraph.getNodes()
        let idealDistanceBetweenVertices = 0
        if (this.iteration < 2) {
            idealDistanceBetweenVertices = ((visualViewport.width * visualViewport.height / nodes.size) ** 0.5) / 100
        } else {
            let element = document.getElementById('dataset-svg');
            let viewBox = element.getAttribute('viewBox').split(" ");
            let parameterfViewable = []
            for (const v of viewBox) {
                parameterfViewable.push(parseFloat(v))
            }
            idealDistanceBetweenVertices = ((parameterfViewable[2] * parameterfViewable[3] / nodes.size) ** 0.5) / 100
        }
        return idealDistanceBetweenVertices;
    }

    // Provides a decrease in temperature to reduce the spread after the action of forces on the vertex
    temperatureReduction(temperature) {
        return temperature * (1 - this.iteration / 200)
    }

    // Recompute positions according to the layout model
    step() {
        // Implement in subclass
        this.moving = false
    }

    // Fix node position
    lock(node, pos) {
        this.lockedNode = node
        this.pos[this.lockedNode].set(pos)
    }

    // Unlock node
    release() {
        this.lockedNode = null
    }
}
