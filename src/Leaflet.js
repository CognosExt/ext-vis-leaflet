import { RenderBase } from '@businessanalytics/customvis-lib'; // rendering
import * as d3 from 'd3';
//import * as d3 from "https://d3js.org/d3-geo.v1.min.js";
import * as Wkt from 'https://cdn.jsdelivr.net/npm/wicket';
//import * } from "https://cdn.jsdelivr.net/npm/leaflet@1.6.0/dist/leaflet.js"
import { Map, TileLayer } from 'https://cdn.jsdelivr.net/npm/leaflet';

const stamenTonerTiles =
  'http://stamen-tiles-{s}.a.ssl.fastly.net/toner-background/{z}/{x}/{y}.png';
const stamenTonerAttr =
  'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>';
const mapCenter = [39.9528, -75.1638];
const zoomLevel = 12;

const WKT = 0;

/**
 * Template for plain Javascript implementations of a visualization. The template functions
 * found in this file are all optional, you can delete the ones you don't need.
 */
class LeafletClass extends RenderBase {
  sizeInvalidated = false;
  mymap;
  create(_node) {
    // Implement this function to provide one-time initialization of the visualization.
    // Return the root node of the visualization.
    this.loadCss('https://cdn.jsdelivr.net/npm/leaflet@1.6.0/dist/leaflet.css');
    this.loadCss('../static/cvLeaflet.css');
    var mapDiv = document.createElement('div');
    mapDiv.id = 'map'; // TODO make this unique to this visualisation

    _node.append(mapDiv);

    return _node;
  }

  setBaseMap(props) {
    var baseMapName = props.get('basemapname');
    if (this.baseMapName == baseMapName) {
      return;
    }
    var lMap = this.map;
    lMap.eachLayer(function(layer) {
      lMap.removeLayer(layer);
    });

    var baseMap = false;
    switch (baseMapName) {
      case 'OpenStreetMap':
        baseMap = new L.TileLayer(
          'http://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        );
        break;
      case 'ESRINationalGeographic':
        baseMap = new L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/NatGeo_World_Map/MapServer/tile/{z}/{y}/{x}',
          {
            attribution:
              'Tiles &copy; Esri &mdash; National Geographic, Esri, DeLorme, NAVTEQ, UNEP-WCMC, USGS, NASA, ESA, METI, NRCAN, GEBCO, NOAA, iPC',
            maxZoom: 16
          }
        );
        break;
      case 'ESRIWorldTopoMap':
        baseMap = new L.tileLayer(
          'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
          {
            attribution:
              'Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community'
          }
        );
        break;
    }
    if (baseMap) {
      lMap.addLayer(baseMap);
    }
  }

  createMap(node) {
    var map = L.map(node).setView([0, 0], 2);

    /*    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);*/
    var svg = d3.select(map.getPanes().overlayPane).append('svg'),
      g = svg.append('g').attr('class', 'leaflet-zoomhide');
    this.map = map;
  }

  update(_info) {
    // Provide the rendering code of your visualization here. This function gets called
    // every time size has changed, there is new data or there are changed properties.
    //_info.node.textContent = "Hello World";
    // Create a new directed graph
    var me = this;
    if (!_info.data) return renderEmpty(_info.node);
    const reason = _info.reason;
    if (reason.data) {
      if (!this.sizeInvalidated) {
        // We create the map here, because if we do it earlier, the container div
        // does not have its final size yet. Which leads to pain and agony.
        this.createMap(_info.node.firstElementChild);
        me.sizeInvalidated = true;
      }
      this.setBaseMap(_info.props);
      this.redraw(_info);
    }
    if (reason.size) {
      return;
    }
    if (reason.properties) {
      this.setBaseMap(_info.props);
      this.redraw(_info);
    }
    if (reason.decorations) {
      this.changeColors(_info);
    }
  }

  changeColors(_info) {
    var node = _info.node;
    if (node == null) {
      console.log('node is null, exit.');
      return;
    }
    var svg = d3.select(this.map.getPanes().overlayPane).select('svg'),
      g = svg.select('g');
    const colorPalette = _info.props.get('color');

    var feature = g
      .selectAll('path')
      .transition()
      .attr('stroke', function(row) {
        return colorPalette.getOutlineColor(row);
      })
      .attr('fill', function(row) {
        return colorPalette.getFillColor(row);
      })
      .attr('fill-opacity', 0.6);
  }

  /**
   * draws the d3 layer on  the map. Very much inspired by https://bost.ocks.org/mike/leaflet/
   */
  redraw(_info) {
    var node = _info.node;
    if (node == null) {
      console.log('node is null, exit.');
      return;
    }
    var me = this;
    var wkt = new Wkt.Wkt();
    var i = 0;
    var geoJson = { type: 'FeatureCollection', features: [] };
    _info.data.rows.forEach(function(row) {
      var one = row.tuple(WKT).caption;

      try {
        var geo = wkt.read(one);
        var item = {
          type: 'Feature',
          geometry: geo.toJson(),
          dataPoint: row
        };
        geoJson.features.push(item);
        row.type = 'Feature';
        row.geometry = geo.toJson();
      } catch (e) {
        console.log('Error on line ' + i, e);
      }
      i++;
    });

    //me.map.setView([37.8, -96.9], 4, { animate: true });
    var svg = d3.select(me.map.getPanes().overlayPane).select('svg'),
      g = svg.select('g');

    var transform = d3.geoTransform({ point: projectPoint }),
      path = d3.geoPath().projection(transform);

    var feature = g
      .selectAll('path')
      .data(_info.data.rows)
      .enter()
      .append('path');

    // after adding a baselayer and postponing drawing the d3 addLayer
    // viewreset does not fire anymore. That is why I added zoomend, which
    // gives a flicker, but at least, works
    me.map.on('viewreset', reset);
    me.map.on('zoomend', reset);
    me.changeColors(_info);
    reset();

    // Reposition the SVG to cover the features.
    function reset() {
      var bounds = path.bounds(geoJson),
        topLeft = bounds[0],
        bottomRight = bounds[1];

      svg
        .attr('width', bottomRight[0] - topLeft[0])
        .attr('height', bottomRight[1] - topLeft[1])
        .style('left', topLeft[0] + 'px')
        .style('top', topLeft[1] + 'px');

      g.attr('transform', 'translate(' + -topLeft[0] + ',' + -topLeft[1] + ')');

      feature.attr('d', path);
    }

    // Use Leaflet to implement a D3 geometric transformation.
    function projectPoint(x, y) {
      var point = me.map.latLngToLayerPoint(new L.LatLng(y, x));
      this.stream.point(point.x, point.y);
    }
  }

  updateProperty(_name, _value) {
    // Implement if you want to process changes to properties.
    // Typically you only need this if you want to modify the active state
    // of properties based on the value of other properties.
  }

  hitTest(_element, _client, _viewPort) {
    // Implement hit testing here. You can return the data element (data point or
    // tuple) that is at the specified client or viewport point. Return null if
    // no data point was hit.

    // all these hits only hit the svg, not any of the paths
    // there is no way to find the path from here

    try {
      var a = document.elementFromPoint(_client.x, _client.y);
      var b = document.elementFromPoint(_viewPort.x, _viewPort.y);
      var c = document.elementsFromPoint(_client.x, _client.y);
      var d = document.elementsFromPoint(_viewPort.x, _viewPort.y);
    } catch (e) {
      console.log(e);
    }

    return super.hitTest(_element, _client, _viewPort);
  }
}

export { LeafletClass };
