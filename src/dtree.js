import TreeBuilder from './builder.js';

const dTree = {

  VERSION: '/* @echo DTREE_VERSION */',

  init: function(data, options = {}) {

    var opts = _.defaultsDeep(options || {}, {
      target: '#graph',
      debug: false,
      width: 600,
      height: 600,
      callbacks: {
        nodeClick: function(name, extra, id) {},
        nodeSize: function(nodes, width, textRenderer) {
          return TreeBuilder._nodeSize(nodes, width, textRenderer);
        },
        nodeSorter: function(aName, aExtra, bName, bExtra) {return 0;},
        textRenderer: function(name, extra, textClass) {
          return TreeBuilder._textRenderer(name, extra, textClass);
        },
      },
      margin: {
        top: 50,
        right: 0,
        bottom: 0,
        left: 0
      },
      nodeWidth: 100,
      styles: {
        node: 'node',
        linage: 'linage',
        marriage: 'marriage',
        text: 'nodeText'
      }
    });

    this.process(data);
    const hierarchyData = d3.hierarchy(data);
    const treeBuilder = new TreeBuilder(hierarchyData, [], opts);
    treeBuilder.create();
  },
  mapClass: function(label) {
    const d = {
      'person': 'person',
      'company': 'company'
    };

    return d[label];
  },

  mapTextClass: function(label) {
    const d = {
      'person': 'person-text',
      'company': 'company-text'
    };
    return d[label];
  },

  addStyle: function(nodes, label) {
    const style = {
      class: this.mapClass(label),
      textClass: this.mapTextClass(label)
    };

    _.merge(nodes, style);
  },

  listOfAttributes: ['percentage', 'location', 'gender', 'news'],

  compactExtraInfo: function(nodes, listOfAttributes) {
    nodes.data = _.pick(nodes, listOfAttributes);
  },

  process: function(nodes) {

    if (!nodes) {
      return;
    }

    const label = nodes.type;

    this.addStyle(nodes, label);
    this.compactExtraInfo(nodes, this.listOfAttributes);

    const processFunction = this.process.bind(this);

    (nodes.children || []).forEach(function(child) {
      processFunction(child);
    });
  }
};

export default dTree;
