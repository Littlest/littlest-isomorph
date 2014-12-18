var expect = require('chai').expect;
var dispatcher = require('littlest-dispatcher');
var Context = require('../lib/context');
var Empty = require('./fixtures/components/empty');

function noop() {}

describe('Context', function () {
  beforeEach(function () {
    this.context = new Context();
  });

  describe('getChild', function () {
    it('should return a Context', function () {
      var child = this.context.getChild();

      expect(child).to.be.an.instanceof(Context);
    });
  });

  describe('children', function () {
    it('should contain a Dispatcher', function () {
      var child = this.context.getChild();

      expect(child.dispatcher).to.be.an('object');
      expect(child.dispatcher.dispatch).to.be.a('function');
    });

    it('should contain the same Actions', function () {
      var child = this.context.getChild();

      expect(child.actions).to.be.an('object');
      expect(child.actions).to.not.have.keys(['test']);

      this.context.createAction('test', noop);
      child = this.context.getChild();

      expect(child.actions).to.be.an('object');
      expect(child.actions).to.have.keys(['test']);
      expect(child.actions.test).to.be.a('function');
    });

    it('should contain the same Stores', function () {
      var child = this.context.getChild();

      expect(child.stores).to.be.an('object');
      expect(child.stores).to.not.have.keys(['test']);

      this.context.createStore('test', {});
      child = this.context.getChild();

      expect(child.stores).to.be.an('object');
      expect(child.stores).to.have.keys(['test']);
      expect(child.stores.test).to.be.an.instanceof(dispatcher.Store);
    });

    it('should start with the same Store state', function () {
      this.context.createStore('test', { 'foo': 'bar' });

      var child = this.context.getChild();

      expect(child.stores.test).to.have.property('foo', 'bar');
    });

    it('should isolate Store state changes', function () {
      this.context.createStore('test', { 'foo': 'bar' });

      var child = this.context.getChild();

      expect(this.context.stores.test).to.have.property('foo', 'bar');
      expect(child.stores.test).to.have.property('foo', 'bar');

      child.getStore('test').foo = 42;

      expect(this.context.stores.test).to.have.property('foo', 'bar');
      expect(child.stores.test).to.have.property('foo', 42);
    });

    it('should isolate Action side effects', function (done) {
      var parent = this.context;

      parent.createStore('test', { 'foo': 'bar' })
        .handle('test:go:succeeded', function (data) {
          this.foo = data;
        });

      parent.createAction('test:go', function (params) {
        return params;
      });

      var child = parent.getChild();

      expect(parent.stores.test).to.have.property('foo', 'bar');
      expect(child.stores.test).to.have.property('foo', 'bar');

      child.performAction('test:go', 42)
        .then(function () {
          expect(parent.stores.test).to.have.property('foo', 'bar');
          expect(child.stores.test).to.have.property('foo', 42);
        })
        .then(done, done);
    });
  });

  describe('getStore', function () {
    it('should return a Store');
    it('should return null if missing');
  });

  describe('performAction', function () {
    it('should return a Promise');
    it('should perform an Action');
    it('should throw if missing');
  });

  describe('createRoute', function () {
    beforeEach(function () {
      this.context.createRoute('test', {
        path: '/test',
        body: Empty
      });
    });

    it('should make routes available through router.getRoute', function () {
      var route = this.context.router.getRoute('/test');

      expect(route).to.be.an('object');
      expect(route).to.have.property('body', Empty);
    });

    it('should make routes available through getRouteUrl', function () {
      var url = this.context.getRouteUrl('test');

      expect(url).to.equal('/test');
    });
  });

  describe('createErrorRoute', function () {
    beforeEach(function () {
      this.context.createErrorRoute(400, {
        body: Empty
      });
    });

    it('should make routes available through router.getErrorRoute', function () {
      var route = this.context.router.getErrorRoute(400);

      expect(route).to.be.an('object');
      expect(route).to.have.property('body', Empty);
    });

    it('should support error names', function () {
      this.context.createErrorRoute('NotFound', {
        body: Empty
      });

      var route = this.context.router.getErrorRoute(404);

      expect(route).to.be.an('object');
      expect(route).to.have.property('body', Empty);
    });
  });

  describe('getRouteUrl', function () {
    beforeEach(function () {
      this.context.createRoute('test', {
        path: '/test',
        body: Empty
      });

      this.context.createRoute('test:view', {
        path: '/test/:testId',
        body: Empty
      });
    });

    it('should render parameterless URLs', function () {
      expect(this.context.getRouteUrl('test')).to.equal('/test');
    });

    it('should render parameterful URLs', function () {
      expect(this.context.getRouteUrl('test:view', { testId: 'foo' })).to.equal('/test/foo');
    });

    it('should return null for missing Routes', function () {
      var route = this.context.getRouteUrl('missing');

      expect(route).to.be.null();
    });
  });

  describe('JSON', function () {
    beforeEach(function () {
      this.context.createStore('test')
        .define('foo', 'bar');

      this.context.createAction('test:go', noop);
      this.json = this.context.toJSON();
    });

    it('should be valid', function () {
      var self = this;

      expect(function () {
        JSON.parse(JSON.stringify(self.json));
      }).to.not.throw();
    });

    it('should be an Object', function () {
      expect(this.json).to.be.an('object');
    });

    it('should contain Store state', function () {
      expect(this.json.stores).to.be.an('object');
    });

    it('should not contain Actions', function () {
      expect(this.json.actions).to.not.exist();
    });
  });

  describe('fromObject', function () {
    beforeEach(function () {
      this.context.createStore('test')
        .define('foo', 'bar');

      this.context.createAction('test:go', noop);
    });

    it('should restore Store state', function () {
      var context = new Context();

      context.createStore('test');
      context.fromObject(JSON.parse(JSON.stringify(this.context)));

      expect('foo' in context.getStore('test')).to.be.true();
      expect(context.getStore('test').foo).to.equal('bar');
    });

    it('should not restore Actions', function () {
      var context = new Context();

      context.fromObject(JSON.parse(JSON.stringify(this.context)));

      return context.performAction('test:go')
        .then(function () {
          throw new Error('Expected performAction to throw');
        }, function () {
          return null;
        });
    });

    it('should create missing Stores', function () {
      var context = new Context();

      this.context.createStore('extra')
        .define('key', 'value');
      context.fromObject(JSON.parse(JSON.stringify(this.context)));

      expect(context.getStore('extra')).to.exist();
      expect('key' in context.getStore('extra')).to.be.true();
      expect(context.getStore('extra').key).to.equal('value');
    });
  });
});
