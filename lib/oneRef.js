'use strict';

var _get = require('babel-runtime/helpers/get')['default'];

var _inherits = require('babel-runtime/helpers/inherits')['default'];

var _createClass = require('babel-runtime/helpers/create-class')['default'];

var _classCallCheck = require('babel-runtime/helpers/class-call-check')['default'];

var _interopRequireDefault = require('babel-runtime/helpers/interop-require-default')['default'];

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _events = require('events');

var _events2 = _interopRequireDefault(_events);

/**
 * A mutable ref cell (modeled on SML's ref type) that extends
 * EventEmitter to enable registration of listeners to be notified
 * when the ref cell is updated
 *
 */

var Ref = (function (_EventEmitter) {
  _inherits(Ref, _EventEmitter);

  /**
   * construct a new RefCell with initial value v
   */

  function Ref(v) {
    _classCallCheck(this, Ref);

    _get(Object.getPrototypeOf(Ref.prototype), 'constructor', this).call(this);
    this._value = v;
  }

  /**
   * Given a Ref<A> returns an 'updater' function.
   *
   * An updater is a function that takes an ((A) => A) update function (uf),
   * applies it to the current value in ref and sets ref to the result (which
   * will notify registered listeners).
   *
   *     refUpdater: (ref: Ref<A>) => (uf: (A) => A) => void
   *
   * We use Currying here so that we can partially apply refUpdater
   * to obtain an updater function that can passed down to actions. 
   */

  /**
   * get the current value of this ref cell
   */

  _createClass(Ref, [{
    key: 'getValue',
    value: function getValue() {
      return this._value;
    }

    /**
     * update contents of this ref cell and notify any listeners
     */
  }, {
    key: 'setValue',
    value: function setValue(v) {
      this._value = v;
      this.emit("change");
    }
  }]);

  return Ref;
})(_events2['default']);

exports.Ref = Ref;
var refUpdater = function refUpdater(ref) {
  return function (uf) {
    ref.setValue(uf(ref.getValue()));
  };
};
exports.refUpdater = refUpdater;