(function() {

  ///////////// CONSTANTS //////////////////

  // endpoints
  var NUM_ENDPOINTS = 7;
  var ENDPOINT_SPEED = 3;
  var ENDPOINT_LEFT_BOUNDARY = 500;   // pixels from left side of page where the polygon will bounce
  var ENDPOINT_MIN_WIDTH = 200;       // minimum width from the left boundary required to animate the polygon

  // line segments
  var SEGMENT_COLOR = "rgba(255, 255, 255, 0.1)";

  // balls at the intersections
  var BIG_BALL_SIZE = 5;
  var BIG_BALL_COLORS = [
    "#f5ea14",    // yellow   // "rgba(245, 234, 20, 0.6)"
    "#29a9e1"     // blue     // "rgba(41, 169, 225, 0.6)"
  ]

  // background circles
  var NUM_SMALL_BALLS = 30;
  var SMALL_BALL_SIZE = 2;
  var SMALL_BALL_COLOR = "rgba(200, 200, 200, 0.4)";  
  var SMALL_BALL_SPEED = 0.5;

  var NUM_PARTICLES = 25;
  var PARTICLE_SPEED = 2;
  var PARTICLE_SIZE = 2;
  var PARTICLE_COLORS = [
    "rgba(245, 234, 20, 0.4)",
    "rgba(41, 169, 225, 0.4)"
  ]

  // site theme
  var THEME_COLORS = [
    "#f5ea14",    // yellow
    "#29a9e1",    // blue
    "#f9f9f9",    // white
    "#111111",    // dark grey
    "#000000"     // black
  ];

  ///////////// CONTRUCTORS /////////////

  function EndPoint(x, y, dx, dy) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
  }

  EndPoint.prototype.update = function() {
    this.x += this.dx * ENDPOINT_SPEED;
    this.y += this.dy * ENDPOINT_SPEED;

    // reverse direction when the point hits a boundary
    if (this.x < ENDPOINT_LEFT_BOUNDARY || this.x > width)
      this.dx *= -1;
    if (this.y < 0 || this.y > height)
      this.dy *= -1;

    // move the endpoint if it goes outside the width or height of the canvas
    if (this.x > width)
      this.x = width;
    if (this.y > height)
      this.y = height;
  }

  function LineSegment(p1, p2) {
    this.p1 = p1;
    this.p2 = p2;
  }

  function SegmentPair(seg1, seg2, color) {
    this.seg1 = seg1;
    this.seg2 = seg2;
    this.color = color;
    this.intersecting;
  }

  function Circle(x, y, dx, dy, radius, color) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.radius = radius;
    this.color = color;
  }

  Circle.prototype.draw = function() {
    ctx2.beginPath();
    ctx2.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
    ctx2.fillStyle = this.color;
    ctx2.strokeStyle = this.color;
    ctx2.fill();
    ctx2.stroke();
  }

  Circle.prototype.update = function() {
    this.x += this.dx * SMALL_BALL_SPEED;
    this.y += this.dy * SMALL_BALL_SPEED;

    // wrap when they fall off the screen
    if (this.x < 0)
      this.x = width;
    else if (this.x > width)
      this.x = 0;
    if (this.y < 0)
      this.y = height;
    else if (this.y > height)
      this.y = 0;
  }

  function Particle(x, y, dx, dy, speed, color) {
    this.x = x;
    this.y = y;
    this.dx = dx;
    this.dy = dy;
    this.speed = speed;
    this.color = color;
  }

  Particle.prototype.update = function() {
    this.x += this.dx * this.speed;
    this.y += this.dy * this.speed;
  }

  Particle.prototype.draw = function() {
    ctx2.fillStyle = this.color;
    ctx2.fillRect(this.x, this.y, PARTICLE_SIZE, PARTICLE_SIZE);
  }

  //////// GLOBAL VARIABLES ////////////

  // the canvas
  var container, container2, canvas, canvas2, width, height, ctx, ctx2, requestAnimationFrame;

  // data structures
  var endpoints, segments, segment_pairs, back_circles, particles;

  /////////// INITIALIZATION ///////////

  // detect canvas height and width
  container = document.getElementById("bottom-canvas");
  width = container.offsetWidth;
  height = container.offsetHeight;

  // create the canvas 
  canvas = document.createElement('canvas');
  container.appendChild(canvas);
  canvas.width = width;
  canvas.height = height;
  ctx = canvas.getContext('2d');

  container2 = document.getElementById("top-canvas");
  canvas2 = document.createElement('canvas');
  container2.appendChild(canvas2);
  canvas2.width = width;
  canvas2.height = height;
  ctx2 = canvas2.getContext('2d');

  // cross-browser RAF
  requestAnimationFrame = 
    window.requestAnimationFrame || 
    window.mozRequestAnimationFrame || 
    window.webkitRequestAnimationFrame || 
    window.msRequestAnimationFrame;

  // initialize endpoints array
  endpoints = [];
  for (var i = 0; i < NUM_ENDPOINTS; i++) {
    var c = new EndPoint(
      ENDPOINT_LEFT_BOUNDARY + randInt(width - ENDPOINT_LEFT_BOUNDARY), 
      randInt(height), 
      (randFloat(2) - 1) / 4, 
      (randFloat(2) - 1) / 4
    );
    endpoints.push(c);
  };

  // initialize segments array
  segments = [];
  for (var i = 0; i < NUM_ENDPOINTS; i++) {
    var s = new LineSegment(endpoints[i], endpoints[(i + 1) % NUM_ENDPOINTS]);
    segments.push(s);
  }

  // initialize segment_pairs array
  segment_pairs = [];
  for (var i = 0; i < NUM_ENDPOINTS - 1; i++) {
    for (var j = i + 1; j < NUM_ENDPOINTS; j++) {
      var sp = new SegmentPair(
        segments[i], 
        segments[j],
        BIG_BALL_COLORS[segment_pairs.length % 2] 
      );
      segment_pairs.push(sp);
    }
  }

  // initialize background circles array
  back_circles = [];
  for (var i = 0; i < NUM_SMALL_BALLS; i++) {
    var bc = new Circle(
      randInt(width),                   
      randInt(height), 
      (randFloat(2) - 1) / 4, 
      (randFloat(2) - 1) / 4, 
      SMALL_BALL_SIZE, 
      SMALL_BALL_COLOR
    );
    back_circles.push(bc);
  }  

  // initialize particles array
  particles = [];

  // start the animation
  requestAnimationFrame(loop);

  /////////// MAIN LOOP /////////////////

  var end, i, isect;
  function loop() {

    // clear canvas
    ctx.clearRect(0, 0 , width, height); 
    ctx2.clearRect(0, 0, width, height);

    // if there's enough space for the floating polygon...
    if (width - ENDPOINT_LEFT_BOUNDARY > ENDPOINT_MIN_WIDTH) {

      // update the endpoints
      end = endpoints.length;
      for (i = 0; i < end; i++) {
        endpoints[i].update();
      }

      // draw the line segments
      end = segments.length;
      for (i = 0; i < end; i++) {
        drawLine(segments[i].p1.x, segments[i].p1.y, segments[i].p2.x, segments[i].p2.y);
      }

      // draw circles at the intersections
      end = segment_pairs.length;
      for (i = 0; i < end; i++) {
        isect = getIntersection(
          segment_pairs[i].seg1.p1.x, segment_pairs[i].seg1.p1.y,
          segment_pairs[i].seg1.p2.x, segment_pairs[i].seg1.p2.y,
          segment_pairs[i].seg2.p1.x, segment_pairs[i].seg2.p1.y,
          segment_pairs[i].seg2.p2.x, segment_pairs[i].seg2.p2.y
        );
          
        if (isect.onLine1 && isect.onLine2)
          drawCircle(isect.x, isect.y, BIG_BALL_SIZE, segment_pairs[i].color);
      }
    }

    // update and draw the background-circles
    end = back_circles.length;
    for (i = 0; i < end; i++) {
      back_circles[i].update();
      back_circles[i].draw();
    }

    // update and draw the particles; eliminate the ones outside the viewing area
    i = 0;
    while (i < particles.length) {
      if (particles[i].x < 0 || particles[i].x > width || particles[i].y < 0 || particles[i].y > height) {
        particles.splice(i, 1);
      } else {
        particles[i].update();
        particles[i].draw();
        i++;
      }
    }   

    // loop back
    requestAnimationFrame(loop);
  }

  /////////// EVENT HANDLERS ////////////

  // particle shower
  $('body').click(function(event) {
    var col = PARTICLE_COLORS[randInt(2)];
    for (var i = 0; i < NUM_PARTICLES; i++) {
      var p = new Particle(
        event.clientX, 
        event.clientY,                   
        (randFloat(2) - 1) / 4, 
        (randFloat(2) - 1) / 4, 
        PARTICLE_SPEED, 
        col
      );
      particles.push(p); 
    }
  }); 

  // handle window resize
  $(window).resize(function() {
    width = container.offsetWidth;
    height = container.offsetHeight; 
    canvas.width = width;
    canvas.height = height; 
  });

  /////////// OTHER FUNCTIONS ///////////

  function drawLine(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = SEGMENT_COLOR;
    ctx.stroke();
  }

  function drawCircle(x, y, radius, color) {
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI, false);
    ctx.fillStyle = color;
    ctx.strokeStyle = color;
    ctx.fill();
    ctx.stroke();
  }

  function getIntersection(line1StartX, line1StartY, line1EndX, line1EndY, 
                           line2StartX, line2StartY, line2EndX, line2EndY) {
    // if the lines intersect, the result contains the x and y of the intersection 
    // (treating the lines as infinite) and booleans for whether line segment 1 or line segment 2 contain the point
    var denominator, a, b, numerator1, numerator2, result = {
        x: null,
        y: null,
        onLine1: false,
        onLine2: false
    };

    denominator = ((line2EndY - line2StartY) * (line1EndX - line1StartX)) - 
                  ((line2EndX - line2StartX) * (line1EndY - line1StartY));

    if (denominator == 0) {
        return result;
    }

    a = line1StartY - line2StartY;
    b = line1StartX - line2StartX;
    numerator1 = ((line2EndX - line2StartX) * a) - ((line2EndY - line2StartY) * b);
    numerator2 = ((line1EndX - line1StartX) * a) - ((line1EndY - line1StartY) * b);
    a = numerator1 / denominator;
    b = numerator2 / denominator;

    // if we cast these lines infinitely in both directions, they intersect here:
    result.x = line1StartX + (a * (line1EndX - line1StartX));
    result.y = line1StartY + (a * (line1EndY - line1StartY));

    // if line1 is a segment and line2 is infinite, they intersect if:
    result.onLine1 = (a > 0 && a < 1);

    // if line2 is a segment and line1 is infinite, they intersect if:
    result.onLine2 = (b > 0 && b < 1);

    // if line1 and line2 are segments, they intersect if both of the above are true
    return result;
  };

  function randInt(max) {
    return Math.floor(Math.random() * max);
  }

  function randFloat(max) {
    return Math.random() * max;
  }



})();