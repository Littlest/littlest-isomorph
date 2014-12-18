var fs = require('fs');
var path = require('path');
var expect = require('chai').expect;
var Context = require('../../lib/context');
var StaticRenderer = require('../../lib/renderers/static');
var Head = require('../fixtures/components/head');
var Body = require('../fixtures/components/body');

var TEMPLATE_PATH_WITH_HEAD = path.resolve(__dirname, '..', 'fixtures', 'templates', 'with-head.html');
var TEMPLATE_PATH_WITHOUT_HEAD = path.resolve(__dirname, '..', 'fixtures', 'templates', 'no-head.html');
var TEMPLATE_PATH_WITHOUT_BODY = path.resolve(__dirname, '..', 'fixtures', 'templates', 'no-body.html');
var STATIC_TEMPLATE = fs.readFileSync(TEMPLATE_PATH_WITH_HEAD, 'utf8');

// TODO(schoon) - Find a simple HTML assertion library.
function getTagOpenRegex(tag) {
  return new RegExp('(<' + (tag || 'div') + '[^>]*>)');
}

function getTagContentsRegex(tag) {
  tag = tag || 'div';
  return new RegExp('<' + tag + '[^>]*>([^<]*)</' + tag + '>');
}

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
        var bodyRegex = getTagOpenRegex('body');

        expect(html).to.match(bodyRegex);

        var body = bodyRegex.exec(html)[1];

        expect(body).to.contain(' data-reactid="');
        expect(body).to.contain(' data-react-checksum="');
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
        var bodyRegex = getTagOpenRegex('body');

        expect(html).to.match(bodyRegex);

        var body = bodyRegex.exec(html)[1];

        expect(body).to.contain(' data-reactid="');
        expect(body).to.contain(' data-react-checksum="');
      });

      it('should render a static {head}', function () {
        var html = this.renderer.render({
          head: Head,
          body: Body
        });
        var headRegex = getTagOpenRegex('head');

        expect(html).to.match(headRegex);

        var head = headRegex.exec(html)[1];

        expect(head).to.not.contain(' data-reactid="');
        expect(head).to.not.contain(' data-react-checksum="');
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

        this.script = getTagContentsRegex('script').exec(html)[1];
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
