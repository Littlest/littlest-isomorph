var url = require('url');
var expect = require('chai').expect;
var Router = require('../lib/router');
var Empty = require('./fixtures/components/empty');

describe('Router', function () {
  beforeEach(function () {
    this.router = new Router();
  });

  describe('isSameDomain', function () {
    it('should be true for similar defined hosts', function () {
      expect(this.router.isSameDomain('http://example.com/foo', 'http://example.com/bar')).to.be.true();
    });

    it('should be true for undefined hosts', function () {
      expect(this.router.isSameDomain('http://example.com/foo', '/bar')).to.be.true();
      expect(this.router.isSameDomain('/foo', 'http://example.com/bar')).to.be.true();
      expect(this.router.isSameDomain('/foo', '/bar')).to.be.true();
    });

    it('should be false for different defined hosts', function () {
      expect(this.router.isSameDomain('http://example.com/foo', 'http://other.com/foo')).to.be.false();
    });

    it('should be false for different subdomains', function () {
      expect(this.router.isSameDomain('http://www.example.com/foo', 'http://mail.example.com/foo')).to.be.false();
    });

    it('should support DOM Location objects', function () {
      // TODO(schoon) - Find a better Location approximation.
      var location = {
        hash: "",
        host: "example.com",
        hostname: "example.com",
        href: "http://example.com/foo",
        origin: "http://example.com",
        pathname: "/foo",
        port: "80",
        protocol: "http:",
        search: "",
        toString: function () { return url.format(this); }
      };

      expect(this.router.isSameDomain(location, '/bar')).to.be.true();
      expect(this.router.isSameDomain(location, 'http://example.com/bar')).to.be.true();
      expect(this.router.isSameDomain(location, 'http://other.com/bar')).to.be.false();
      expect(this.router.isSameDomain('/bar', location)).to.be.true();
      expect(this.router.isSameDomain('http://example.com/bar', location)).to.be.true();
      expect(this.router.isSameDomain('http://other.com/bar', location)).to.be.false();
      expect(this.router.isSameDomain(location, location)).to.be.true();
    });
  });

  describe('addRoute', function () {
    it('should add to the routes table', function () {
      this.router.addRoute('test', {
        path: '/test',
        body: Empty
      });

      expect(this.router.routes).to.have.property('test');
    });

    it('should require a path', function () {
      expect(function () {
        this.router.addRoute('test', {
          body: Empty
        });
      }).to.throw();
    });

    it('should require a body component', function () {
      expect(function () {
        this.router.addRoute('test', {
          path: '/test'
        });
      }).to.throw();
    });

    it('should overwrite existing Routes', function () {
      this.router.addRoute('test', {
        path: '/other',
        body: Empty
      });

      expect(this.router.getRoute('/test')).to.be.null();
      expect(this.router.getRoute('/other')).to.exist();
    });
  });

  describe('getRoute', function () {
    beforeEach(function () {
      this.router.addRoute('test', {
        path: '/test',
        body: Empty
      });
    });

    it('should return a Route object', function () {
      expect(this.router.getRoute('/test')).to.be.an('object');
      expect(this.router.getRoute('/test')).to.have.property('body', Empty);
    });

    it('should return null for missing routes', function () {
      expect(this.router.getRoute('/missing')).to.be.null();
    });
  });

  describe('addErrorRoute', function () {
    it('should add to the errors table', function () {
      this.router.addErrorRoute(400, {
        body: Empty
      });

      expect(this.router.errors).to.have.property('400');
    });

    it('should accept error names', function () {
      this.router.addErrorRoute('BadRequest', {
        body: Empty
      });

      expect(this.router.errors).to.have.property('400');
    });

    it('should require a body component', function () {
      expect(function () {
        this.router.addErrorRoute(400, {
        });
      }).to.throw();
    });
  });

  describe('getErrorRoute', function () {
    beforeEach(function () {
      this.router.addErrorRoute(400, {
        body: Empty
      });
    });

    it('should return a Route object', function () {
      expect(this.router.getErrorRoute(400)).to.be.an('object');
      expect(this.router.getErrorRoute(400)).to.have.property('body', Empty);
    });

    it('should return null for missing error routes', function () {
      expect(this.router.getErrorRoute(500)).to.be.null();
    });

    it('should accept error names', function () {
      expect(this.router.getErrorRoute('BadRequest')).to.be.an('object');
      expect(this.router.getErrorRoute('BadRequest')).to.have.property('body', Empty);
    });
  });

  describe('getRouteUrl', function () {
    beforeEach(function () {
      this.router.addRoute('test', {
        path: '/test',
        body: Empty
      });

      this.router.addRoute('test:view', {
        path: '/test/:testId',
        body: Empty
      });
    });

    it('should render parameterless URLs', function () {
      expect(this.router.getRouteUrl('test')).to.equal('/test');
    });

    it('should render parameterful URLs', function () {
      expect(this.router.getRouteUrl('test:view', { testId: 'foo' })).to.equal('/test/foo');
    });

    it('should return null for missing Routes', function () {
      var route = this.router.getRouteUrl('missing');

      expect(route).to.be.null();
    });

    it('should render extra params as a query', function () {
      expect(this.router.getRouteUrl('test', { key: 'val' })).to.equal('/test?key=val');
      expect(this.router.getRouteUrl('test:view', { testId: 'foo', key: 'val' })).to.equal('/test/foo?key=val');
    });
  });
});
