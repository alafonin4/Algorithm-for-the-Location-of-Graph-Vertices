const ATTRIBUTE_COLORMAP = 'cool'

// A node with an SVG primitive to draw it
class SvgNode {
    constructor(x, y, r, color, text, show) {
        this.x = x
        this.y = y
        this.r = r
        this.color = color // default color
        this.show = show

        this.circle = document.createElementNS("http://www.w3.org/2000/svg", "circle")
        this.circle.setAttribute('cx', x)
        this.circle.setAttribute('cy', y)
        this.circle.setAttribute('r', r)
        this.circle.setAttribute('class', 'graph-node')
        this.circle.setAttribute('fill', color)
        this.circle.setAttribute('display', show ? "inline" : "none")
        this.circle.setAttribute('draggable', "true")

        this.text = document.createElementNS("http://www.w3.org/2000/svg", "text")
        this.text.textContent = text
        this.text.setAttribute('x', x)
        this.text.setAttribute('y', y)
        this.text.setAttribute('dominant-baseline', 'middle')
        this.text.setAttribute('text-anchor', 'middle')
        this.text.setAttribute('class', 'tree-node-text')
        this.text.setAttribute('font-size', `${2 / 3 * r}pt`)
        this.text.setAttribute('display', show ? "inline" : "none")
    }

    _attrX(ix, r) {
        return this.x - 2*r
    }

    _attrY(ix, r) {
        return this.y - r + ix * 0.8 * r
    }

    moveTo(x, y) {
        this.x = x
        this.y = y
        this.circle.setAttribute('cx', this.x)
        this.circle.setAttribute('cy', this.y)
        this.text.setAttribute('x', this.x)
        this.text.setAttribute('y', this.y)
    }

    scale(s) {
        let r = Math.max(5, Math.ceil(this.r * (s ** 0.5)))
        this.circle.setAttribute('r', r)
        this.text.setAttribute('font-size', `${2 / 3 * r}pt`)
    }

    // Set visibility for all elements
    visible(show) {
        this.show = show
        this.circle.setAttribute('display', show ? "inline" : "none")
        this.text.setAttribute('display', show ? "inline" : "none")
    }

    // Set fill color
    setColor(color) {
        // this.circle.setAttribute('stroke', color)
        this.circle.setAttribute('fill', color)
    }

    // Change color back to default
    dropColor() {
        this.circle.setAttribute('fill', this.color)
    }
}

// An edge with an SVG primitive to draw it
class SvgEdge {
    constructor(x1, x2, y1, y2, color, width, show) {
        // this.x1 = x1
        // this.y1 = y1
        // this.x2 = x2
        // this.y2 = y2
        this.color = color
        this.width = width
        this.show = show

        this.path = document.createElementNS("http://www.w3.org/2000/svg", "path")
        this.path.setAttribute('d', `M${x1},${y1} L${x2},${y2}`)
        this.path.setAttribute('stroke', color)
        this.path.setAttribute('display', show ? "inline" : "none")
        this.path.setAttribute('stroke-width', width)
    }

    moveTo(x1, y1, x2, y2) {
        // this.x1 = x1
        // this.y1 = y1
        // this.x2 = x2
        // this.y2 = y2
        this.path.setAttribute('d', `M${x1},${y1} L${x2},${y2}`)
    }

    visible(show) {
        this.show = show
        this.path.setAttribute('display', show ? "inline" : "none")
    }

    // Set stroke color
    setColor(color) {
        this.path.setAttribute('stroke', color)
    }

    // Change color back to default
    dropColor() {
        this.path.setAttribute('stroke', this.color)
    }
}