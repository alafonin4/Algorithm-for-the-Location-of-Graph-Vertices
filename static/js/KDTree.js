const INF = 2e+9;

class KDNode {
    constructor(point, axis) {
        this.point = point;
        this.left = null;
        this.right = null;
        this.axis = axis;
    }
}

class KDTree {
    constructor(points) {
        this.root = this.buildTree(points, 0);
    }

    // Recursive function that builds a tree based on an array of points and the current axis
    buildTree(points, axis) {
        if (points.length === 0) {
            return null;
        }

        points.sort((a, b) => a[axis] - b[axis]);
        const medianIndex = Math.floor(points.length / 2);
        const medianPoint = points[medianIndex];

        const node = new KDNode(medianPoint, axis);

        node.left = this.buildTree(points.slice(0, medianIndex), (axis + 1) % 2);
        node.right = this.buildTree(points.slice(medianIndex + 1), (axis + 1) % 2);

        return node;
    }

    // Find distance between two points
    calculateDistance(p1, p2) {
        let sum = 0;
        for (let i = 0; i < 2; i++) {
            sum += Math.pow(p1[i] - p2[i], 2);
        }
        return Math.sqrt(sum);
    }

    search(node, target, axis, nearest, dist) {
        if (node === null) {
            return;
        }
        let distance = this.calculateDistance(node.point, target);
        if (distance < dist) {
            nearest = node.point;
            dist = distance;
        }

        const isLeftSubtree = target[axis] < node.point[axis];
        const nearerChild = isLeftSubtree ? node.left : node.right;
        const furtherChild = isLeftSubtree ? node.right : node.left;
        this.search(nearerChild, target, (axis + 1) % target.length, nearest, dist);

        if (Math.abs(target[axis] - node.point[axis]) < dist) {
            this.search(furtherChild, target, (axis + 1) % target.length, nearest, dist);
        }
    }

    searchRadius(node, target, axis, radius, neighbors) {
        if (node === null) {
            return;
        }
        let distance = this.calculateDistance(node.point, target);

        if (distance <= radius) {
            neighbors.push(node.point[2]);
        }

        const isLeftSubtree = target[axis] < node.point[axis];
        const nearerChild = isLeftSubtree ? node.left : node.right;
        const furtherChild = isLeftSubtree ? node.right : node.left;

        this.searchRadius(nearerChild, target, (axis + 1) % target.length, radius, neighbors);

        if (Math.abs(target[axis] - node.point[axis]) <= radius) {
            this.searchRadius(furtherChild, target, (axis + 1) % target.length, radius, neighbors);
        }
    }

    findNearestNeighbor(target) {
        let nearest;
        let dist = INF;
        this.search(this.root, target, 0, nearest, dist);
        return nearest;
    }

    // Finding the closest points to a point in a certain radius from it
    findNeighborsInRadius(target, radius) {
        let neighbors = [];
        this.searchRadius(this.root, target, 0, radius, neighbors);
        return neighbors;
    }
}