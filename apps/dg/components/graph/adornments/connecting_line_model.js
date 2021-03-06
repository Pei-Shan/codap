// ==========================================================================
//                        DG.ConnectingLineModel
//
//  Model for connecting lines between case icons in a scatterplot.
//  Points to connect are ordered by x-axis value by default, not case order.
//
//  Author:   Craig D. Miller
//
//  Copyright ©2012-13 Scientific Reasoning Research Institute,
//                  University of Massachusetts Amherst
//
//  Licensed under the Apache License, Version 2.0 (the "License");
//  you may not use this file except in compliance with the License.
//  You may obtain a copy of the License at
//
//    http://www.apache.org/licenses/LICENSE-2.0
//
//  Unless required by applicable law or agreed to in writing, software
//  distributed under the License is distributed on an "AS IS" BASIS,
//  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  See the License for the specific language governing permissions and
//  limitations under the License.
// ==========================================================================

sc_require('components/graph/adornments/plot_adornment_model');

/**
 * @class  The model for a plotted average (mean or median).
 * @extends SC.Object
*/
DG.ConnectingLineModel = DG.PlotAdornmentModel.extend(
/** @scope DG.ConnectingLineModel.prototype */
{
  parents: null,      // [{Case}], the parents, if any, encountered while constructing values

  /**
   * @private
   * @property{[[{ x,y }]]} array of arrays of one point per non-missing value in the plot
   */
  _values: null,

  values: function( iKey, iValues) {
    if( iValues) {
      this._values = iValues;
    }
    else {
      this.recomputeValueIfNeeded();
    }
    return this._values;
  }.property(),

  // Maps will set this to false
  sortOnXValues: true,

  /**
   * True if we need to compute new values to match new cells.
   * Note that this does not detect data changes where means need recomputing anyway.
   * @return { Boolean }
   */
  isComputingNeeded: function() {
    return this._needsComputing && this.isVisible;
  },

  /**
   * Note that our mean values are out of date, for lazy evaluation.
   * Dependencies, which will require a recompute
   *  - case-attribute-values added/deleted/changed for the primary and secondary axis attribute(s)
   *  - primary or secondary axis attributes changed (from one attribute to another)
   *  - axis models changed (must be up to date when we use them here)
   */
  setComputingNeeded: function() {
    this._needsComputing = true;
  },
  
  /**
    Use the bounds of the given axes to recompute slope and intercept.
  */
  recomputeValueIfNeeded: function() {
    if( this.isComputingNeeded())
      this.recomputeValue();
  },

  /**
    * Compute or re-compute the lines. Creates an array of objects, each having a color and
    * an array of world coordinate values to connect, which also determines the connection order.
    */
  recomputeValue: function() {
    var tCases = this.getPath('plotModel.cases'),
        tParents = [],
        tXVarID = this.getPath( 'plotModel.xVarID'),
        tYKey = 'plotModel.' + (this.getPath('plotModel.verticalAxisIsY2') ? 'y2VarID' : 'yVarID'),
        tYVarID = this.getPath(tYKey),
        /* For maps, plotModel is pointing to a mapDataConfiguration whereas for graphs it's pointing to a Plot. */
        tLegendDesc = this.getPath('plotModel.dataConfiguration.legendAttributeDescription') ||
            this.getPath('plotModel.legendAttributeDescription');
    if( !( tXVarID && tYVarID )) {
      return; // too early to recompute, caller must try again later.
    }

    var getColorMap = function() {
      var tMap = null,
          tLegendIsCategorical = tLegendDesc && tLegendDesc.get('isCategorical'),
          tFirstCase = tCases[0];
      if( tLegendIsCategorical && tFirstCase) {
        var tCaseParentCollectionID = tFirstCase.getPath('parent.collection.id'),
            tLegendCollID = tLegendDesc.getPath( 'collectionClient.id');
        if( tCaseParentCollectionID === tLegendCollID)
            tMap = tLegendDesc.getPath('attribute.colormap');
      }
      return tMap;
    }.bind( this);

    // create an array of points to connect for each parent collection
    var tValues = {},
        tColorMap = getColorMap();
    tCases.forEach( function( iCase, iIndex ) {
      var tXVal = iCase.getNumValue( tXVarID),
          tYVal = iCase.getNumValue( tYVarID ),
          tParent = iCase.get('parent' ),
          tParentID = tParent ? tParent.get('id') : 'top';
      if (isFinite(tXVal) && isFinite(tYVal)) { // if both values exist (else skip missing points)
        if (!tValues[tParentID]) {
          tValues[tParentID] = {
            color: (tColorMap ? (tColorMap[iCase.getValue(tLegendDesc.getPath('attribute.id'))]) :
                null),
            coordinates: []
          };
        }
        tParents.push(tParent);
      }
      tValues[ tParentID].coordinates.push( { x: tXVal, y: tYVal, theCase: iCase } );
    });

    if( this.get('sortOnXValues')) {
      DG.ObjectMap.forEach(tValues, function (iKey, iLine) {
        // sort on x value (then y if x equal) for proper connection order
        iLine.coordinates.sort(function (a, b) {
          return (a.x > b.x) ? 1 : ((b.x > a.x) ? -1 : ((a.y > b.y) ? 1 : ((b.y > a.y) ? -1 : 0)));
        });
      });
    }

    this.set('parents', tParents);
    this._needsComputing = false;
    this.set( 'values', DG.ObjectMap.values( tValues) ); // we expect view to observe this change
  },

  /**
    Private cache.
    @property { Boolean }
  */
  _needsComputing: true,

  /**
   * Pass this along
   * @param iIndex {Number} of parent
   * @param iExtend {Boolean}
   */
  selectParent: function( iIndex, iExtend) {
    var tParents = this.get('parents');
    if( SC.isArray( tParents) && iIndex < tParents.length) {
      var tParent = tParents[ iIndex],
          tChange = {
            operation: 'selectCases',
            collection: tParent.get('collection'),
            cases: [ tParent ],
            select: true,
            extend: iExtend
          };

      this.getPath('plotModel.dataContext').applyChange( tChange);
      if( tChange.select)
        DG.logUser("lineSelected: %@", iIndex);
      else
        DG.logUser("lineDeselected: %@", iIndex);
    }
  }

});

DG.PlotAdornmentModel.registry.connectingLine = DG.ConnectingLineModel;


