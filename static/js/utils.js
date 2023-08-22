// 2-D vector supporting + - *
class Vec {
    constructor(x, y) {
        this.x = x
        this.y = y
    }
    str(precision) {
        return `${this.x.toPrecision(precision)}, ${this.y.toPrecision(precision)}`
    }
    set(vec) {
        this.x = vec.x
        this.y = vec.y
    }
    add(a) {
        if ((typeof a) == "number") {
            this.x += a
            this.y += a
        }
        else { // Vec
            this.x += a.x
            this.y += a.y
        }
        return this
    }
    sub(a) {
        if ((typeof a) == "number") {
            this.x -= a
            this.y -= a
        }
        else { // Vec
            this.x -= a.x
            this.y -= a.y
        }
        return this
    }
    mul(a) {
        this.x *= a
        this.y *= a
        return this
    }
    dist(vec) {
        return ((this.x-vec.x)**2 + (this.y-vec.y)**2)**0.5
    }
    abs() {
        return ((this.x)**2 + (this.y)**2)**0.5
    }
    static add(vec, a) {
        if ((typeof a) == "number")
            return new Vec(vec.x+a, vec.y+a)
        else // Vec
            return new Vec(vec.x+a.x, vec.y+a.y)
    }
    static sub(vec, a) {
        if ((typeof a) == "number")
            return new Vec(vec.x - a, vec.y - a)
        else // Vec
            return new Vec(vec.x - a.x, vec.y - a.y)
    }
    static mul(vec, a) {
        return new Vec(vec.x * a, vec.y * a)
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
