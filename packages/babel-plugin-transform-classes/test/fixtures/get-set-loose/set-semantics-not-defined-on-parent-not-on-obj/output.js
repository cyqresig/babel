"use strict";

function _inheritsLoose(subClass, superClass) { subClass.prototype.__proto__ = superClass && superClass.prototype; subClass.__proto__ = superClass; }

let Base = function Base() {};

let Obj =
/*#__PURE__*/
function (_Base) {
  function Obj() {
    return _Base.apply(this, arguments) || this;
  }

  var _proto = Obj.prototype;

  _proto.set = function set() {
    return this.test = 3;
  };

  _inheritsLoose(Obj, _Base);

  return Obj;
}(Base);

const obj = new Obj();
expect(obj.set()).toBe(3);
expect(Base.prototype.test).toBeUndefined();
expect(Obj.prototype.test).toBeUndefined();
expect(obj.test).toBe(3);
