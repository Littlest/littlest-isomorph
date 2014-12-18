var fs = require('fs');
var path = require('path');
var cheerio = require('cheerio');
var expect = require('chai').expect;
var Context = require('../../lib/context');
var StaticRenderer = require('../../lib/renderers/static');
var Head = require('../fixtures/components/head');
var Body = require('../fixtures/components/body');

var TEMPLATE_PATH_WITH_HEAD = path.resolve(__dirname, '..', 'fixtures', 'templates', 'with-head.html');
var TEMPLATE_PATH_WITHOUT_HEAD = path.resolve(__dirname, '..', 'fixtures', 'templates', 'no-head.html');
var TEMPLATE_PATH_WITHOUT_BODY = path.resolve(__dirname, '..', 'fixtures', 'templates', 'no-body.html');
var STATIC_TEMPLATE = fs.readFileSync(TEMPLATE_PATH_WITH_HEAD, 'utf8');

describe('Static Renderer', function () {
  describe('constructor', function () {
    it('should accept a static template', function () {
      var renderer = StaticRenderer.createRenderer({
        template: STATIC_TEMPLATE
      });
    });

    it('should accept a templatePath', function () {
      var renderer = StaticRenderer.createRenderer({
        templatePath: TEMPLATE_PATH_WITH_HEAD
      });
    });

    it('should require some form of template', function () {
      expect(function () {
        StaticRenderer.createRenderer();
      }).to.throw();
    });

    it('should require a {body} in the template', function () {
      expect(function () {
        StaticRenderer.createRenderer({
          templatePath: TEMPLATE_PATH_WITHOUT_BODY
        });
      }).to.throw();
    });
  });

  describe('render', function () {
    describe('without {head}', function () {
      before(function () {
        this.renderer = StaticRenderer.createRenderer({
          templatePath: TEMPLATE_PATH_WITHOUT_HEAD
        });
      });

      it('should render a saturated {body}', function () {
        var html = this.renderer.render({
          body: Body
        });
        var $body = cheerio.load(html)('body');

        expect($body).to.have.length(1);
        expect($body.attr('data-reactid')).to.exist();
        expect($body.attr('data-react-checksum')).to.exist();
      });
    });

    describe('with {head}', function () {
      before(function () {
        this.renderer = StaticRenderer.createRenderer({
          templatePath: TEMPLATE_PATH_WITH_HEAD
        });
      });

      it('should render a saturated {body}', function () {
        var html = this.renderer.render({
          head: Head,
          body: Body
        });
        var $body = cheerio.load(html)('body');

        expect($body).to.have.length(1);
        expect($body.attr('data-reactid')).to.exist();
        expect($body.attr('data-react-checksum')).to.exist();
      });

      it('should render a static {head}', function () {
        var html = this.renderer.render({
          head: Head,
          body: Body
        });
        var $head = cheerio.load(html)('head');

        expect($head).to.have.length(1);
        expect($head.attr('data-reactid')).to.not.exist();
        expect($head.attr('data-react-checksum')).to.not.exist();
      });
    });

    describe('with a Context', function () {
      before(function () {
        var renderer = StaticRenderer.createRenderer({
          templatePath: TEMPLATE_PATH_WITHOUT_HEAD
        });

        this.context = new Context();
        this.context.createStore('test')
          .define('foo', 'bar');

        var html = renderer.render({
          body: Body
        }, this.context);

        this.script = cheerio.load(html)('script').text();
      });

      it('should render a serialized Context', function () {
        var window = {};

        eval(this.script);

        expect(window.LITTLEST_ISOMORPH_CONTEXT).to.be.an('object');
      });

      it('should render up-to-date Store state', function () {
        var window = {};

        eval(this.script);

        var context = new Context();

        context.fromObject(window.LITTLEST_ISOMORPH_CONTEXT);

        expect(context.getStore('test')).to.have.property('foo', 'bar');
      });
    });
  });
});
