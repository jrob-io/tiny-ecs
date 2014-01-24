module.exports = Vec2;

var Pool = require('./Pool.js');

/**
 * 2-dimension Cartesian vector with built-in (optional) object pool.
 * @constructor
 * @param {Number} x
 * @param {Number} y
 */
function Vec2(x, y)
{
  this.x = +x || 0.0;
  this.y = +y || 0.0;
}

/**
 * @type {Array.<Vec2>}
 */
var freeList = [];

var count    = 0;

/**
 * @return {Vec2} Vector from the pool.
 */
Vec2.aquire = function(x, y)
{
  if (!freeList.length)
    expand(0|(count*0.2)+1);
  var v = freeList.pop();
  v.x = +x || 0.0;
  v.y = +y || 0.0;
  return v;
};

function expand(size)
{
  for (var n = 0; n < size; n++)
    freeList.push(new Vec2());
  count += size;
}

/**
 * @param {Vec2} v
 * @return {Number} Current pool count.
 */
Vec2.release = function(v)
{
  if (v)
    freeList.push(v);
  return count - freeList.length;
};

/**
 * Reset this vector to (0,0).
 * @return {Vec2} This vector.
 */
Vec2.prototype.clear = function()
{
  this.x = this.y = 0.0;
  return this;
};

/**
 * Assign this vector the value of another.
 * @param {Vec2} v
 * @return {Vec2} This vector.
 */
Vec2.prototype.assign = function(v)
{
  this.x = v.x;
  this.y = v.y;
  return this;
};

/**
 * Set this vector to a set of coordinates.
 * @param {Number} x
 * @param {Number} y
 * @return {Vec2} This vector.
 */
Vec2.prototype.set = function(x, y)
{
  this.x = +x;
  this.y = +y;
  return this;
};

/**
 * Limit this vector to a specific magnitude.
 * @param {Number} size
 * @return {Vec2} This vector.
 */
Vec2.prototype.limit = function(size)
{
  size = +size;
  if (!size)
    return this;
  else if (this.magnitude() > size)
    return this.normalize(size);
  else
    return this;
};

/**
 * Normalize this vector.
 * @param {Number=} m Length.
 * @return {Vec2} This vector.
 */
Vec2.prototype.normalize = function(m)
{
  m = m || +1.0;
  var length = Math.sqrt(this.x * this.x + this.y * this.y);
  this.x = m * this.x / length;
  this.y = m * this.y / length;
  return this;
};

/**
 * Subtract some vector from this one.
 * @param {Vec2} v
 * @return {Vec2} This vector.
 */
Vec2.prototype.sub = function(v)
{
  this.x -= v.x;
  this.y -= v.y;
  return this;
};

/**
 * Add some vector to this one.
 * @param {Vec2} v
 * @return {Vec2} This vector.
 */
Vec2.prototype.add = function(v)
{
  this.x += v.x;
  this.y += v.y;
  return this;
};

/**
 * Scalar multiply this vector by a value.
 * @param {Number} n
 * @return {Vec2} This vector.
 */
Vec2.prototype.smult = function(n)
{
  n = +n;
  this.x *= n;
  this.y *= n;
  return this;
};

/**
 * Rotate this vector clockwise about the origin by a certain angle.
 * @param {Number} theta
 * @return {Vec2} This vector.
 */
Vec2.prototype.rotate = function(theta)
{
  return this.set(
    this.x * Math.cos(theta) - this.y * Math.sin(theta),
    this.x * Math.sin(theta) + this.y * Math.cos(theta)
  );
};

/**
 * Get the dot product of this vector and another.
 * @param {Vec2} v
 * @return {Number}
 */
Vec2.prototype.dot = function(v)
{
  return +(this.x * v.x + this.y * v.y);
};

/**
 * Get the determinate of this vector and another.
 * @param {Vec2} v
 * @return {Number}
 */
Vec2.prototype.det = function(v)
{
  return +(this.x * v.y - this.y * v.x);
};

/**
 * Get the magnitude of this vector.
 * @return {Number}
 */
Vec2.prototype.magnitude = function()
{
  return Math.sqrt(this.x * this.x + this.y * this.y);
};

/**
 * Get the squared magnitude of this vector.
 * @return {Number}
 */
Vec2.prototype.magnitude2 = function()
{
  return this.x * this.x + this.y * this.y;
};

/**
 * Get the angle of this vector.
 * @return {Number}
 */
Vec2.prototype.angle = function()
{
  return Math.atan2(this.y, this.x);
};

/**
 * Get the angle between this vector and another.
 * @param {Vec2} v
 * @return {Number}
 */
Vec2.prototype.angleBetween = function(v)
{
  return Math.atan2(this.det(v), this.dot(v));
};

/**
 * Make a pooled copy of this vector
 * @return {Vec2} A new vector.
 */
Vec2.prototype.pcopy = function()
{
  return Vec2.aquire().assign(this);
};

/**
 * Make a copy of this vector.
 * @return {Vec2} A new vector.
 */
Vec2.prototype.copy = function()
{
  return new Vec2().assign(this);
};

/**
 * Create a vector with a specific angle and magnitude.
 * @param {Number} theta
 * @param {Number=} m
 * @return {Vec2} A new vector.
 */
Vec2.fromAngle = function(theta, m)
{
  m = +m || 1.0;
  return new Vec2(Math.cos(theta) * m, Math.sin(theta) * m);
};

/**
 * Create a pooled vector with a specific angle and magnitude.
 * @param {Number} theta
 * @param {Number} m
 * @return {Vec2} A new vector.
 */
Vec2.pfromAngle = function(theta, m)
{
  m = +m || 1.0;
  return Vec2.aquire().set(
    Math.cos(theta) * m,
    Math.sin(theta) * m
  );
};

/**
 * Output this vector.
 */
Vec2.prototype.toString = function()
{
  return '' + (this.x.toFixed(2)) + ',' + (this.y.toFixed(2));
};
