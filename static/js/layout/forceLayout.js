class ForceLayout extends Layout {
    constructor(alpha=30, beta=20, minV=0.1, visc=0.85) {
        super()

        this.alpha = alpha
        this.beta = beta
        this.visc = visc // viscosity
        this.minV = minV

        this.v = {} // velocity, node -> Vec
        this.a = {} // acceleration, node -> Vec
        this.m = {} // node -> mass

        this.temperature = 150 // max total acceleration on a node
    }

    respawn() {
        // Respawn v and a
        super.respawn()
        this.v = {}
        this.a = {}
        this.m = {}
        let nodes = this.visibleGraph.getNodes()
        for (const n of nodes) {
            this.v[n] = new Vec(0, 0)
            this.a[n] = new Vec(0, 0)
            this.m[n] = this.visibleGraph.adj[n].size
        }
    }

    _repulseNodes(i, j) {
        const d0 = 0.4
        const k = 0.1
        let d = this.pos[i].dist(this.pos[j])
        let m = 1/(d0 + k * d**2)
        let f = Vec.sub(this.pos[j], this.pos[i])
        f.mul(-this.alpha / d * m)
        f.mul((this.m[i] * this.m[j])**0.5)
        return f
    }

    _attractEdge(i, j, d0=0.1) {
        let d = this.pos[i].dist(this.pos[j])
        let m = (d - d0) ** 2
        let f = Vec.sub(this.pos[j], this.pos[i])
        f.mul(this.beta / d * m)
        f.mul((this.m[i] * this.m[j])**0.5)
        return f
    }

    step() {
        // console.log("step ForceLayout")

        let dt = this.dt
        // Update forces
        let nodes = this.visibleGraph.getNodes()
        for (const n of nodes) {
            this.a[n].x = 0
            this.a[n].y = 0
            this.v[n].x = 0
            this.v[n].y = 0
        }

        let idealDistanceBetweenVertices = this.findIdealDistanceBetweenVertices()
        let changedNodes = this.changeNodes(nodes);
        // creating a kd-tree
        let kd = new KDTree(changedNodes);
        // Calculation of repulsive forces for each vertex with its nearest neighbors
        for (const i of nodes) {
            // Finding the nearest neighbors to vertex i within the radius of the ideal distance
            let closestNodes = kd.findNeighborsInRadius(this.changeNode(i), idealDistanceBetweenVertices)
            for (const j of closestNodes) {
                if (i >= j) {
                    continue
                }
                let f = this._repulseNodes(i, j)
                this.a[i].add(Vec.mul(f, dt / this.m[i]))
                this.a[j].sub(Vec.mul(f, dt / this.m[j]))
            }
        }

        // Calculation of the forces of attraction for each edge in the graph
        let edges = this.visibleGraph.getEdges()
        for (const [i, j] of edges) {
            let f = this._attractEdge(i, j, 0.3)
            this.a[i].add(Vec.mul(f, dt / this.m[i]))
            this.a[j].sub(Vec.mul(f, dt / this.m[j]))
        }

        // Normalize forces to max
        let temperature = this.temperatureReduction(this.temperature)
        let maxA = Math.max.apply(null, Object.values(this.a).map((v) => Math.abs(v.x)))
        if (maxA > temperature) {
            for (const n of Object.keys(this.a)) {
                this.a[n].x *= temperature / maxA
            }
        }
        maxA = Math.max.apply(null, Object.values(this.a).map((v) => Math.abs(v.y)))
        if (maxA > temperature) {
            for (const n of Object.keys(this.a)) {
                this.a[n].y *= temperature / maxA
            }
        }

        this.moving = false
        // Update speed and angle
        for (const n of nodes) {
            if (n === this.lockedNode) {
                continue
            }
            this.v[n].add(Vec.mul(this.a[n], dt))
            this.v[n].mul(this.visc ** this.m[n])
            this.pos[n].add(Vec.mul(this.v[n], dt))

            if (this.v[n].abs() > this.minV)
                this.moving = true
        }
        this.iteration += 1
    }
}