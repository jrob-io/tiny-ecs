module.exports = EntityManager;

var Entity  = require('./Entity.js');
var getName = require('typedef').getName;

/**
 * Manage, create, and destroy entities in our system. Can use methods to
 * mutate entities (tags, components) directly or via the facade on the Entity.
 * @constructor
 * @param {Function} factory Optional function that will create objects for us
 * from a constructor.
 * @param {Function} recycler Option function that will destroy object
 * instances for us.
 */
function EntityManager(factory, recycler)
{
  this._factory = factory || function(T) { return new T(); };
  this._recycler = recycler || function(instance) { };

  this._entities = [];
  this._tags      = {};
  this._groups    = {};
}

function Group(Components, entities)
{
  this.Components = Components || [];
  this.entities = entities || [];
}

function defaultFactory(T) { return new T(); }

/**
 * Get a new entity.
 * @return {Entity}
 */
EntityManager.prototype.createEntity = function()
{
  var entity = this._factory(Entity);
  this._entities.push(entity);
  entity._manager = this;
  return entity;
};

/**
 * @param {Entity} entity
 */
EntityManager.prototype.removeEntity = function(entity)
{
  var index = this._entities.indexOf(entity);

  if (!~index)
    throw new Error('Tried to remove entity not in list');

  this._entities.splice(index, 1);

  // Remove entity from any of the component group indexes
  for (var groupName in this._groups) {
    var group = this._groups[groupName];

    // Skip if it doesnt belog, otherwise remove it from the group's list
    if (!entity.hasAllComponents(group.Components))
      continue;
    var loc = group.entities.indexOf(entity);
    if (~loc)
      group.entities.splice(loc, 1);
  }

  // Remove entity from any tag groups
  entity._tags = null;
  for (var tag in this._tags) {
    var entities = this._tags[tag];

    var n = entities.indexOf(entity);
    if (~n)
      entities.splice(n, 1);
  }

  entity._manager = null;

  // Recycle all components
  for (var i = 0; i < entity._Components.length; i++) {
    var T = entity._Components[i];
    var component = entity[componentPropertyName(T)];
    this._recycler(component);
  }

  // Recycle entity
  this._recycler(entity);

};

/**
 * @param {Entity} entity
 * @param {String} tag
 */
EntityManager.prototype.entityAddTag = function(entity, tag)
{
  var entities = this._tags[tag];

  if (!entities)
    entities = this._tags[tag] = [];

  // Don't add if already there
  if (~entities.indexOf(entity)) return;

  entities.push(entity);
  entity._tags.push(tag);
};

/**
 * @param {Entity} entity
 * @param {String} tag
 */
EntityManager.prototype.entityRemoveTag = function(entity, tag)
{
  var entities = this._tags[tag];
  if (!entities) return;

  var index = entities.indexOf(entity);
  if (!~index) return;

  entities.splice(index, 1);
  entity._tags.splice(entity._tags.indexOf(tag), 1);
};

/**
 * @param {Entity} entity
 * @param {Function} Component
 */
EntityManager.prototype.entityAddComponent = function(entity, Component)
{
  if (~entity._Components.indexOf(Component)) return;

  entity._Components.push(Component);

  var component = this._factory(Component);
  entity[componentPropertyName(Component)] = component;

  // Check each indexed group to see if we need to add this entity to the list
  for (var groupName in this._groups) {
    var group = this._groups[groupName];

    if (!~group.Components.indexOf(Component))
      continue;
    if (!entity.hasAllComponents(group.Components))
      continue;
    if (~group.entities.indexOf(entity))
      continue;

    group.entities.push(entity);
  }
};

/**
 * @param {Entity} entity
 * @param {Function} Component
 */
EntityManager.prototype.entityRemoveComponent = function(entity, Component)
{
  var index = entity._Components.indexOf(Component);
  if (!~index) return;

  // Check each indexed group to see if we need to remove it
  for (var groupName in this._groups) {
    var group = this._groups[groupName];

    if (!~group.Components.indexOf(Component))
      continue;
    if (!entity.hasAllComponents(group.Components))
      continue;

    var loc = group.entities.indexOf(entity);
    if (~loc) {
      group.entities.splice(loc, 1);
    }
  }

  // Recycle and remove
  var propName = componentPropertyName(Component);
  this._recycler(entity[propName]);
  entity._Components.splice(index, 1);
  delete entity[propName];
};

/**
 * @param {Array.<Function>} TComponent
 * @return {Array.<EntityManager>}
 */
EntityManager.prototype.queryComponents = function(Components)
{
  var group = this._groups[groupKey(Components)];

  if (!group) {
    group = this._indexGroup(Components);
  }

  return group.entities;
};

/**
 * @param {String} tag
 * @return {Array.<EntityManager>}
 */
EntityManager.prototype.queryTag = function(tag)
{
  var entities = this._tags[tag];

  if (entities === undefined)
    entities = this._tags[tag] = [];

  return entities;
};

/**
 * @return {Number}
 */
EntityManager.prototype.count = function()
{
  return this._entities.length;
};

/**
 * @param {Array.<Function>} Components
 * @private
 */
EntityManager.prototype._indexGroup = function(Components)
{
  var key = groupKey(Components);

  if (this._groups[key]) return;

  var group = this._groups[key] = new Group(Components);

  for (var n = 0; n < this._entities.length; n++) {
    var entity = this._entities[n];
    if (entity.hasAllComponents(Components)) {
      group.entities.push(entity);
    }
  }

  return group;
};

/**
 * @param {Function} Component
 * @return {String}
 * @private
 */
function componentPropertyName(Component)
{
  var name = getName(Component);
  return name.charAt(0).toLowerCase() + name.slice(1);
}

/**
 * @param {Array.<Function>} Components
 * @return {String}
 * @private
 */
function groupKey(Components)
{
  var names = [];
  for (var n = 0; n < Components.length; n++) {
    var T = Components[n];
    names.push(getName(T));
  }

  return names
    .map(function(x) { return x.toLowerCase(); })
    .sort()
    .join('-');
}
