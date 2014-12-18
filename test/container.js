var expect = require('chai').expect;
var cheerio = require('cheerio');
var Context = require('../lib/context');
var StaticRenderer = require('../lib/renderers/static');
var Empty = require('./fixtures/components/empty');

var TEMPLATE = '<html><head></head><body>{body}</body></html>';

describe('Container', function () {
  before(function () {
    var context = new Context();
    var renderer = new StaticRenderer({ template: TEMPLATE });
    var route = { body: Empty };

    this.html = renderer.render(route, context);
    this.$ = cheerio.load(this.html);
  });

  it('should not affect rendered HTML', function () {
    var contents = this.$('body').find('div');

    expect(contents).to.have.length(1);
    expect(contents.find('*')).to.have.length(0);
  });
});
