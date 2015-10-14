/**
 * Generic AppContainer for unsing OneRef with React.
 *
 * usage:
 *
 *   import MyApp from './myApp';  // React class 
 *   <AppContainer appClass={MyApp} stateRef={...}  />,
 *
 * creates an instance of appClass, passing appState (current value of stateRef)
 * and stateRefUpdater as properties.
 *
 * Listens for changes on stateRef, setting local state (which will result in
 * re-rendering children) as needed.
 */

'use strict';

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

var _interopRequireWildcard = require('babel-runtime/helpers/interop-require-wildcard')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _oneRef = require('./oneRef');

var OneRef = _interopRequireWildcard(_oneRef);

function getAppState(stateRef) {
  return { appState: stateRef.getValue() };
}

var AppContainer = (function (_React$Component) {
  _inherits(AppContainer, _React$Component);

  function AppContainer(props) {
    var _this = this;

    _classCallCheck(this, AppContainer);

    _get(Object.getPrototypeOf(AppContainer.prototype), 'constructor', this).call(this, props);
    this.state = getAppState(this.props.stateRef);
    this.state.stateRefUpdater = OneRef.refUpdater(this.props.stateRef);
    this.state.refListener = function () {
      _this._onChange();
    };
  }

  _createClass(AppContainer, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var stateRef = this.props.stateRef;
      stateRef.on("change", this.state.refListener);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      var stateRef = this.props.stateRef;
      stateRef.removeListener("change", this.state.refListener);
    }

    /**
     * @return {object}
     */
  }, {
    key: 'render',
    value: function render() {
      var childProps = { appState: this.state.appState, stateRefUpdater: this.state.stateRefUpdater };
      var childElement = _react2['default'].createElement(this.props.appClass, childProps);
      return childElement;
    }

    /**
     * Event handler for 'change' events coming from the TodoState
     */
  }, {
    key: '_onChange',
    value: function _onChange() {
      this.setState(getAppState(this.props.stateRef));
    }
  }]);

  return AppContainer;
})(_react2['default'].Component);

exports['default'] = AppContainer;
module.exports = exports['default'];