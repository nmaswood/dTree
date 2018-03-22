var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() : typeof define === 'function' && define.amd ? define(factory) : global.dTree = factory();
})(this, function () {
  'use strict';

  var TreeBuilder = (function () {
    function TreeBuilder(root, siblings, opts) {
      _classCallCheck(this, TreeBuilder);

      TreeBuilder.DEBUG_LEVEL = opts.debug ? 1 : 0;

      this.root = root;
      this.siblings = siblings;
      this.opts = opts;

      // flatten nodes
      this.allNodes = this._flatten(this.root);

      // Calculate node size
      var visibleNodes = _.filter(this.allNodes, function (n) {
        return !n.hidden;
      });
      this.nodeSize = opts.callbacks.nodeSize(visibleNodes, opts.nodeWidth, opts.callbacks.textRenderer);
    }

    _createClass(TreeBuilder, [{
      key: 'create',
      value: function create() {

        var opts = this.opts;
        var allNodes = this.allNodes;
        var nodeSize = this.nodeSize;

        var width = opts.width + opts.margin.left + opts.margin.right;
        var height = opts.height + opts.margin.top + opts.margin.bottom;

        var zoom = d3.zoom().scaleExtent([0.1, 10]).on('zoom', function () {
          svg.attr('transform', d3.event.transform.translate(width / 2, opts.margin.top));
        });

        //make an SVG
        var svg = this.svg = d3.select(opts.target).append('svg').attr('width', width).attr('height', height).call(zoom).append('g').attr('transform', 'translate(' + width / 2 + ',' + opts.margin.top + ')');

        // Compute the layout.
        this.tree = d3.tree().nodeSize([nodeSize[0] * 2, nodeSize[1] * 2.5]);

        this.tree.separation(function separation(a, b) {
          return a.data.hidden || b.data.hidden ? .3 : .6;
        });

        this._update(this.root);
      }
    }, {
      key: '_update',
      value: function _update(source) {

        var opts = this.opts;
        var allNodes = this.allNodes;
        var nodeSize = this.nodeSize;

        var treenodes = this.tree(source);
        var links = treenodes.links();

        // Create the link lines.
        var linksvgs = this.svg.selectAll('.link').data(links).enter()
        // filter links with no parents to prevent empty nodes
        .filter(function (l) {
          return !l.target.data.noParent;
        });

        linksvgs.append('path').attr('class', opts.styles.linage).attr('d', this._elbow);

        var formatPercent = d3.format('.0%');
        linksvgs.append('text').attr('x', function (d) {
          var source = d.source;
          var target = d.target;
          return target.x + 'px';
        }).attr('y', function (d) {
          var source = d.source;
          var target = d.target;
          return d.target.y - 47 + 'px';
        }).style('fill', 'gray').attr('font-family', 'Source Sans Pro, sans-serif').attr('font-weight', 800).attr('font-size', '10px').attr('text-anchor', 'middle').text(function (d) {
          var source = d.source;
          var target = d.target;
          var percentage = target.data.percentage;
          return formatPercent(percentage);
        });

        var nodes = this.svg.selectAll('.node').data(treenodes.descendants()).enter();

        // Create the node svgs.
        var svgs = nodes.append('svg').filter(function (d) {
          return d.data.hidden ? false : true;
        }).attr('x', function (d) {
          return d.x - d.cWidth / 2 + 'px';
        }).attr('y', function (d) {
          return d.y - d.cHeight / 2 + 'px';
        }).attr('width', function (d) {
          return d.cWidth + 'px';
        }).attr('height', function (d) {
          return d.cHeight + 'px';
        }).attr('id', function (d) {
          return d.id;
        });
        var groups = TreeBuilder._nodeRenderer(svgs);

        var exclamations = this.svg.selectAll('.news-exclamation').data(treenodes.descendants()).enter()
        // filter links with no parents to prevent empty nodes
        .filter(function (d) {
          return d.data.news != null;
        });

        exclamations.append('text').attr('class', 'fas fa-exclamation-triangle').attr('x', function (d) {
          return d.x + 30 + 'px';
        }).attr('y', function (d) {
          return d.y - d.cHeight / 2 + 9 + 'px';
        }).style('cursor', 'pointer').attr('fill', '#B33A3A').attr('font-size', function (d) {
          return '1.5em';
        }).text(function (d) {
          return '';
        }).on('mouseover', function (d) {
          var newsBox = d3.select('#news-box-' + d.data.id);
          newsBox.style('visibility', 'visible');
        }).on('mouseout', function (d) {
          var newsBox = d3.select('#news-box-' + d.data.id);
          newsBox.style('visibility', 'hidden');
        });

        var exclamationGroups = exclamations.append('g').attr('width', '500px').attr('height', '500px').attr('x', function (d) {
          return d.x - d.cWidth / 2 + 'px';
        }).attr('y', function (d) {
          return d.y - d.cHeight / 2 + 'px';
        })
        //j.attr('visibility', 'hidden')
        .attr('id', function (d) {
          return 'news-box-' + d.data.id;
        });

        var exclamationHeight = 80;
        var exclamationOffset = 60;
        exclamationGroups.append('rect').attr('class', 'news-box').attr('fill', '#ecf0f1').attr('width', '80px').attr('height', exclamationHeight + 'px').attr('x', function (d) {
          return d.x + d.cWidth / 2 + 'px';
        }).attr('y', function (d) {
          return d.y - exclamationOffset + 'px';
        }).attr('stroke', 'black').attr('stroke-width', 2);

        exclamationGroups.append('foreignObject').attr('width', '80px').attr('x', function (d) {
          return d.x + d.cWidth / 2 + 'px';
        }).attr('y', function (d) {
          return d.y - 55 + 'px';
        }).html(function (d) {
          return '<p class="text-box"> Hello World </div>';
        });
      }
    }, {
      key: '_flatten',
      value: function _flatten(root) {
        var n = [];
        var i = 0;

        function recurse(node) {
          if (node.children) {
            node.children.forEach(recurse);
          }
          if (!node.id) {
            node.id = ++i;
          }
          n.push(node);
        }
        recurse(root);
        return n;
      }
    }, {
      key: '_elbow',
      value: function _elbow(d, i) {
        if (d.target.data.noParent) {
          return 'M0,0L0,0';
        }

        // seperation of nodes height
        var ny = d.target.y + (d.source.y - d.target.y) * 1;
        var yDelta = -20;

        return 'M ' + d.target.x + ' ' + d.target.y + ('l ' + 0 + ' ' + yDelta * 2) + ('m ' + 0 + ' ' + yDelta) + ('L ' + d.target.x + ' ' + ny) + ('L ' + d.source.x + ' ' + d.source.y) + '';
      }
    }], [{
      key: '_nodeSize',
      value: function _nodeSize(nodes, width, textRenderer) {
        var maxWidth = 0;
        var maxHeight = 0;
        var tmpSvg = document.createElement('svg');
        document.body.appendChild(tmpSvg);
        _.map(nodes, function (n) {
          var container = document.createElement('div');
          var HARD_CODED_CLASS = 'man' || n.data['class'];
          var HARD_CODED_TEXT_CLASS = 'nice' || n.data.textClass;

          container.setAttribute('class', HARD_CODED_CLASS);
          container.style.visibility = 'hidden';
          container.style.maxWidth = width + 'px';

          var text = textRenderer(n.data.name, n.data.data, HARD_CODED_TEXT_CLASS);
          container.innerHTML = text;

          tmpSvg.appendChild(container);
          var height = container.offsetHeight;
          tmpSvg.removeChild(container);

          maxHeight = Math.max(maxHeight, height);
          n.cHeight = height;

          n.cWidth = n.data.hidden ? 0 : width;
        });
        document.body.removeChild(tmpSvg);

        return [width, maxHeight];
      }
    }, {
      key: 'depthToColorMap',
      value: function depthToColorMap(depth) {
        var entries = {
          0: '#e74c3c',
          1: '#a29bfe',
          2: '#0984e3',
          3: '#fab1a0',
          4: '#636e72'
        };

        var numColors = Object.keys(entries).length;
        return entries[depth % numColors];
      }
    }, {
      key: '_nodeRenderer',
      value: function _nodeRenderer(nodes) {
        var groups = nodes.append('g').attr('x', function (d) {
          return d.x;
        }).attr('y', function (d) {
          return d.y;
        }).attr('width', function (d) {
          return d.cWidth + 'px';
        }).attr('height', function (d) {
          return d.cHeight + 'px';
        });

        var rects = groups.append('rect').attr('width', function (d) {
          return d.cWidth + 'px';
        }).attr('height', function (d) {
          return d.cHeight + 'px';
        }).style('fill', function (d) {
          return TreeBuilder.depthToColorMap(d.depth);
        });

        groups.append('text').attr('x', function (d) {
          return d.cWidth / 2 + 'px';
        }).attr('y', function (d) {
          return d.cHeight / 2 + 'px';
        }).style('fill', 'white').attr('class', 'name-text-box').attr('font-family', 'Source Sans Pro, sans-serif').attr('font-weight', 800).attr('font-size', '10px').attr('text-decoration', 'underline').attr('text-anchor', 'middle').text(function (d) {
          return d.data.name;
        });

        console.log('hello world');

        groups.append('text').attr('x', function (d) {
          return d.cWidth / 2 + 'px';
        }).attr('y', function (d) {
          return 10 + d.cHeight / 2 + 'px';
        }).style('fill', 'white').attr('font-family', 'Source Sans Pro, sans-serif').attr('font-weight', 800).attr('font-size', '6px').attr('text-anchor', 'middle').text(function (d) {
          return d.data.location;
        });
        return groups;
      }
    }, {
      key: '_textRenderer',
      value: function _textRenderer(name, info, textClass) {
        var node = '';
        node += '<p ';
        node += 'align="center" ';
        node += 'class="' + textClass + '">\n';
        node += name;
        node += '</p>\n';

        if (info.percentage && info.percentage != 'N/A') {
          node += '<p align="center" class="' + textClass + '"> ' + info.percentage + '% </p>';
        }

        if (info.location) {
          node += '<p align="center" class="' + textClass + '"> ' + info.location + ' </p>';
        }

        return node;
      }
    }, {
      key: '_debug',
      value: function _debug(msg) {
        if (TreeBuilder.DEBUG_LEVEL > 0) {
          console.log(msg);
        }
      }
    }]);

    return TreeBuilder;
  })();

  var dTree = {

    VERSION: '2.0.2',

    init: function init(data) {
      var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

      var opts = _.defaultsDeep(options || {}, {
        target: '#graph',
        debug: false,
        width: 600,
        height: 600,
        callbacks: {
          nodeClick: function nodeClick(name, extra, id) {},
          nodeSize: function nodeSize(nodes, width, textRenderer) {
            return TreeBuilder._nodeSize(nodes, width, textRenderer);
          },
          nodeSorter: function nodeSorter(aName, aExtra, bName, bExtra) {
            return 0;
          },
          textRenderer: function textRenderer(name, extra, textClass) {
            return TreeBuilder._textRenderer(name, extra, textClass);
          }
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
      var hierarchyData = d3.hierarchy(data);
      var treeBuilder = new TreeBuilder(hierarchyData, [], opts);
      treeBuilder.create();
    },
    mapClass: function mapClass(label) {
      var d = {
        'person': 'person',
        'company': 'company'
      };

      return d[label];
    },

    mapTextClass: function mapTextClass(label) {
      var d = {
        'person': 'person-text',
        'company': 'company-text'
      };
      return d[label];
    },

    addStyle: function addStyle(nodes, label) {
      var style = {
        'class': this.mapClass(label),
        textClass: this.mapTextClass(label)
      };

      _.merge(nodes, style);
    },

    listOfAttributes: ['percentage', 'location', 'gender', 'news'],

    compactExtraInfo: function compactExtraInfo(nodes, listOfAttributes) {
      nodes.data = _.pick(nodes, listOfAttributes);
    },

    process: function process(nodes) {

      if (!nodes) {
        return;
      }

      var label = nodes.type;

      this.addStyle(nodes, label);
      this.compactExtraInfo(nodes, this.listOfAttributes);

      var processFunction = this.process.bind(this);

      (nodes.children || []).forEach(function (child) {
        processFunction(child);
      });
    }
  };

  return dTree;
});
//# sourceMappingURL=dTree.js.map
