var expect = require('chai').expect;
var Context = require('../lib/context');
var littlestDispatcher = require('littlest-dispatcher');

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
      expect(child.stores.test).to.be.an.instanceof(littlestDispatcher.Store);
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
});
