///
// Full dataset data -- graph, its part (in case of large graphs), or a set of graphs.
// Keeps:
// * nodes and edges
class Dataset {
    constructor(dataset_data) {
        // Metadata
        this.name = null

        // Contents
        this.nodes = null // Set of node ids
        this.adj = null // dict {i -> Set(j1, j2, ...)}

        // Variables
        this.numEdges = null

        if (dataset_data != null)
            this.setData(dataset_data)
    }

    setData(dataset_data) {
        this.nodes = new Set(dataset_data['nodes'])
        this.adj = {}
        this.numEdges = 0
        // Create adjacency dict (bidirectional)
        for (const [i, j] of dataset_data['edges']) {
            this._addEdge(this.adj, i, j)
            this.numEdges += 1
        }
    }

    _addEdge = function (adj, i, j) {
        if (!(i in adj))
            adj[i] = new Set()
        if (!(j in adj))
            adj[j] = new Set()
        adj[i].add(j)
        adj[j].add(i)
    }

    getNeighborhood(node) {
        let n1 = new Set(this.adj[node])
        let n2 = new Set()
        let e11 = {}
        let e12 = {}
        let e22 = {}
        for (const n of n1) {
            for (const nn of this.adj[n]) {
                if (n1.has(nn)) {
                    this._addEdge(e11, n, nn)
                }
                else if (nn !== node) {
                    n2.add(nn)
                    this._addEdge(e12, n, nn)
                }
            }
        }
        for (const n of n2) {
            for (const nn of this.adj[n]) {
                if (n2.has(nn))
                    this._addEdge(e22, n, nn)
            }
        }
        return [node, n1, n2, e11, e12, e22]
    }

    getGraph() {
        return [this.nodes, this.adj]
    }
}
