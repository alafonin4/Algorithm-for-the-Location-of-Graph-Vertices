class ForceNeighborhoodLayout extends Layout {
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
        this.decay = 0.98
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
        }
        this.m[this.visibleGraph.n0] = 5 * nodes.size
        for (const n of this.visibleGraph.n1)
            this.m[n] =this.visibleGraph.n1.size// nodes.size / this.visibleGraph.n1.size
        for (const n of this.visibleGraph.n2)
            this.m[n] = 1
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
        f.mul(2 * this.beta / d * m)
        f.mul((this.m[i] * this.m[j])**0.5)
        return f
    }

    step() {
        // console.log("step ForceNeighborhoodLayout")
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
        // Array that includes all vertices adjacent to the main vertex
        let newNodes = []
        newNodes.push(this.visibleGraph.n0)
        for (const n of this.visibleGraph.n1) {
            newNodes.push(n)
        }
        for (const n of this.visibleGraph.n2) {
            newNodes.push(n)
        }
        let changedNodes = this.changeNodes(nodes);
        // creating a kd-tree
        let kd = new KDTree(changedNodes);

        let n0 = this.visibleGraph.n0
        // Calculation of repulsive forces for each vertex with its nearest neighbors
        for (const i of newNodes) {
            // Finding the nearest neighbors to vertex i within the radius of the ideal distance
            let closestNodes = kd.findNeighborsInRadius(this.changeNode(i), idealDistanceBetweenVertices)
            for (const j of closestNodes) {
                if (i >= j) {
                    continue
                }
                let f = this._repulseNodes(i, j)
                if (i === n0) {
                    this.a[i].add(Vec.mul(f, dt / this.m[i]))
                    this.a[j].sub(Vec.mul(f, dt / this.m[j]))
                } else {
                    this.a[i].add(Vec.mul(f, dt / this.m[i]))
                    this.a[j].sub(Vec.mul(f, dt / this.m[j]))
                }
            }
        }

        // Calculation of attraction forces for edges between the first neighbors and the main vertex
        for (const n of this.visibleGraph.n1) { // Edges 0-1
            let f = this._attractEdge(n0, n, 0.1)
            this.a[n0].add(Vec.mul(f, dt / this.m[n0]))
            this.a[n].sub(Vec.mul(f, dt / this.m[n]))
        }

        // Calculation of attraction forces for edges between the first neighbors and the second neighbors
        for (const [i, js] of Object.entries(this.visibleGraph.e11)) { // Edges 1-1
            for (const j of js) {
                let f = this._attractEdge(i, j, 0.3)
                this.a[i].add(Vec.mul(f, dt / this.m[i]))
                this.a[j].sub(Vec.mul(f, dt / this.m[j]))
            }
        }

        for (const [i, js] of Object.entries(this.visibleGraph.e12)) { // Edges 1-2
            for (const j of js) {
                if (i >= j) {
                    continue
                }
                let f = this._attractEdge(i, j, 0.1)
                this.a[i].add(Vec.mul(f, dt / this.m[i]))
                this.a[j].sub(Vec.mul(f, dt / this.m[j]))
            }
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
            if (n === n0) {
                this.a[n].x = 0
                this.a[n].y = 0
            }
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