var expect = require('chai').expect;
var cheerio = require('cheerio');
var Container = require('../lib/container');
var Context = require('../lib/context');
var StaticRenderer = require('../lib/renderers/static');
var MixedIn = require('./fixtures/components/mixed-in');

var TEMPLATE = '<html><head></head><body>{body}</body></html>';

describe('Mixin', function () {
  before(function () {
    var context = new Context();
    var renderer = new StaticRenderer({ template: TEMPLATE });
    var route = {
      body: MixedIn
    };

    // Create data that MixedIn will expect.
    // TODO(schoon) - Test rendering MixedIn without everything it expects.
    context.createStore('test')
      .define('foo', 'bar');
    context.createStore('answers')
      .define('everything', 42);

    this.html = renderer.render(route, context);
    this.$ = cheerio.load(this.html);
  });

  it('should not affect rendered HTML', function () {
    var $mixedIn = this.$('.mixed-in');

    expect($mixedIn).to.have.length(1);
    expect($mixedIn.find('.foo')).to.have.length(1);
    expect($mixedIn.find('.data')).to.have.length(1);
    expect($mixedIn.find('.context')).to.have.length(1);
  });

  it('should provide String mappings', function () {
    var $foo = this.$('.mixed-in .foo');

    expect($foo.text()).to.equal('bar');
  });

  it('should provide Function mappings', function () {
    var $data = this.$('.mixed-in .data');

    expect($data.text()).to.equal('42');
  });

  it('should provide the Context', function () {
    var $context = this.$('.mixed-in .context');

    expect($context.text()).to.equal(JSON.stringify(Container.AVAILABLE_FUNCTIONS));
  });
});
