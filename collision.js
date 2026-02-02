(function () {
  const buffer = 0.1;
  const welcome = "Objects: \n  collision\n  Shapes\n\nBoth Objects have .help methods you can call if you're stuck";
  console.log(welcome);
  
  window.collision = {
    pointCircle(cx, cy, r, px, py) {
      return dist(cx, cy, px, py) <= r;
    },
    
    circleCircle(x1, y1, r1, x2, y2, r2) {
      return dist(x1, y1, x2, y2) < r1+r2;
    },

    circleRect(cx, cy, r, rx, ry, rw, rh) {
      let testX = cx;
      let testY = cy;

      if (cx < rx) testX = rx;
      else if (cx > rx + rw) testX = rx + rw;
      if (cy < ry) testY = ry;
      else if (cy > ry + rh) testY = ry + rh;

      let dx = cx - testX;
      let dy = cy - testY;
      return sqrt(dx * dx + dy * dy) <= r;
    },

    pointLine(px, py, x1, y1, x2, y2) {
      let len = dist(x1, y1, x2, y2);
      let d1 = dist(px, py, x1, y1);
      let d2 = dist(px, py, x2, y2);
      return abs(d1 + d2 - len) <= buffer;
    },

    circleLine(cx, cy, r, x1, y1, x2, y2) {
      if (
        this.pointCircle(cx, cy, r, x1, y1) ||
        this.pointCircle(cx, cy, r, x2, y2)
      ) return true;

      let len = dist(x1, y1, x2, y2);
      let dot =
        ((cx - x1) * (x2 - x1) + (cy - y1) * (y2 - y1)) / (len * len);

      dot = constrain(dot, 0, 1);

      let closestX = x1 + dot * (x2 - x1);
      let closestY = y1 + dot * (y2 - y1);

      let dx = closestX - cx;
      let dy = closestY - cy;

      return sqrt(dx * dx + dy * dy) <= r;
    },

    lineLine(x1, y1, x2, y2, x3, y3, x4, y4) {
      let denom =
        (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
      if (denom === 0) return false;

      let uA =
        ((x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3)) / denom;
      let uB =
        ((x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3)) / denom;

      return uA >= 0 && uA <= 1 && uB >= 0 && uB <= 1;
    },

    lineRect(x1, y1, x2, y2, rx, ry, rw, rh) {
      return (
        this.lineLine(x1, y1, x2, y2, rx, ry, rx + rw, ry) ||
        this.lineLine(x1, y1, x2, y2, rx, ry, rx, ry + rh) ||
        this.lineLine(x1, y1, x2, y2, rx, ry + rh, rx + rw, ry + rh) ||
        this.lineLine(x1, y1, x2, y2, rx + rw, ry, rx + rw, ry + rh)
      );
    },

    polyPoint(verts, px, py) {
      let inside = false;
      for (let i = 0, j = verts.length - 1; i < verts.length; j = i++) {
        let xi = verts[i].x, yi = verts[i].y;
        let xj = verts[j].x, yj = verts[j].y;

        let intersect =
          yi > py !== yj > py &&
          px < ((xj - xi) * (py - yi)) / (yj - yi) + xi;
        if (intersect) inside = !inside;
      }
      return inside;
    },

    polyCircle(verts, cx, cy, r) {
      for (let i = 0; i < verts.length; i++) {
        let next = (i + 1) % verts.length;
        if (
          this.circleLine(
            cx, cy, r,
            verts[i].x, verts[i].y,
            verts[next].x, verts[next].y
          )
        ) return true;
      }
      return this.polyPoint(verts, cx, cy);
    },

    polyRect(verts, rx, ry, rw, rh) {
      for (let i = 0; i < verts.length; i++) {
        let next = (i + 1) % verts.length;
        if (
          this.lineRect(
            verts[i].x, verts[i].y,
            verts[next].x, verts[next].y,
            rx, ry, rw, rh
          )
        ) return true;
      }
      return this.polyPoint(verts, rx, ry);
    },
    
    polyLine(verts, x1, y1, x2, y2) {
      for (let i = 0; i < verts.length; i++) {
        let next = (i + 1) % verts.length;
        if (
          this.lineLine(
            verts[i].x, verts[i].y,
            verts[next].x, verts[next].y,
            x1, y1, x2, y2
          )
        ) return true;
      }
      return false;
    },

    polyPoly(p1, p2) {
      for (let i = 0; i < p1.length; i++) {
        let next = (i + 1) % p1.length;
        if (this.polyLine(p2, p1[i].x, p1[i].y, p1[next].x, p1[next].y))
          return true;
      }
      return this.polyPoint(p1, p2[0].x, p2[0].y);
    },

    triPoint(px, py, x1, y1, x2, y2, x3, y3) {
      let area = abs((x2 - x1) * (y3 - y1) - (x3 - x1) * (y2 - y1));
      let a1 = abs((x1 - px) * (y2 - py) - (x2 - px) * (y1 - py));
      let a2 = abs((x2 - px) * (y3 - py) - (x3 - px) * (y2 - py));
      let a3 = abs((x3 - px) * (y1 - py) - (x1 - px) * (y3 - py));
      return abs(a1 + a2 + a3 - area) <= buffer;
    },
    
    rectRect(rx1, ry1, rw1, rh1, rx2, ry2, rw2, rh2) {
      return !(
        rx1 + rw1 < rx2 || // left
        rx1 > rx2 + rw2 || // right
        ry1 + rh1 < ry2 || // top
        ry1 > ry2 + rh2    // bottom
      );
    },
    
    signedArea: function(verts) {
  let area = 0;
  for (let i = 0; i < verts.length; i++) {
    let j = (i + 1) % verts.length;
    area += (verts[j].x - verts[i].x) * (verts[j].y + verts[i].y);
  }
  return area;
},
};

  //  DOCS

  const docs = {
    pointCircle: "pointCircle(cx, cy, r, px, py)\nChecks if a point is inside a circle.",
    circleCircle: "circleCircle(x1, y1, r1, x2, y2, r2)\nChecks if a circle is colliding with another circle.",
    circleRect: "circleRect(cx, cy, r, rx, ry, rw, rh)\nCircle vs rectangle collision.",
    pointLine: "pointLine(px, py, x1, y1, x2, y2)\nPoint on line segment.",
    circleLine: "circleLine(cx, cy, r, x1, y1, x2, y2)\nCircle vs line segment.",
    lineLine: "lineLine(x1,y1,x2,y2,x3,y3,x4,y4)\nLine segment intersection.",
    lineRect: "lineRect(x1,y1,x2,y2,rx,ry,rw,rh)\nLine vs rectangle.",
    polyPoint: "polyPoint(verts, px, py)\nPoint inside polygon.",
    polyCircle: "polyCircle(verts, cx, cy, r)\nPolygon vs circle.",
    polyRect: "polyRect(verts, rx, ry, rw, rh)\nPolygon vs rectangle.",
    polyLine: "polyLine(verts, x1, y1, x2, y2)\nPolygon vs line.",
    polyPoly: "polyPoly(p1, p2)\nPolygon vs polygon.",
    triPoint: "triPoint(px, py, x1, y1, x2, y2, x3, y3)\nPoint inside triangle.",
    rectRect: "rectRect(x1, y1, w1, h1, x2, y2, w2, h2)\nTests if a rectangle is colliding with another rectangle."
  };
  Object.keys(docs).forEach(k => {
    window.collision[k].__doc = docs[k];
  });

  window.collision.help = function (name) {
    if (!name) {
      console.log("Collision helpers:");
      Object.keys(this)
        .filter(k => typeof this[k] === "function")
        .forEach(k => console.log(" -", k));
      return;
    }
    if (!this[name] || !this[name].__doc) {
      console.warn(`No documentation for '${name}'`);
      return;
    }
    console.log(this[name].__doc);
  };

  window.Shapes = {
    Circle: class {
    constructor(_x, _y, _radius, _color = [0,0,50], _onCollision = function(){}) {
      this.x = _x;
      this.y = _y;
      this.r = _radius;
      this.onCollision = _onCollision;
      this.colour = _color;
    }
    
    get name() {
      return "Circle";
    }
    
    get position() {
      return createVector(this.x, this.y);
    }
    
    get radius() {
      return this.r;
    }
      
    get fillColor() {
      return this.colour;
    }
      
    setColor(h, s, l) {
      this.colour = [h,s,l];
    }
      
    toPos(x, y) {
      this.x = x; this.y = y;
    }
    
    render() {
      fill(this.colour[0],this.colour[1],this.colour[2]);
      circle(this.x, this.y, this.r);
    }
    
    isColliding(shape, func = function(){}) {
      let colliding = false;
      switch(shape.name) {
          case("Circle"):
            colliding = collision.circleCircle(this.x, this.y, this.r, shape.position.x, shape.position.y, shape.radius);
            break;
          case("Rectangle"):
            colliding = collision.circleRect(this.x, this.y, this.r, shape.position.x, shape.position.y, shape.Width, shape.Height);
            break;
          case("Triangle"):
            colliding = collision.polyCircle(shape.vertices, this.x, this.y, this.r);
            break;
          case("Polygon"):
            colliding = collision.polyCircle(shape.vertices, this.x, this.y, this.r);
            break;
      }
      if(colliding) {
        this.onCollision();
        func();
      }
      return collision;
    }
  },
  
  Rectangle: class {
    constructor(_x, _y, _width, _height, _color = [0,0,50], onCollision = function(){}) {
      this.x = _x;
      this.y = _y;
      this.w = _width;
      this.h = _height;
      this.onCollision = onCollision;
      this.colour = _color;
    }
    
    get name() {
      return "Rectangle";
    }
    
    get position() {
      return createVector(this.x, this.y);
    }
    
    get Width() {
      return this.w;
    }
    
    get Height() {
      return this.h;
    }
    
    get fillColor() {
      return this.colour;
    }
    
    setColor(h, s, l) {
      this.colour = [h,s,l];
    }
    
    toPos(x, y) {
      this.x = x; this.y = y;
    }
    
    render() {
      fill(this.colour[0],this.colour[1],this.colour[2]);
      rect(this.x, this.y, this.w, this.h);
    }
    
    isColliding(shape, func = function(){}) {
      let colliding = false;
      switch(shape.name) {
          case("Circle"):
            colliding = collision.circleRect(shape.position.x, shape.position.y, shape.radius, this.x, this.y, this.w, this.h);
          break;
          case("Rectangle"):
            colliding = collision.rectRect(this.x, this.y, this.w, this.h, shape.position.x, shape.position.y, shape.Width, shape.Height);
          break;

          case("Triangle"):
            colliding = collision.polyRect(shape.vertices, this.x, this.y, this.w, this.h);
          break;
          case("Polygon"):
            colliding = collision.polyRect(shape.vertices, this.x, this.y, this.w, this.h);
          break;
      }
      
      if(colliding) {
        this.onCollision();
        func();
      }
      
      return colliding;
    }
  },
  
  Triangle: class {
    constructor(_x1, _y1, _x2, _y2, _x3, _y3, _color = [0,0,50], _onCollision = function(){}) {
      this.x1 = _x1;
      this.y1 = _y1;
      this.x2 = _x2;
      this.y2 = _y2;
      this.x3 = _x3;
      this.y3 = _y3;
      this.onCollision = _onCollision;
      this.c = _color;
    }
    
    get vertices() {
      let verts = [
        createVector(this.x1, this.y1),
        createVector(this.x2, this.y2),
        createVector(this.x3, this.y3)
      ];

      // Ensure counter-clockwise winding
      if (this.signedArea(verts) < 0) {
        verts.reverse();
      }

      return verts;
    }
    
    get fillColor() {
      return this.c;
    }
    
    setColor(h, s, l) {
      this.colour = [h,s,l];
    }
    
    get name() {
      return "Triangle";
    }
    
    render() {
      fill(this.c[0],this.c[1],this.c[2]);
      triangle(this.x1, this.y1, this.x2, this.y2, this.x3, this.y3);
    }
    
    isColliding(shape, func = function(){}) {
      let colliding = false;
      switch(shape.name) {
          case("Circle"):
            colliding = collision.polyCircle(this.verts, shape.position.x, shape.position.y, shape.radius);
            break;
          case("Rectangle"):
            colliding = collision.polyRect(this.verts, shape.position.x, shape.position.y, shape.Width, shape.Height);
            break;
          case("Triangle"):
            colliding = collision.polyPoly(this.verts, shape.vertices);
            break;
          case("Polygon"):
            colliding = collision.polyPoly(this.verts, shape.vertices);
            break;
      }
      if(collision) {
        this.onCollision();
        func();
      }
      
      return collision;
    }
  },
  
  Polygon: class {
    constructor(verts, _color = [0,0,50], _onCollision = function(){}) {
      this.v = verts;
      this.onCollision = _onCollision;
      this.c = _color;
      this.x = 0;
      this.y = 0;
    }
    
    get name() {
      return "Polygon";
    }
    
    get fillColor() {
      return this.c;
    }
    
    setColor(h, s, l) {
      this.colour = [h,s,l];
    }
    
    get vertices() {
      if (collision.signedArea(this.v) < 0) {
        this.v.reverse();
      }
      return this.v;
    }
    
    render() {
      fill(this.c[0],this.c[1],this.c[2]);
      beginShape();
      for(let i = 0; i < this.v.length; i++) {
        vertex(this.v[i].x, this.v[i].y);
      }
      endShape(CLOSE);
    }
    
    isColliding(shape, func = function(){}) {
      let colliding = false;
      switch(shape.name) {
          case("Circle"):
            colliding = collision.polyCircle(this.v, shape.position.x, shape.position.y, shape.radius);
            break;
          case("Rectangle"):
            colliding = collision.polyRect(this.v, shape.position.x, shape.position.y, shape.Width, shape.Height);
            break;
          case("Triangle"):
            colliding = collision.polyPoly(this.v, shape.vertices);
            break;
          case("Polygon"):
            colliding = collision.polyPoly(this.v, shape.vertices);
            break;
      }
      if(colliding) {this.onCollision()}
      return colliding;
    }
  },
    render: function(shapes) {
      for(let i = 0; i < shapes.length; i++) {
        shapes[i].render();
      }
    }
  }
  
  const ShapeDocs = {
    Circle: "Declaration: \n  new Circle(float x, float y, float radius, float[] *color, function *onCollision)\n\nMethods:\n  - .position\n    returns a vector containing the Circles Position\n  - .radius\n    returns the Circles radius\n  - .toPos(float x, float y)\n    sets the Circles X and Y positions\n  - .render()\n    renders the Circle\n  - .isColliding(Shape shape, function *func)\n    returns true if colliding with the shape passed, and runs given function\n  - .fillColor\n    returns the fill color of the Circle as a list\n  - .setColor(float h, float s, float v)\n    sets the color of the Circle",
    Rectangle: "Declaration:\n  new Rectangle(float x, float y, float width, float height, float[] *color, function *onCollision)\n\nMethods:\n  - .position\n    returns a vector containing the Rectangles posistion\n  - .Width\n    returns the Rectangles Width\n  - .Height\n    returns the Rectangles height\n  - .toPos(float x, float y)\n    sets the Rectangles position\n  - render()\n    renders the Rectangle\n  - .isColliding(Shape shape)\n    returns true if colliding with the Shape passed\n  - .fillColor\n    returns the fill color of the Rectangle as a list\n  - .setColor(float h, float s, float v)\n    sets the color of the Rectangle",
    Triangle: "Declaration: \n  new Triangle(float x1, float y1, float x2, float y2, float x3, float y3, float[] *color, function *onCollision)\n\nMethods: \n  - .vertices\n    returns a list of vectors one for each point in the triangle\n  - .render()\n    - renders the Triangle\n  - .isColliding(Shape shape, function *func)\n    returns true if the Triangle is colliding with the shape passed, and runs func() if so\n  - .fillColor\n    returns the fill color of the Triangle as a list\n  - .setColor(float h, float s, float v)\n    sets the color of the Triangle",
    Polygon: "Declaration: \n  new Polygon(vector[] verts, float[] *color, function *onCollision)\n\nMethods: \n  - .vertices\n    returns a list of vectors one for each point in the Polygon\n  - .render()\n    - renders the Polygon\n  - .isColliding(Shape shape, function *func)\n    returns true if the Polygon is colliding with the shape passed, and runs func() if so\n  - .fillColor\n    returns the fill color of the Polygon as a list\n  - .setColor(float h, float s, float v)\n    sets the color of the Polygon",
    render: "  render(Shape[] shapes)\ncalls .render on all the shapes passed"
  };
  
  Object.keys(ShapeDocs).forEach(k => {
    window.Shapes[k].__doc = ShapeDocs[k];
  });

  window.Shapes.help = function (name) {
    if (!name) {
      console.log("Shapes:");
      Object.keys(this)
        .filter(k => typeof this[k] != "string")
        .forEach(k => console.log(" -", k));
      return;
    }
    if (!this[name] || !this[name].__doc) {
      console.warn(`No documentation for '${name}'`);
      return;
    }
    console.log(this[name].__doc);
  };
})();
