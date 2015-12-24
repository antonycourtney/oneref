'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _react = require('react');

var _react2 = _interopRequireDefault(_react);

var _oneRef = require('./oneRef');

var OneRef = _interopRequireWildcard(_oneRef);

function _interopRequireWildcard(obj) { if (obj && obj.__esModule) { return obj; } else { var newObj = {}; if (obj != null) { for (var key in obj) { if (Object.prototype.hasOwnProperty.call(obj, key)) newObj[key] = obj[key]; } } newObj.default = obj; return newObj; } }

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } /**
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

function getAppState(stateRef) {
  return { appState: stateRef.getValue() };
}

var AppContainer = (function (_React$Component) {
  _inherits(AppContainer, _React$Component);

  function AppContainer(props) {
    _classCallCheck(this, AppContainer);

    var _this = _possibleConstructorReturn(this, Object.getPrototypeOf(AppContainer).call(this, props));

    _this.state = getAppState(_this.props.stateRef);
    _this.state.stateRefUpdater = OneRef.refUpdater(_this.props.stateRef);
    _this.state.refListener = function () {
      _this._onChange();
    };
    return _this;
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
      var childElement = _react2.default.createElement(this.props.appClass, childProps);
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
})(_react2.default.Component);

exports.default = AppContainer;