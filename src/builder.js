class TreeBuilder {

  constructor(root, siblings, opts) {
    TreeBuilder.DEBUG_LEVEL = opts.debug ? 1 : 0;

    this.root = root;
    this.siblings = siblings;
    this.opts = opts;

    // flatten nodes
    this.allNodes = this._flatten(this.root);

    // Calculate node size
    let visibleNodes = _.filter(this.allNodes, function(n) {
      return !n.hidden;
    });
    this.nodeSize = opts.callbacks.nodeSize(visibleNodes,
      opts.nodeWidth, opts.callbacks.textRenderer);
  }

  create() {

    let opts = this.opts;
    let allNodes = this.allNodes;
    let nodeSize = this.nodeSize;

    let width = opts.width + opts.margin.left + opts.margin.right;
    let height = opts.height + opts.margin.top + opts.margin.bottom;

    let zoom = d3.zoom()
      .scaleExtent([0.1, 10])
      .on('zoom', function() {
        svg.attr('transform', d3.event.transform.translate(width / 2, opts.margin.top));
      });

    //make an SVG
    let svg = this.svg = d3.select(opts.target)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .call(zoom)
      .append('g')
      .attr('transform', 'translate(' + width / 2 + ',' + opts.margin.top + ')');

    // Compute the layout.
    this.tree = d3.tree()
      .nodeSize([nodeSize[0] * 2, nodeSize[1] * 2.5]);

    this.tree.separation(function separation(a, b) {
      return (a.data.hidden || b.data.hidden) ? .3 : .6;
    });

    this._update(this.root);
  }

  _update(source) {

    let opts = this.opts;
    let allNodes = this.allNodes;
    let nodeSize = this.nodeSize;

    let treenodes = this.tree(source);
    let links = treenodes.links();

    // Create the link lines.
    const linksvgs = this.svg.selectAll('.link')
      .data(links)
      .enter()
      // filter links with no parents to prevent empty nodes
      .filter(function(l) {
        return !l.target.data.noParent;
      });

    linksvgs
      .append('path')
      .attr('class', opts.styles.linage)
      .attr('d', this._elbow);

    var formatPercent = d3.format('.0%');
    linksvgs
      .append('text')
      .attr('x', function(d) {
        const source = d.source;
        const target = d.target;
        return `${target.x}px`;
      })
      .attr('y', function(d) {
        const source = d.source;
        const target = d.target;
        return `${d.target.y - 47}px`;
      })
      .style('fill', 'gray')
      .attr('font-family', 'Source Sans Pro, sans-serif')
      .attr('font-weight', 800)
      .attr('font-size', '10px')
      .attr('text-anchor', 'middle')
      .text(function(d) {
        const source = d.source;
        const target = d.target;
        const percentage = target.data.percentage;
        return formatPercent(percentage);
      });

    let nodes = this.svg.selectAll('.node')
      .data(treenodes.descendants())
      .enter();

    // Create the node svgs.
    let svgs = nodes.append('svg')
      .filter(function(d) {
        return d.data.hidden ? false : true;
      })
      .attr('x', function(d) {
        return d.x - d.cWidth / 2 + 'px';
      })
      .attr('y', function(d) {
        return d.y - d.cHeight / 2 + 'px';
      })
      .attr('width', function(d) {
        return d.cWidth + 'px';
      })
      .attr('height', function(d) {
        return d.cHeight + 'px';
      })
      .attr('id', function(d) {
        return d.id;
      });
    const groups = TreeBuilder._nodeRenderer(svgs);

    const exclamations = this.svg.selectAll('.news-exclamation')
      .data(treenodes.descendants())
      .enter()
      // filter links with no parents to prevent empty nodes
      .filter(function(d) {
        return d.data.news != null;
      });

    exclamations.append('text')
      .attr('class', 'fas fa-exclamation-circle')
      .attr('x', function(d) {
        return d.x + 30 + 'px';
      })
      .attr('y', function(d) {
        return d.y - d.cHeight / 2 + 9 + 'px';
      })
      .style('cursor', 'pointer')
      .attr('fill', 'black')
      .attr('font-size', function(d) { return '1.5em'; })
      .text(function(d) { return '\uf06a'; })
      .on('mouseover', function(d) {
        const newsBox = d3.select(`#news-box-${d.data.id}`);
        newsBox.style('visibility', 'visible');
      })
      .on('mouseout', function(d) {
        const newsBox = d3.select(`#news-box-${d.data.id}`);
        newsBox.style('visibility', 'hidden');
      });

    const exclamationGroups = exclamations.append('g')
      .attr('width', `500px`)
      .attr('height',`500px`)
      .attr('x', function(d) {
        return d.x - d.cWidth / 2 + 'px';
      })
      .attr('y', function(d) {
        return d.y - d.cHeight / 2 + 'px';
      })
      //j.attr('visibility', 'hidden')
      .attr('id', function(d) {
        return `news-box-${d.data.id}`;
      });

    const exclamationHeight = 80;
    const exclamationOffset = 60;
    exclamationGroups.append('rect')
      .attr('class', 'news-box')
      .attr('fill', '#ecf0f1')
      .attr('width', `80px`)
      .attr('height',`${exclamationHeight}px`)
      .attr('x', function(d) {
        return d.x + d.cWidth / 2 + 'px';
      })
      .attr('y', function(d) {
        return d.y - exclamationOffset + 'px';
      })
      .attr('stroke', 'black')
      .attr('stroke-width', 2);

    exclamationGroups.append('text')
      .attr('width', `80px`)
      .attr('x', function(d) {
        return d.x + d.cWidth / 2 + 'px';
      })
      .attr('y', function(d) {
        return d.y + 'px';
      })
      .text('hello world');
  }

  _flatten(root) {
    let n = [];
    let i = 0;

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

  _elbow(d, i) {
    if (d.target.data.noParent) {
      return 'M0,0L0,0';
    }

    // seperation of nodes height
    let ny = d.target.y + (d.source.y - d.target.y) * 1;
    const yDelta = -20;

    return `M ${d.target.x} ${d.target.y}` +
           `l ${0} ${yDelta * 2}` +
           `m ${0} ${yDelta}` +
           `L ${d.target.x} ${ny}` +
           `L ${d.source.x} ${d.source.y}` +
           ``;
  }

  static _nodeSize(nodes, width, textRenderer) {
    let maxWidth = 0;
    let maxHeight = 0;
    let tmpSvg = document.createElement('svg');
    document.body.appendChild(tmpSvg);
    _.map(nodes, function(n) {
      let container = document.createElement('div');
      const HARD_CODED_CLASS = 'man' || n.data.class;
      const HARD_CODED_TEXT_CLASS = 'nice' || n.data.textClass;

      container.setAttribute('class', HARD_CODED_CLASS);
      container.style.visibility = 'hidden';
      container.style.maxWidth = `${width}px`;

      let text = textRenderer(n.data.name, n.data.data, HARD_CODED_TEXT_CLASS);
      container.innerHTML = text;

      tmpSvg.appendChild(container);
      let height = container.offsetHeight;
      tmpSvg.removeChild(container);

      maxHeight = Math.max(maxHeight, height);
      n.cHeight = height;

      n.cWidth = n.data.hidden ? 0 : width;
    });
    document.body.removeChild(tmpSvg);

    return [width, maxHeight];
  }

  static depthToColorMap(depth) {
    const entries = {
      0: '#e74c3c',
      1: '#a29bfe',
      2: '#0984e3',
      3: '#fab1a0',
      4: '#636e72',
    };

    const numColors = Object.keys(entries).length;
    return entries[depth % numColors];
  }

  static _nodeRenderer(nodes) {
    const groups = nodes
      .append('g')
      .attr('x', function(d) {return d.x;})
      .attr('y', function(d) {return d.y;})
      .attr('width', function(d) {
        return d.cWidth + 'px';
      })
      .attr('height', function(d) {
        return d.cHeight + 'px';
      });

    const rects = groups
      .append('rect')
      .attr('width', function(d) {
        return d.cWidth + 'px';
      })
      .attr('height', function(d) {
        return d.cHeight + 'px';
      })
      .style('fill', function(d) {
        return TreeBuilder.depthToColorMap(d.depth);
      });

    groups.append('text')
      .attr('x', function(d) {
        return `${d.cWidth / 2}px`;
      })
      .attr('y', function(d) {
        return `${d.cHeight / 2}px`;
      })
      .style('fill', 'white')
      .attr('font-family', 'Source Sans Pro, sans-serif')
      .attr('font-weight', 800)
      .attr('font-size', '10px')
      .attr('text-decoration', 'underline')
      .attr('text-anchor', 'middle')
      .text(function(d) {
        return d.data.name;
      });

    groups.append('text')
      .attr('x', function(d) {
        return `${d.cWidth / 2}px`;
      })
      .attr('y', function(d) {
        return `${10 + d.cHeight / 2}px`;
      })
      .style('fill', 'white')
      .attr('font-family', 'Source Sans Pro, sans-serif')
      .attr('font-weight', 800)
      .attr('font-size', '6px')
      .attr('text-anchor', 'middle')
      .text(function(d) {
        return d.data.location;
      });
    return groups;
  }

  static _textRenderer(name, info, textClass) {
    let node = '';
    node += '<p ';
    node += 'align="center" ';
    node += 'class="' + textClass + '">\n';
    node += name;
    node += '</p>\n';

    if (info.percentage && info.percentage != 'N/A') {
      node += `<p align="center" class="${textClass}"> ${info.percentage}% </p>`;
    }

    if (info.location) {
      node += `<p align="center" class="${textClass}"> ${info.location} </p>`;
    }

    return node;
  }

  static _debug(msg) {
    if (TreeBuilder.DEBUG_LEVEL > 0) {
      console.log(msg);
    }
  }
}

export default TreeBuilder;
