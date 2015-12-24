'use strict';

var _AppContainer = require('./AppContainer');

var _AppContainer2 = _interopRequireDefault(_AppContainer);

var _oneRef = require('./oneRef');

var OneRef = _interopRequireWildcard(_oneRef);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

module.exports = { AppContainer: _AppContainer2.default, Ref: OneRef.Ref, refUpdater: OneRef.refUpdater };