// ==========================================================================
//                              DG.DateTimeAxisViewHelper
//
//  Author:   William Finzer
//
//  Copyright (c) 2016 by The Concord Consortium, Inc. All rights reserved.
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

sc_require('components/graph/axes/axis_view_helper');

/** @class  DG.DateTimeAxisViewHelper - This class is instantiated by instances of
 * DG.CellLinearAxisView in order to draw a datetime axis.
 *
 * @extends DG.AxisViewHelper
 */
DG.DateTimeAxisViewHelper = DG.AxisViewHelper.extend(
    /** @scope DG.DateTimeAxisViewHelper.prototype */ (function () {

      // DateTime levels
      var EDateTimeLevel = {
            eSecond: 0,
            eMinute: 1,
            eHour: 2,
            eDay: 3,
            eMonth: 4,
            eYear: 5
          },
          kSecond = 1000,
          kMinute = kSecond * 60,
          kHour = kMinute * 60,
          kDay = kHour * 24,
          kMonth = kDay * 30,
          kYear = kDay * 365,
          kMonthNames = [
            'DG.Formula.DateShortMonthJanuary',
            'DG.Formula.DateShortMonthFebruary',
            'DG.Formula.DateShortMonthMarch',
            'DG.Formula.DateShortMonthApril',
            'DG.Formula.DateShortMonthMay',
            'DG.Formula.DateShortMonthJune',
            'DG.Formula.DateShortMonthJuly',
            'DG.Formula.DateShortMonthAugust',
            'DG.Formula.DateShortMonthSeptember',
            'DG.Formula.DateShortMonthOctober',
            'DG.Formula.DateShortMonthNovember',
            'DG.Formula.DateShortMonthDecember'
          ];

      /**
       * 1. Compute the outermost date-time level that changes from the
       * minimum to the maximum date.
       * 2. The inner level is one smaller than this unless the difference of
       * the min and max outer levels is greater than some arbitrary minimum,
       * in which case the inner is the same as the outer.
       *
       * @param iMinDate { Number } milliseconds
       * @param iMaxDate { Number } milliseconds
       * @return {{outerLevel: EDateTimeLevel, innerLevel: EDateTimeLevel}}
       */
      function determineLevels(iMinDate, iMaxDate) {
        var tDateDiff = iMaxDate - iMinDate,
            tOuterLevel, tInnerLevel;

        if (tDateDiff < 3 * kMinute) {
          tOuterLevel = EDateTimeLevel.eDay;
          tInnerLevel = EDateTimeLevel.eSecond;
        }
        else if (tDateDiff < 3 * kHour) {
          tOuterLevel = EDateTimeLevel.eDay;
          tInnerLevel = EDateTimeLevel.eMinute;
        }
        else if (tDateDiff < 3 * kDay) {
          tOuterLevel = EDateTimeLevel.eDay;
          tInnerLevel = EDateTimeLevel.eHour;
        }
        else if (tDateDiff < 3 * kMonth) {
          tOuterLevel = EDateTimeLevel.eMonth;
          tInnerLevel = EDateTimeLevel.eDay;
        }
        else if (tDateDiff < 3 * kYear) {
          tOuterLevel = EDateTimeLevel.eYear;
          tInnerLevel = EDateTimeLevel.eMonth;
        }
        else {
          tOuterLevel = EDateTimeLevel.eYear;
          tInnerLevel = EDateTimeLevel.eYear;
        }
        return {
          outerLevel: tOuterLevel,
          innerLevel: tInnerLevel
        };
      }

      /**
       * Given the date value, return the string that fully describes the given
       * level for that date, and return the date corresponding to that string.
       *
       * @param iLevel {EDateTimeLevel}
       * @param iDate {Date } (or value that can be converted to Date. If numeric should be milliseconds)
       * @return {{ labelString: {String}, labelDate: {Date}}}
       */
      function getLevelLabelForValue(iLevel, iDate) {
        var tLabelString = '',
            tLabelDate = NaN;
        if (!DG.isDate(iDate))
          iDate = new Date(iDate);
        if (DG.isDate(iDate)) {
          // We always need the year
          var tYear = iDate.getFullYear(),
              tMonth = iDate.getMonth();

          if (iLevel === EDateTimeLevel.eYear) {
            tLabelString = String(tYear);
            tLabelDate = new Date(tYear, 1, 1);
          }
          else if (iLevel === EDateTimeLevel.eMonth) {
            tLabelDate = new Date(tYear, tMonth, 1);
            tLabelString = kMonthNames[tMonth].loc() + ', ' + tYear;
          }
          else {
            // From below here we'll need the date and its short label
            var tDay = iDate.getDate(),
                tHour = 0,
                tMinute = 0,
                tSecond = 0;

            if (iLevel < EDateTimeLevel.eDay) {
              tHour = iDate.getHours();
              if (iLevel < EDateTimeLevel.eHour) {
                tMinute = iDate.getMinutes();
                if (iLevel < EDateTimeLevel.eMinute) {
                  tSecond = iDate.getSeconds();
                }
              }
            }
              tLabelDate = new Date(tYear, tMonth, tDay, tHour, tMinute, tSecond);
              tLabelString = tLabelDate.toLocaleDateString();
            }
          }

        return {labelString: tLabelString, labelDate: tLabelDate};
      }

      /**
       * Return as both string and date, the date that represents the "next" date
       * at the given level; e.g. after Dec 1, 2001 at the month level, comes Jan 1, 2002.
       *
       * @param iLevel {EDateTimeLevel}
       * @param iDate {Date } (or value that can be converted to Date. If numeric should be in ms)
       * @return {{ labelString: {String}, labelDate: {Date}}}
       */
      function getNextLevelLabelForValue(iLevel, iDate) {
        var tNextDate;
        if (!DG.isDate(iDate))
          iDate = new Date(iDate);
        if (DG.isDate(iDate)) {
          var tYear = iDate.getFullYear(),
              tMonth = iDate.getMonth(),
              tDayOfMonth = iDate.getDate(),
              tHour = iDate.getHours(),
              tMinute = iDate.getMinutes(),
              tSecond = iDate.getSeconds();
          switch (iLevel) {
            case EDateTimeLevel.eYear:
              tYear++;
              break;
            case EDateTimeLevel.eMonth:
              tMonth++;
              if (tMonth > 12) {
                tYear++;
                tMonth = 1;
              }
              break;
            case EDateTimeLevel.eDay:
              tDayOfMonth++;
              break;
            case EDateTimeLevel.eHour:
              tHour++;
              if (tHour > 24) {
                tDayOfMonth++;
                tHour = 0;
              }
              break;
            case EDateTimeLevel.eMinute:
              tMinute++;
              if (tMinute > 60) {
                tHour++;
                tMinute = 0;
              }
              break;
            case EDateTimeLevel.eSecond:
              tSecond++;
              if (tSecond > 60) {
                tMinute++;
                tSecond = 0;
              }
              break;
            default:
          }

          if (iLevel <= EDateTimeLevel.eHour)	// It was either year or month level
            tNextDate = new Date(tYear, tMonth, tDayOfMonth, tHour, tMinute, tSecond);
          else
            tNextDate = new Date(tYear, tMonth, tDayOfMonth);
        }

        return getLevelLabelForValue(iLevel, tNextDate);
      }

      /**
       * Return a date and its string representation that is an exact value for the given level and is at or
       * above the given date.
       *
       * @param iLevel {EDateTimeLevel}
       * @param iDate {Date } (or value that can be converted to Date)
       * @return {{ labelString: {String}, labelDate: {Date}}}
       */
      function findFirstDateAboveOrAtLevel(iLevel, iDate) {
        var tResultDate = NaN,
            tLabelString = '';
        if (!DG.isDate(iDate))
          iDate = new Date(iDate);
        if (DG.isDate(iDate)) {
          var tYear = iDate.getFullYear(),
              tMonth = iDate.getMonth(),
              tDayOfMonth = iDate.getDate(),
              tHour = iDate.getHours(),
              tMinute = iDate.getMinutes(),
              tSecond = iDate.getSeconds();
          switch (iLevel) {
            case EDateTimeLevel.eYear:
              tResultDate = new Date(tYear, 1, 1);
              if (tResultDate.valueOf() < iDate.valueOf())
                tResultDate = new Date(++tYear, 1, 1);
              tLabelString = String(tYear);
              break;
            case EDateTimeLevel.eMonth:
              tResultDate = new Date(tYear, tMonth, 1);
              if (tResultDate.valueOf() < iDate.valueOf()) {
                tMonth++;
                if (tMonth > 12) {
                  tYear++;
                  tMonth = 1;
                }
                tResultDate = new Date(tYear, tMonth, 1);
              }
              tLabelString = kMonthNames[tResultDate.getMonth()].loc();
              break;
            case EDateTimeLevel.eDay:
              tResultDate = new Date(tYear, tMonth, tDayOfMonth);
              if (tResultDate.valueOf() < iDate.valueOf()) {
                tDayOfMonth++;
                tResultDate = new Date(tYear, tMonth, tDayOfMonth);
              }
              tDayOfMonth = tResultDate.getDate();
              tLabelString = String(tDayOfMonth);
              break;
            case EDateTimeLevel.eHour:
              tResultDate = new Date(tYear, tMonth, tDayOfMonth, tHour);
              if (tResultDate.valueOf() < iDate.valueOf()) {
                tHour++;
                tResultDate = new Date(tYear, tMonth, tDayOfMonth, tHour);
              }
              tHour = tResultDate.getHours();
              tLabelString = tHour + ':00';
              break;
            case EDateTimeLevel.eMinute:
              tResultDate = new Date(tYear, tMonth, tDayOfMonth, tHour, tMinute);
              if (tResultDate.valueOf() < iDate.valueOf())
                tResultDate = new Date(tYear, tMonth, tDayOfMonth, tHour, ++tMinute);
              tMinute = tResultDate.getMinutes();
              tLabelString = String(tMinute);
              break;
            case EDateTimeLevel.eSecond:
              tResultDate = new Date(tYear, tMonth, tDayOfMonth, tHour, tMinute, tSecond);
              if (tResultDate.valueOf() < iDate.valueOf())
                tResultDate = new Date(tYear, tMonth, tDayOfMonth, tHour, tMinute, tSecond);
              tSecond = tResultDate.getSeconds();
              tLabelString = String(tSecond);
              break;
            default:
          }
        }

        return {labelString: tLabelString, labelDate: tResultDate};
      }

      /**
       * Return a date that is greater than the given date by the given increment
       * at the given level.
       *
       * @param iLevel {EDateTimeLevel}
       * @param iDate {Date } (or value that can be converted to Date)
       * @return {{ labelString: {String}, labelDate: {Date}}}
       */
      function getLabelForIncrementedDateAtLevel(iLevel, iDate, iIncrementBy) {
        var tResultDate = NaN,
            tLabelString = '';
        if (!DG.isDate(iDate))
          iDate = new Date(iDate);
        if (DG.isDate(iDate)) {
          var tYear = iDate.getFullYear(),
              tMonth = iDate.getMonth(),
              tDayOfMonth = iDate.getDate(),
              tHour = iDate.getHours(),
              tMinute = iDate.getMinutes(),
              tSecond = iDate.getSeconds(),
              tMinuteString, tSecondString;
          switch (iLevel) {
            case EDateTimeLevel.eYear:
              tYear += iIncrementBy;
              tResultDate = new Date(tYear, 1, 1);
              tLabelString = String(tYear);
              break;
            case EDateTimeLevel.eMonth:
              tMonth += iIncrementBy;
              while (tMonth > 12) {
                tYear++;
                tMonth -= 12;
              }
              tResultDate = new Date(tYear, tMonth, 1);
              tLabelString = kMonthNames[tResultDate.getMonth()].loc();
              break;
            case EDateTimeLevel.eDay:
              tDayOfMonth += iIncrementBy;
              tResultDate = new Date(tYear, tMonth, tDayOfMonth);
              tDayOfMonth = tResultDate.getDate();
              tLabelString = String(tDayOfMonth);
              break;
            case EDateTimeLevel.eHour:
              tHour += iIncrementBy;
              while (tHour > 24) {
                tDayOfMonth++;
                tHour -= 24;
              }
              tResultDate = new Date(tYear, tMonth, tDayOfMonth, tHour);
              tHour = tResultDate.getHours();
              tLabelString = tHour + ':00';
              break;
            case EDateTimeLevel.eMinute:
              tMinute += iIncrementBy;
              tResultDate = new Date(tYear, tMonth, tDayOfMonth, tHour, tMinute);
              tMinute = tResultDate.getMinutes();
              tMinuteString = tMinute < 10 ? '0' + tMinute : String(tMinute);
              tLabelString = tHour + ':' + tMinuteString;
              break;
            case EDateTimeLevel.eSecond:
              tSecond += iIncrementBy;
              tResultDate = new Date(tYear, tMonth, tDayOfMonth, tHour, tMinute, tSecond);
              tSecond = tResultDate.getSeconds();
              tMinuteString = tMinute < 10 ? '0' + tMinute : String(tMinute);
              tSecondString = tSecond < 10 ? '0' + tSecond : String(tSecond);
              tLabelString = tHour + ':' + tMinuteString + ':' + tSecondString;
              break;
            default:
          }
        }

        return {labelString: tLabelString, labelDate: tResultDate};
      }

      return {

        /**
         * Determine whether there are one or two levels, and draw accordingly
         */
        drawTicks: function () {
          var tLower = 1000 * this.get('lowerBound'), // milliseconds
              tUpper = 1000 * this.get('upperBound');
          if (SC.none(tLower) || SC.none(tUpper) || (tUpper === tLower))
              return; // not yet ready
          var tLevels = determineLevels(tLower, tUpper),
              tNumLevels = (tLevels.outerLevel !== tLevels.innerLevel) ? 2 : 1,
              tMaxNumberExtent = tNumLevels * DG.RenderingUtilities.kDefaultFontHeight;
          if (tMaxNumberExtent !== this.get('maxNumberExtent')) {
            this.set('maxNumberExtent', tMaxNumberExtent);
          }
          else {
            if (tNumLevels === 2) {
            this.drawOuterLabels(tLevels.outerLevel);
          }
          this.drawInnerLabels(tLevels.innerLevel);
          }
        },

        /**
         *
         * @param iLevel {EDateTimeLevel}
         */
        drawOuterLabels: function (iLevel) {
          var tPaper = this.get('paper'),
              tElementsToClear = this.get('elementsToClear'),
              tRotation = 0,	// Default is unrotated
              tRefPoint = {x: 0, y: 0},
              tOrientation = this.get('orientation'),
              tLowerBoundsSec = this.get('lowerBound'),
              tLowerBoundsMS = tLowerBoundsSec * 1000,
              tUpperBoundsSec = this.get('upperBound'),
              tUpperBoundsMS = tUpperBoundsSec * 1000,
              tPixelMin = this.get('pixelMin'),
              tPixelMax = this.get('pixelMax'),
              tThisLabel, tNextLabel,
              tFirstLabelString,
              tCoord,
              tSomethingDrawn = false;

          var drawOneOuterLabel = function (iCoord, iRefPoint, iLabelString, iRotation, iTextAnchor) {
            var tElement;
            switch (tOrientation) {
              case 'horizontal':
                iCoord += tPixelMin;	// offset by left start of axis
                iRefPoint.x = iCoord;
                break;
              case 'vertical':
                iCoord += tPixelMax;	// offset by top start of axis
                iRefPoint.y = iCoord;
                break;
            }
            tElement = tPaper.text(iRefPoint.x, iRefPoint.y, iLabelString)
                .attr({'text-anchor': iTextAnchor});
            DG.RenderingUtilities.rotateText(tElement, iRotation, iRefPoint.x, iRefPoint.y);
            tElementsToClear.push(tElement);
          }.bind(this);

          if (tOrientation === 'horizontal') {
            tRefPoint.y = 1.5 * DG.RenderingUtilities.kDefaultFontHeight + this.kTickLength + this.kAxisGap;
          }
          else {	// 'vertical'
            tRefPoint.x = this.getPath('axisView.layout').width - this.kAxisGap -
                this.kTickLength - 1.5 * DG.RenderingUtilities.kDefaultFontHeight;
            tRotation = -90;
          }
          tThisLabel = getLevelLabelForValue(iLevel, tLowerBoundsMS);
          tFirstLabelString = tThisLabel.labelString;	// Make a copy because it might be what we end up drawing

          while (true) {  // eslint-disable-line no-constant-condition
            tNextLabel = getNextLevelLabelForValue(iLevel, tThisLabel.labelDate);
            if (isNaN(tNextLabel.labelDate))
              break;	// we break on invalid dates. Instead of breaking, we could attempt to go on to format any valid
            // dates that are in our range

            if (tThisLabel.labelDate > tUpperBoundsMS) {
              if (!tSomethingDrawn) {
                // This is the special case of one outer label spanning the whole axis
                tCoord = this.dataToCoordinate((tLowerBoundsSec + tUpperBoundsSec) / 2);
                drawOneOuterLabel(tCoord, tRefPoint, tFirstLabelString, tRotation, 'middle');
              }
              break;	// Nothing more to do
            }
            else if (tSomethingDrawn || (tNextLabel.labelDate < tUpperBoundsMS)) {	// This is the normal case
              tCoord = this.dataToCoordinate(Math.max(tThisLabel.labelDate / 1000, tLowerBoundsSec));
              var tOKToDraw = true;
              if (tThisLabel.labelDate < tLowerBoundsMS) {
                // If drawing this label will overlap the next label, then don't draw it
                var tTextExtent = DG.RenderingUtilities.textExtentOnCanvas(tPaper, tNextLabel.labelString),
                    tNextCoord = this.dataToCoordinate(tNextLabel.labelDate / 1000);
                if (tTextExtent.x > 7 * Math.abs(tNextCoord - tCoord) / 8)
                  tOKToDraw = false;
              }
              if (tOKToDraw)
                drawOneOuterLabel(tCoord, tRefPoint, tThisLabel.labelString, tRotation, 'start');
              tSomethingDrawn = true;	// even if we really didn't
            }
            tThisLabel = tNextLabel;
          }
        },

        drawInnerLabels: function (iLevel) {

          var findDrawValueModulus = function (iInnerLevel, iFirstDateLabel) {
                var tInterval = 1,
                    tFoundWorkableInterval = false;
                while (!tFoundWorkableInterval) {
                  var tDate = iFirstDateLabel.labelDate,
                      tLabel = iFirstDateLabel.labelString,
                      tCurrentDateLabel = iFirstDateLabel,
                      tLastPixelUsed,
                      tFirstTime = true,
                      tFoundCollision = false;
                  while (!tFoundCollision && (tDate < tUpperBounds)) {
                    var tPixel = this.dataToCoordinate(tDate / 1000),
                        tTextExtent = DG.RenderingUtilities.textExtentOnCanvas(tPaper, tLabel),
                        tHalfWidth = 5 * tTextExtent.x / 8,	// Overestimation creates gap between labels
                        tOverlapped = (tOrientation === 'horizontal') ?
                                        tPixel - tHalfWidth < tLastPixelUsed :
                                        tPixel + tHalfWidth > tLastPixelUsed;
                    if (tFirstTime || !tOverlapped) {
                      tFirstTime = false;
                      tLastPixelUsed = tPixel + ((tOrientation === 'horizontal') ? tHalfWidth : -tHalfWidth);
                      tCurrentDateLabel = getLabelForIncrementedDateAtLevel(iInnerLevel, tDate, tInterval);
                      tDate = tCurrentDateLabel.labelDate;
                      tLabel = tCurrentDateLabel.labelString;
                    }
                    else
                      tFoundCollision = true;
                  }
                  if (tFoundCollision)
                    tInterval++;
                  else
                    tFoundWorkableInterval = true;
                }
                return tInterval;
              }.bind(this),

              drawTickAndLabel = function (iDateLabel, iDrawLabel) {
                var tRotation = 0,
                    tRefPoint = {x: 0, y: 0},
                    tTickStart = 0,
                    tPixel = this.dataToCoordinate(iDateLabel.labelDate / 1000);
                if (tOrientation === 'horizontal') {
                  tRefPoint.y = this.kTickLength + this.kAxisGap + DG.RenderingUtilities.kDefaultFontHeight / 2;
                  tTickStart = 0;	// y-value
                  tPixel += tPixelMin;
                  tRefPoint.x = tPixel;
                  tElementsToClear.push(
                      tPaper.line(tPixel, 0, tPixel, this.kTickLength)
                  );
                }
                else {	// 'vertical'
                  tRotation = -90;
                  tTickStart = this.getPath('axisView.layout').width;	// x-value
                  tRefPoint.x = tTickStart - this.kTickLength - this.kAxisGap -
                      DG.RenderingUtilities.kDefaultFontHeight / 2;
                  tPixel += tPixelMax;
                  tRefPoint.y = tPixel;
                  tElementsToClear.push(
                      tPaper.line(tTickStart, tPixel, tTickStart - this.kTickLength, tPixel)
                  );
                }

                if (iDrawLabel) {
                  var tElement = tPaper.text(tRefPoint.x, tRefPoint.y, iDateLabel.labelString);
                  DG.RenderingUtilities.rotateText(tElement, tRotation, tRefPoint.x, tRefPoint.y);
                  tElementsToClear.push(tElement);
                }
              }.bind(this);

          var tUpperBounds = this.get('upperBound') * 1000,
              tOrientation = this.get('orientation'),
              tPixelMax = this.get('pixelMax'),
              tPixelMin = this.get('pixelMin'),
              tElementsToClear = this.get('elementsToClear'),
              tPaper = this.get('paper'),
              tDateLabel = findFirstDateAboveOrAtLevel(iLevel, this.get('lowerBound') * 1000),
              tDrawValueModulus = findDrawValueModulus(iLevel, tDateLabel),
              tCounter = 0;

          // To get the right formatting we have to call as below. Use 0 as increment for first time through.
          tDateLabel = getLabelForIncrementedDateAtLevel(iLevel, tDateLabel.labelDate, 0);

          while (tDateLabel.labelDate < tUpperBounds) {
            drawTickAndLabel(tDateLabel, tCounter === 0);
            tCounter = (tCounter + 1) % tDrawValueModulus;
            tDateLabel = getLabelForIncrementedDateAtLevel(iLevel, tDateLabel.labelDate, 1);
          }
        },

        /**
         Call the given function once for each tick with arguments
         iWorldCoordinateOfTick, iScreenCoordinateOfTick
         @param {Function} to be called for each tick
         */
        forEachTickDo: function( iDoF) {
          var tLower = 1000 * this.get('lowerBound'), // milliseconds
              tUpper = 1000 * this.get('upperBound'),
              tLevels = determineLevels(tLower, tUpper),
              tDateLabel = findFirstDateAboveOrAtLevel(tLevels.innerLevel, tLower),
              tValue;
          while (tDateLabel.labelDate < tUpper) {
            tValue = tDateLabel.labelDate.valueOf();
            iDoF( tValue, this.dataToCoordinate( tValue / 1000));
            tDateLabel = getLabelForIncrementedDateAtLevel(tLevels.innerLevel, tDateLabel.labelDate, 1);
          }
        }

      };
    }()));

