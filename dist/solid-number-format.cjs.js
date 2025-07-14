/**
 * @empoleon/solid-number-format - 0.0.1
 * Author : Sudhanshu Yadav
 * Copyright (c) 2016, 2025 to Sudhanshu Yadav, released under the MIT license.
 */

'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

var web = require('solid-js/web');
var solidJs = require('solid-js');

function _arrayLikeToArray(r, a) {
  (null == a || a > r.length) && (a = r.length);
  for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e];
  return n;
}
function _arrayWithHoles(r) {
  if (Array.isArray(r)) return r;
}
function _extends() {
  return _extends = Object.assign ? Object.assign.bind() : function (n) {
    for (var e = 1; e < arguments.length; e++) {
      var t = arguments[e];
      for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]);
    }
    return n;
  }, _extends.apply(null, arguments);
}
function _iterableToArrayLimit(r, l) {
  var t = null == r ? null : "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"];
  if (null != t) {
    var e,
      n,
      i,
      u,
      a = [],
      f = !0,
      o = !1;
    try {
      if (i = (t = t.call(r)).next, 0 === l) {
        if (Object(t) !== t) return;
        f = !1;
      } else for (; !(f = (e = i.call(t)).done) && (a.push(e.value), a.length !== l); f = !0);
    } catch (r) {
      o = !0, n = r;
    } finally {
      try {
        if (!f && null != t.return && (u = t.return(), Object(u) !== u)) return;
      } finally {
        if (o) throw n;
      }
    }
    return a;
  }
}
function _nonIterableRest() {
  throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.");
}
function _slicedToArray(r, e) {
  return _arrayWithHoles(r) || _iterableToArrayLimit(r, e) || _unsupportedIterableToArray(r, e) || _nonIterableRest();
}
function _unsupportedIterableToArray(r, a) {
  if (r) {
    if ("string" == typeof r) return _arrayLikeToArray(r, a);
    var t = {}.toString.call(r).slice(8, -1);
    return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0;
  }
}

var SourceType;
(function (SourceType) {
  SourceType["event"] = "event";
  SourceType["props"] = "prop";
})(SourceType || (SourceType = {}));

// basic noop function
function noop() {}
function memoizeOnce(cb) {
  var lastArgs;
  var lastValue = undefined;
  return function () {
    var arguments$1 = arguments;

    for (var _len = arguments.length, args = new Array(_len), _key = 0; _key < _len; _key++) {
      args[_key] = arguments$1[_key];
    }
    if (lastArgs && args.length === lastArgs.length && args.every(function (value, index) {
      return value === lastArgs[index];
    })) {
      return lastValue;
    }
    lastArgs = args;
    lastValue = cb.apply(void 0, args);
    return lastValue;
  };
}
function charIsNumber(_char) {
  return !!String(_char || '').match(/\d/);
}
function isNil(val) {
  return val === null || val === undefined;
}
function isNanValue(val) {
  return typeof val === 'number' && isNaN(val);
}
function isNotValidValue(val) {
  return isNil(val) || isNanValue(val) || typeof val === 'number' && !isFinite(val);
}
function escapeRegExp(str) {
  return str.replace(/[-[\]/{}()*+?.\\^$|]/g, '\\$&');
}
function getThousandsGroupRegex(thousandsGroupStyle) {
  switch (thousandsGroupStyle) {
    case 'lakh':
      return /(\d+?)(?=(\d\d)+(\d)(?!\d))(\.\d+)?/g;
    case 'wan':
      return /(\d)(?=(\d{4})+(?!\d))/g;
    case 'thousand':
    default:
      return /(\d)(?=(\d{3})+(?!\d))/g;
  }
}
function applyThousandSeparator(str, thousandSeparator, thousandsGroupStyle) {
  var thousandsGroupRegex = getThousandsGroupRegex(thousandsGroupStyle);
  var index = str.search(/[1-9]/);
  index = index === -1 ? str.length : index;
  return str.substring(0, index) + str.substring(index, str.length).replace(thousandsGroupRegex, '$1' + thousandSeparator);
}
function usePersistentCallback(cb) {
  return function () {
    return cb.apply(void 0, arguments);
  };
}
//spilt a float number into different parts beforeDecimal, afterDecimal, and negation
function splitDecimal(numStr) {
  var allowNegative = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : true;
  var hasNegation = numStr[0] === '-';
  var addNegation = hasNegation && allowNegative;
  numStr = numStr.replace('-', '');
  var parts = numStr.split('.');
  var beforeDecimal = parts[0];
  var afterDecimal = parts[1] || '';
  return {
    beforeDecimal: beforeDecimal,
    afterDecimal: afterDecimal,
    hasNegation: hasNegation,
    addNegation: addNegation
  };
}
function fixLeadingZero(numStr) {
  if (!numStr) { return numStr; }
  var isNegative = numStr[0] === '-';
  if (isNegative) { numStr = numStr.substring(1, numStr.length); }
  var parts = numStr.split('.');
  var beforeDecimal = parts[0].replace(/^0+/, '') || '0';
  var afterDecimal = parts[1] || '';
  return "".concat(isNegative ? '-' : '').concat(beforeDecimal).concat(afterDecimal ? ".".concat(afterDecimal) : '');
}
/**
 * limit decimal numbers to given scale
 * Not used .fixedTo because that will break with big numbers
 */
function limitToScale(numStr, scale, fixedDecimalScale) {
  var str = '';
  var filler = fixedDecimalScale ? '0' : '';
  for (var i = 0; i <= scale - 1; i++) {
    str += numStr[i] || filler;
  }
  return str;
}
function repeat(str, count) {
  return Array(count + 1).join(str);
}
function toNumericString(num) {
  var _num = num + ''; // typecast number to string
  // store the sign and remove it from the number.
  var sign = _num[0] === '-' ? '-' : '';
  if (sign) { _num = _num.substring(1); }
  // split the number into cofficient and exponent
  var _num$split = _num.split(/[eE]/g),
    _num$split2 = _slicedToArray(_num$split, 2),
    coefficient = _num$split2[0],
    exponent = _num$split2[1];
  // covert exponent to number;
  exponent = Number(exponent);
  // if there is no exponent part or its 0, return the coffiecient with sign
  if (!exponent) { return sign + coefficient; }
  coefficient = coefficient.replace('.', '');
  /**
   * for scientific notation the current decimal index will be after first number (index 0)
   * So effective decimal index will always be 1 + exponent value
   */
  var decimalIndex = 1 + exponent;
  var coffiecientLn = coefficient.length;
  if (decimalIndex < 0) {
    // if decimal index is less then 0 add preceding 0s
    // add 1 as join will have
    coefficient = '0.' + repeat('0', Math.abs(decimalIndex)) + coefficient;
  } else if (decimalIndex >= coffiecientLn) {
    // if decimal index is less then 0 add leading 0s
    coefficient = coefficient + repeat('0', decimalIndex - coffiecientLn);
  } else {
    // else add decimal point at proper index
    coefficient = (coefficient.substring(0, decimalIndex) || '0') + '.' + coefficient.substring(decimalIndex);
  }
  return sign + coefficient;
}
/**
 * This method is required to round prop value to given scale.
 * Not used .round or .fixedTo because that will break with big numbers
 */
function roundToPrecision(numStr, scale, fixedDecimalScale) {
  //if number is empty don't do anything return empty string
  if (['', '-'].indexOf(numStr) !== -1) { return numStr; }
  var shouldHaveDecimalSeparator = (numStr.indexOf('.') !== -1 || fixedDecimalScale) && scale;
  var _splitDecimal = splitDecimal(numStr),
    beforeDecimal = _splitDecimal.beforeDecimal,
    afterDecimal = _splitDecimal.afterDecimal,
    hasNegation = _splitDecimal.hasNegation;
  var floatValue = parseFloat("0.".concat(afterDecimal || '0'));
  var floatValueStr = afterDecimal.length <= scale ? "0.".concat(afterDecimal) : floatValue.toFixed(scale);
  var roundedDecimalParts = floatValueStr.split('.');
  var intPart = beforeDecimal;
  // if we have cary over from rounding decimal part, add that on before decimal
  if (beforeDecimal && Number(roundedDecimalParts[0])) {
    intPart = beforeDecimal.split('').reverse().reduce(function (roundedStr, current, idx) {
      if (roundedStr.length > idx) {
        return (Number(roundedStr[0]) + Number(current)).toString() + roundedStr.substring(1, roundedStr.length);
      }
      return current + roundedStr;
    }, roundedDecimalParts[0]);
  }
  var decimalPart = limitToScale(roundedDecimalParts[1] || '', scale, fixedDecimalScale);
  var negation = hasNegation ? '-' : '';
  var decimalSeparator = shouldHaveDecimalSeparator ? '.' : '';
  return "".concat(negation).concat(intPart).concat(decimalSeparator).concat(decimalPart);
}
/** set the caret positon in an input field **/
function setCaretPosition(el, caretPos) {
  el.value = el.value;
  // ^ this is used to not only get 'focus', but
  // to make sure we don't have it everything -selected-
  // (it causes an issue in chrome, and having it doesn't hurt any other browser)
  if (el !== null) {
    /* @ts-ignore */
    if (el.createTextRange) {
      /* @ts-ignore */
      var range = el.createTextRange();
      range.move('character', caretPos);
      range.select();
      return true;
    }
    // (el.selectionStart === 0 added for Firefox bug)
    if (el.selectionStart || el.selectionStart === 0) {
      el.focus();
      el.setSelectionRange(caretPos, caretPos);
      return true;
    }
    // fail city, fortunately this never happens (as far as I've tested) :)
    el.focus();
    return false;
  }
}
/**
 * TODO: remove dependency of findChangeRange, findChangedRangeFromCaretPositions is better way to find what is changed
 * currently this is mostly required by test and isCharacterSame util
 * Given previous value and newValue it returns the index
 * start - end to which values have changed.
 * This function makes assumption about only consecutive
 * characters are changed which is correct assumption for caret input.
 */
var findChangeRange = memoizeOnce(function (prevValue, newValue) {
  var i = 0,
    j = 0;
  var prevLength = prevValue.length;
  var newLength = newValue.length;
  while (prevValue[i] === newValue[i] && i < prevLength) { i++; }
  //check what has been changed from last
  while (prevValue[prevLength - 1 - j] === newValue[newLength - 1 - j] && newLength - j > i && prevLength - j > i) {
    j++;
  }
  return {
    from: {
      start: i,
      end: prevLength - j
    },
    to: {
      start: i,
      end: newLength - j
    }
  };
});
var findChangedRangeFromCaretPositions = function findChangedRangeFromCaretPositions(lastCaretPositions, currentCaretPosition) {
  var startPosition = Math.min(lastCaretPositions.selectionStart, currentCaretPosition);
  return {
    from: {
      start: startPosition,
      end: lastCaretPositions.selectionEnd
    },
    to: {
      start: startPosition,
      end: currentCaretPosition
    }
  };
};
/*
  Returns a number whose value is limited to the given range
*/
function clamp(num, min, max) {
  return Math.min(Math.max(num, min), max);
}
function geInputCaretPosition(el) {
  /*Max of selectionStart and selectionEnd is taken for the patch of pixel and other mobile device caret bug*/
  return Math.max(el.selectionStart, el.selectionEnd);
}
function addInputMode() {
  return typeof navigator !== 'undefined' && !(navigator.platform && /iPhone|iPod/.test(navigator.platform));
}
function getDefaultChangeMeta(value) {
  return {
    from: {
      start: 0,
      end: 0
    },
    to: {
      start: 0,
      end: value.length
    },
    lastValue: ''
  };
}
function getMaskAtIndex() {
  var mask = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : ' ';
  var index = arguments.length > 1 ? arguments[1] : undefined;
  if (typeof mask === 'string') {
    return mask;
  }
  return mask[index] || ' ';
}
function defaultIsCharacterSame(_ref) {
  var currentValue = _ref.currentValue,
    formattedValue = _ref.formattedValue,
    currentValueIndex = _ref.currentValueIndex,
    formattedValueIndex = _ref.formattedValueIndex;
  return currentValue[currentValueIndex] === formattedValue[formattedValueIndex];
}
function getCaretPosition(newFormattedValue, lastFormattedValue, curValue, curCaretPos, boundary, isValidInputCharacter) {
  var isCharacterSame = arguments.length > 6 && arguments[6] !== undefined ? arguments[6] : defaultIsCharacterSame;
  /**
   * if something got inserted on empty value, add the formatted character before the current value,
   * This is to avoid the case where typed character is present on format characters
   */
  var firstAllowedPosition = boundary.findIndex(function (b) {
    return b;
  });
  var prefixFormat = newFormattedValue.slice(0, firstAllowedPosition);
  if (!lastFormattedValue && !curValue.startsWith(prefixFormat)) {
    lastFormattedValue = prefixFormat;
    curValue = prefixFormat + curValue;
    curCaretPos = curCaretPos + prefixFormat.length;
  }
  var curValLn = curValue.length;
  var formattedValueLn = newFormattedValue.length;
  // create index map
  var addedIndexMap = {};
  var indexMap = new Array(curValLn);
  for (var i = 0; i < curValLn; i++) {
    indexMap[i] = -1;
    for (var j = 0, jLn = formattedValueLn; j < jLn; j++) {
      var isCharSame = isCharacterSame({
        currentValue: curValue,
        lastValue: lastFormattedValue,
        formattedValue: newFormattedValue,
        currentValueIndex: i,
        formattedValueIndex: j
      });
      if (isCharSame && addedIndexMap[j] !== true) {
        indexMap[i] = j;
        addedIndexMap[j] = true;
        break;
      }
    }
  }
  /**
   * For current caret position find closest characters (left and right side)
   * which are properly mapped to formatted value.
   * The idea is that the new caret position will exist always in the boundary of
   * that mapped index
   */
  var pos = curCaretPos;
  while (pos < curValLn && (indexMap[pos] === -1 || !isValidInputCharacter(curValue[pos]))) {
    pos++;
  }
  // if the caret position is on last keep the endIndex as last for formatted value
  var endIndex = pos === curValLn || indexMap[pos] === -1 ? formattedValueLn : indexMap[pos];
  pos = curCaretPos - 1;
  while (pos > 0 && indexMap[pos] === -1) { pos--; }
  var startIndex = pos === -1 || indexMap[pos] === -1 ? 0 : indexMap[pos] + 1;
  /**
   * case where a char is added on suffix and removed from middle, example 2sq345 becoming $2,345 sq
   * there is still a mapping but the order of start index and end index is changed
   */
  if (startIndex > endIndex) { return endIndex; }
  /**
   * given the current caret position if it closer to startIndex
   * keep the new caret position on start index or keep it closer to endIndex
   */
  return curCaretPos - startIndex < endIndex - curCaretPos ? startIndex : endIndex;
}
/* This keeps the caret within typing area so people can't type in between prefix or suffix or format characters */
function getCaretPosInBoundary(value, caretPos, boundary, direction) {
  var valLn = value.length;
  // clamp caret position to [0, value.length]
  caretPos = clamp(caretPos, 0, valLn);
  if (direction === 'left') {
    while (caretPos >= 0 && !boundary[caretPos]) { caretPos--; }
    // if we don't find any suitable caret position on left, set it on first allowed position
    if (caretPos === -1) { caretPos = boundary.indexOf(true); }
  } else {
    while (caretPos <= valLn && !boundary[caretPos]) { caretPos++; }
    // if we don't find any suitable caret position on right, set it on last allowed position
    if (caretPos > valLn) { caretPos = boundary.lastIndexOf(true); }
  }
  // if we still don't find caret position, set it at the end of value
  if (caretPos === -1) { caretPos = valLn; }
  return caretPos;
}
function caretUnknownFormatBoundary(formattedValue) {
  var boundaryAry = Array.from({
    length: formattedValue.length + 1
  }).map(function () {
    return true;
  });
  for (var i = 0, ln = boundaryAry.length; i < ln; i++) {
    // consider caret to be in boundary if it is before or after numeric value
    boundaryAry[i] = Boolean(charIsNumber(formattedValue[i]) || charIsNumber(formattedValue[i - 1]));
  }
  return boundaryAry;
}
function useInternalValues(value, defaultValue, valueIsNumericString, format, removeFormatting) {
  var onValueChange = arguments.length > 5 && arguments[5] !== undefined ? arguments[5] : noop;
  var getValues = usePersistentCallback(function (value, valueIsNumericString) {
    var formattedValue, numAsString;
    if (isNotValidValue(value)) {
      numAsString = '';
      formattedValue = format(numAsString);
    } else if (typeof value === 'number' || valueIsNumericString) {
      numAsString = typeof value === 'number' ? toNumericString(value) : value;
      formattedValue = format(numAsString);
    } else {
      numAsString = removeFormatting(value, undefined);
      formattedValue = format(numAsString);
    }
    return {
      formattedValue: formattedValue,
      numAsString: numAsString
    };
  });
  var initialValues = getValues(isNil(value()) ? defaultValue : value(), valueIsNumericString);
  var _createSignal = solidJs.createSignal(initialValues),
    _createSignal2 = _slicedToArray(_createSignal, 2),
    values = _createSignal2[0],
    setValues = _createSignal2[1];
  var _onValueChange = function _onValueChange(newValues, sourceInfo) {
    if (newValues.formattedValue !== values().formattedValue) {
      setValues({
        formattedValue: newValues.formattedValue,
        numAsString: newValues.value
      });
    }
    // call parent on value change if only if formatted value is changed
    onValueChange(newValues, sourceInfo);
  };
  // if value is switch from controlled to uncontrolled, use the internal state's value to format with new props
  solidJs.createEffect(function () {
    var _value = isNil(value()) ? solidJs.untrack(function () {
      return values().numAsString;
    }) : value();
    var _valueIsNumericString = isNil(value()) ? true : valueIsNumericString;
    var newValues = getValues(_value, _valueIsNumericString);
    setValues(newValues);
  });
  return [values, _onValueChange];
}

var _tmpl$ = /*#__PURE__*/web.template("<span>"),
  _tmpl$2 = /*#__PURE__*/web.template("<input>");
function defaultRemoveFormatting(value) {
  return value.replace(/[^0-9]/g, '');
}
function defaultFormat(value) {
  return value;
}
function NumberFormatBase(props) {
  var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
  var _splitProps = solidJs.splitProps(props, ['type', 'displayType', 'customInput', 'renderText', 'getInputRef', 'format', 'removeFormatting', 'defaultValue', 'valueIsNumericString', 'onValueChange', 'isAllowed', 'onChange', 'onKeyDown', 'onMouseUp', 'onFocus', 'onBlur', 'value', 'getCaretBoundary', 'isValidInputCharacter', 'isCharacterSame']),
    _splitProps2 = _slicedToArray(_splitProps, 2),
    local = _splitProps2[0],
    otherProps = _splitProps2[1];
  var removeFormatting = (_a = local.removeFormatting) !== null && _a !== void 0 ? _a : defaultRemoveFormatting;
  var format = (_b = local.format) !== null && _b !== void 0 ? _b : defaultFormat;
  var type = (_c = local.type) !== null && _c !== void 0 ? _c : 'text';
  var displayType = (_d = local.displayType) !== null && _d !== void 0 ? _d : 'input';
  var onChange = (_e = local.onChange) !== null && _e !== void 0 ? _e : noop;
  var onKeyDown = (_f = local.onKeyDown) !== null && _f !== void 0 ? _f : noop;
  var onMouseUp = (_g = local.onMouseUp) !== null && _g !== void 0 ? _g : noop;
  var onFocus = (_h = local.onFocus) !== null && _h !== void 0 ? _h : noop;
  var onBlur = (_j = local.onBlur) !== null && _j !== void 0 ? _j : noop;
  var getCaretBoundary = (_k = local.getCaretBoundary) !== null && _k !== void 0 ? _k : caretUnknownFormatBoundary;
  var isValidInputCharacter = (_l = local.isValidInputCharacter) !== null && _l !== void 0 ? _l : charIsNumber;
  // const [{ formattedValue, numAsString }, onFormattedValueChange] = useInternalValues(
  //   () => local.value,
  //   local.defaultValue,
  //   Boolean(local.valueIsNumericString),
  //   format as FormatInputValueFunction,
  //   removeFormatting,
  //   local.onValueChange,
  // );
  var _useInternalValues = useInternalValues(function () {
      return local.value;
    }, local.defaultValue, Boolean(local.valueIsNumericString), format, removeFormatting, local.onValueChange),
    _useInternalValues2 = _slicedToArray(_useInternalValues, 2),
    values = _useInternalValues2[0],
    onFormattedValueChange = _useInternalValues2[1];
  var formattedValue = function formattedValue() {
    return values().formattedValue;
  };
  var numAsString = function numAsString() {
    return values().numAsString;
  };
  var caretPositionBeforeChange;
  var lastUpdatedValue = {
    formattedValue: formattedValue(),
    numAsString: numAsString()
  };
  var _onValueChange = function _onValueChange(values, source) {
    lastUpdatedValue = {
      formattedValue: values.formattedValue,
      numAsString: values.value
    };
    onFormattedValueChange(values, source);
  };
  var _createSignal = solidJs.createSignal(false),
    _createSignal2 = _slicedToArray(_createSignal, 2),
    mounted = _createSignal2[0],
    setMounted = _createSignal2[1];
  var focusedElm = null;
  var timeout = {
    setCaretTimeout: null,
    focusTimeout: null
  };
  solidJs.onMount(function () {
    setMounted(true);
  });
  solidJs.onCleanup(function () {
    clearTimeout(timeout.setCaretTimeout);
    clearTimeout(timeout.focusTimeout);
  });
  var _format = format;
  var getValueObject = function getValueObject(formattedValue, numAsString) {
    var floatValue = parseFloat(numAsString);
    return {
      formattedValue: formattedValue,
      value: numAsString,
      floatValue: isNaN(floatValue) ? undefined : floatValue
    };
  };
  var setPatchedCaretPosition = function setPatchedCaretPosition(el, caretPos, currentValue) {
    // don't reset the caret position when the whole input content is selected
    if (el.selectionStart === 0 && el.selectionEnd === el.value.length) { return; }
    /* setting caret position within timeout of 0ms is required for mobile chrome,
    otherwise browser resets the caret position after we set it
    We are also setting it without timeout so that in normal browser we don't see the flickering */
    setCaretPosition(el, caretPos);
    timeout.setCaretTimeout = setTimeout(function () {
      if (el.value === currentValue && el.selectionStart !== caretPos) {
        setCaretPosition(el, caretPos);
      }
    }, 0);
  };
  /* This keeps the caret within typing area so people can't type in between prefix or suffix */
  var correctCaretPosition = function correctCaretPosition(value, caretPos, direction) {
    return getCaretPosInBoundary(value, caretPos, getCaretBoundary(value), direction);
  };
  var getNewCaretPosition = function getNewCaretPosition(inputValue, newFormattedValue, caretPos) {
    var caretBoundary = getCaretBoundary(newFormattedValue);
    var updatedCaretPos = getCaretPosition(newFormattedValue, formattedValue(), inputValue, caretPos, caretBoundary, isValidInputCharacter, local.isCharacterSame);
    //correct caret position if its outside of editable area
    updatedCaretPos = getCaretPosInBoundary(newFormattedValue, updatedCaretPos, caretBoundary);
    return updatedCaretPos;
  };
  var updateValueAndCaretPosition = function updateValueAndCaretPosition(params) {
    var _a;
    var caretPos;
    var newFormattedValue = (_a = params.formattedValue) !== null && _a !== void 0 ? _a : '';
    if (params.input) {
      var inputValue = params.inputValue || params.input.value;
      var _currentCaretPosition = geInputCaretPosition(params.input);
      /**
       * set the value imperatively, this is required for IE fix
       * This is also required as if new caret position is beyond the previous value.
       * Caret position will not be set correctly
       */
      params.input.value = newFormattedValue;
      //get the caret position
      caretPos = getNewCaretPosition(inputValue, newFormattedValue, _currentCaretPosition);
      //set caret position imperatively
      if (caretPos !== undefined) {
        setPatchedCaretPosition(params.input, caretPos, newFormattedValue);
      }
    }
    if (newFormattedValue !== formattedValue()) {
      // trigger onValueChange synchronously, so parent is updated along with the number format. Fix for #277, #287
      _onValueChange(getValueObject(newFormattedValue, params.numAsString), {
        event: params.event,
        source: params.source
      });
    }
  };
  /**
   * if the formatted value is not synced to parent, or if the formatted value is different from last synced value sync it
   * if the formatting props is removed, in which case last formatted value will be different from the numeric string value
   * in such case we need to inform the parent.
   */
  // createEffect(() => {
  //   const { formattedValue: lastFormattedValue, numAsString: lastNumAsString } = lastUpdatedValue;
  //   if (formattedValue() !== lastFormattedValue || numAsString() !== lastNumAsString) {
  //     _onValueChange(getValueObject(formattedValue(), numAsString()), {
  //       event: undefined,
  //       source: SourceType.props,
  //     });
  //   }
  // });
  // also if formatted value is changed from the props, we need to update the caret position
  // keep the last caret position if element is focused
  var currentCaretPosition = focusedElm ? geInputCaretPosition(focusedElm) : undefined;
  // needed to prevent warning with useLayoutEffect on server
  solidJs.onMount(function () {
    var input = focusedElm;
    if (formattedValue() !== lastUpdatedValue.formattedValue && input) {
      var caretPos = getNewCaretPosition(lastUpdatedValue.formattedValue, formattedValue(), currentCaretPosition);
      /**
       * set the value imperatively, as we set the caret position as well imperatively.
       * This is to keep value and caret position in sync
       */
      input.value = formattedValue();
      setPatchedCaretPosition(input, caretPos, formattedValue());
    }
  });
  var formatInputValue = function formatInputValue(inputValue, event, source) {
    var input = event.target;
    var changeRange = caretPositionBeforeChange ? findChangedRangeFromCaretPositions(caretPositionBeforeChange, input.selectionEnd) : findChangeRange(formattedValue(), inputValue);
    var changeMeta = _extends(_extends({}, changeRange), {
      lastValue: formattedValue()
    });
    var _numAsString = removeFormatting(inputValue, changeMeta);
    var _formattedValue = _format(_numAsString);
    // formatting can remove some of the number chars, so we need to fine number string again
    _numAsString = removeFormatting(_formattedValue, undefined);
    if (local.isAllowed && !local.isAllowed(getValueObject(_formattedValue, _numAsString))) {
      //reset the caret position
      var _input = event.target;
      var _currentCaretPosition2 = geInputCaretPosition(_input);
      var caretPos = getNewCaretPosition(inputValue, formattedValue(), _currentCaretPosition2);
      _input.value = formattedValue();
      setPatchedCaretPosition(_input, caretPos, formattedValue());
      return false;
    }
    updateValueAndCaretPosition({
      formattedValue: _formattedValue,
      numAsString: _numAsString,
      inputValue: inputValue,
      event: event,
      source: source,
      input: event.target
    });
    return true;
  };
  var _onChange = function _onChange(e) {
    var el = e.target;
    var inputValue = el.value;
    var changed = formatInputValue(inputValue, e, SourceType.event);
    if (changed) { typeof onChange === 'function' && onChange(e); }
    // reset the position, as we have already handled the caret position
    caretPositionBeforeChange = undefined;
  };
  var _onFocus = function _onFocus(e) {
    var el = e.target;
    var currentTarget = e.currentTarget;
    focusedElm = el;
    timeout.focusTimeout = setTimeout(function () {
      var selectionStart = el.selectionStart,
        selectionEnd = el.selectionEnd,
        _el$value3 = el.value,
        value = _el$value3 === void 0 ? '' : _el$value3;
      var caretPosition = correctCaretPosition(value, selectionStart);
      //setPatchedCaretPosition only when everything is not selected on focus (while tabbing into the field)
      if (caretPosition !== selectionStart && !(selectionStart === 0 && selectionEnd === value.length)) {
        setPatchedCaretPosition(el, caretPosition, value);
      }
      typeof onFocus === 'function' && onFocus(_extends(_extends({}, e), {
        currentTarget: currentTarget,
        target: el
      }));
    }, 0);
  };
  var _onBlur = function _onBlur(e) {
    var el = e.target;
    var currentTarget = e.currentTarget;
    focusedElm = null;
    clearTimeout(timeout.focusTimeout);
    clearTimeout(timeout.setCaretTimeout);
    typeof onBlur === 'function' && onBlur(_extends(_extends({}, e), {
      currentTarget: currentTarget,
      target: el
    }));
  };
  // add input mode on element based on format prop and device once the component is mounted
  var inputMode = mounted() && addInputMode() ? 'numeric' : undefined;
  if (displayType === 'text') {
    return local.renderText ? web.memo(function () {
      return local.renderText(formattedValue(), otherProps) || null;
    }) : function () {
      var _el$ = _tmpl$();
      var _ref$ = local.getInputRef;
      typeof _ref$ === "function" ? web.use(_ref$, _el$) : local.getInputRef = _el$;
      web.spread(_el$, otherProps, false, true);
      web.insert(_el$, formattedValue);
      return _el$;
    }();
  } else if (local.customInput) {
    var CustomInput = local.customInput;
    /* @ts-ignore */
    return web.createComponent(CustomInput, web.mergeProps(otherProps, {
      get type() {
        return (_m = local.type) !== null && _m !== void 0 ? _m : 'text';
      },
      get value() {
        return formattedValue();
      },
      onInput: _onChange,
      ref: function ref(r$) {
        var _ref$2 = local.getInputRef;
        typeof _ref$2 === "function" ? _ref$2(r$) : local.getInputRef = r$;
      },
      onKeyDown: onKeyDown,
      onMouseUp: onMouseUp,
      onFocus: _onFocus,
      onBlur: _onBlur
    }));
  }
  return function () {
    var _el$2 = _tmpl$2();
    var _ref$3 = local.getInputRef;
    typeof _ref$3 === "function" ? web.use(_ref$3, _el$2) : local.getInputRef = _el$2;
    web.spread(_el$2, web.mergeProps(otherProps, {
      get type() {
        return (_o = local.type) !== null && _o !== void 0 ? _o : 'text';
      },
      get value() {
        return formattedValue();
      },
      "onInput": _onChange,
      "onKeyDown": onKeyDown,
      "onMouseUp": onMouseUp,
      "onFocus": _onFocus,
      "onBlur": _onBlur
    }), false, false);
    return _el$2;
  }();
}

function format(numStr, props) {
  var _a, _b, _c;
  var _splitProps = solidJs.splitProps(props, ['decimalScale', 'fixedDecimalScale', 'prefix', 'suffix', 'allowNegative', 'thousandsGroupStyle']),
    _splitProps2 = _slicedToArray(_splitProps, 2),
    local = _splitProps2[0],
    _ = _splitProps2[1];
  var prefix = (_a = local.prefix) !== null && _a !== void 0 ? _a : '';
  var suffix = (_b = local.suffix) !== null && _b !== void 0 ? _b : '';
  // don't apply formatting on empty string or '-'
  if (numStr === '' || numStr === '-') {
    return numStr;
  }
  var separators = getSeparators(props);
  /**
   * Keep the decimal separator
   * when decimalScale is not defined or non zero and the numStr has decimal in it
   * Or if decimalScale is > 0 and fixeDecimalScale is true (even if numStr has no decimal)
   */
  var hasDecimalSeparator = local.decimalScale !== 0 && numStr.indexOf('.') !== -1 || local.decimalScale && local.fixedDecimalScale;
  var _splitDecimal = splitDecimal(numStr, local.allowNegative),
    beforeDecimal = _splitDecimal.beforeDecimal,
    afterDecimal = _splitDecimal.afterDecimal,
    addNegation = _splitDecimal.addNegation; // eslint-disable-line prefer-const
  //apply decimal precision if its defined
  if (local.decimalScale !== undefined) {
    afterDecimal = limitToScale(afterDecimal, local.decimalScale, !!local.fixedDecimalScale);
  }
  if (separators.thousandSeparator) {
    beforeDecimal = applyThousandSeparator(beforeDecimal, separators.thousandSeparator, (_c = local.thousandsGroupStyle) !== null && _c !== void 0 ? _c : 'thousand');
  }
  //add prefix and suffix when there is a number present
  if (prefix) { beforeDecimal = prefix + beforeDecimal; }
  if (suffix) { afterDecimal = afterDecimal + suffix; }
  //restore negation sign
  if (addNegation) { beforeDecimal = '-' + beforeDecimal; }
  numStr = beforeDecimal + (hasDecimalSeparator && separators.decimalSeparator || '') + afterDecimal;
  return numStr;
}
function getSeparators(props) {
  var _a, _b;
  var _splitProps3 = solidJs.splitProps(props, ['decimalSeparator', 'thousandSeparator', 'allowedDecimalSeparators']),
    _splitProps4 = _slicedToArray(_splitProps3, 2),
    local = _splitProps4[0],
    _ = _splitProps4[1];
  var decimalSeparator = (_a = local.decimalSeparator) !== null && _a !== void 0 ? _a : '.';
  var thousandSeparator = local.thousandSeparator === true ? ',' : typeof local.thousandSeparator === 'string' ? local.thousandSeparator : '';
  var allowedDecimalSeparators = (_b = local.allowedDecimalSeparators) !== null && _b !== void 0 ? _b : [decimalSeparator, '.'];
  return {
    decimalSeparator: decimalSeparator,
    thousandSeparator: thousandSeparator,
    allowedDecimalSeparators: allowedDecimalSeparators
  };
}
function handleNegation() {
  var value = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : '';
  var allowNegative = arguments.length > 1 ? arguments[1] : undefined;
  var negationRegex = new RegExp('(-)');
  var doubleNegationRegex = new RegExp('(-)(.)*(-)');
  // Check number has '-' value
  var hasNegation = negationRegex.test(value);
  // Check number has 2 or more '-' values
  var removeNegation = doubleNegationRegex.test(value);
  //remove negation
  value = value.replace(/-/g, '');
  if (hasNegation && !removeNegation && allowNegative) {
    value = '-' + value;
  }
  return value;
}
function getNumberRegex(decimalSeparator, global) {
  return new RegExp("(^-)|[0-9]|".concat(escapeRegExp(decimalSeparator)), global ? 'g' : undefined);
}
function isNumericString(val, prefix, suffix) {
  // for empty value we can always treat it as numeric string
  if (val === '') { return true; }
  return !(prefix === null || prefix === void 0 ? void 0 : prefix.match(/\d/)) && !(suffix === null || suffix === void 0 ? void 0 : suffix.match(/\d/)) && typeof val === 'string' && !isNaN(Number(val));
}
function removeFormatting(value) {
  var changeMeta = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getDefaultChangeMeta(value);
  var props = arguments.length > 2 ? arguments[2] : undefined;
  var _a, _b;
  var _splitProps5 = solidJs.splitProps(props, ['allowNegative', 'prefix', 'suffix', 'decimalScale']),
    _splitProps6 = _slicedToArray(_splitProps5, 2),
    local = _splitProps6[0],
    _ = _splitProps6[1];
  var prefix = (_a = local.prefix) !== null && _a !== void 0 ? _a : '';
  var suffix = (_b = local.suffix) !== null && _b !== void 0 ? _b : '';
  var separators = getSeparators(props);
  var isBeforeDecimalSeparator = value[changeMeta.to.end] === separators.decimalSeparator;
  /**
   * If only a number is added on empty input which matches with the prefix or suffix,
   * then don't remove it, just return the same
   */
  if (charIsNumber(value) && (value === prefix || value === suffix) && changeMeta.lastValue === '') {
    return value;
  }
  /** Check for any allowed decimal separator is added in the numeric format and replace it with decimal separator */
  if (changeMeta.to.end - changeMeta.to.start === 1 && separators.allowedDecimalSeparators.indexOf(value[changeMeta.to.start]) !== -1) {
    var separator = local.decimalScale === 0 ? '' : separators.decimalSeparator;
    value = value.substring(0, changeMeta.to.start) + separator + value.substring(changeMeta.to.start + 1, value.length);
  }
  var stripNegation = function stripNegation(value, start, end) {
    /**
     * if prefix starts with - we don't allow negative number to avoid confusion
     * if suffix starts with - and the value length is same as suffix length, then the - sign is from the suffix
     * In other cases, if the value starts with - then it is a negation
     */
    var hasNegation = false;
    var hasDoubleNegation = false;
    if (prefix.startsWith('-')) {
      hasNegation = false;
    } else if (value.startsWith('--')) {
      hasNegation = false;
      hasDoubleNegation = true;
    } else if (suffix.startsWith('-') && value.length === suffix.length) {
      hasNegation = false;
    } else if (value[0] === '-') {
      hasNegation = true;
    }
    var charsToRemove = hasNegation ? 1 : 0;
    if (hasDoubleNegation) { charsToRemove = 2; }
    // remove negation/double negation from start to simplify prefix logic as negation comes before prefix
    if (charsToRemove) {
      value = value.substring(charsToRemove);
      // account for the removal of the negation for start and end index
      start -= charsToRemove;
      end -= charsToRemove;
    }
    return {
      value: value,
      start: start,
      end: end,
      hasNegation: hasNegation
    };
  };
  var toMetadata = stripNegation(value, changeMeta.to.start, changeMeta.to.end);
  var hasNegation = toMetadata.hasNegation;
  value = toMetadata.value;
  changeMeta.to.start = toMetadata.start;
  changeMeta.to.end = toMetadata.end;
  var _stripNegation = stripNegation(changeMeta.lastValue, changeMeta.from.start, changeMeta.from.end),
    fromStart = _stripNegation.start,
    fromEnd = _stripNegation.end,
    lastValue = _stripNegation.value;
  // if only prefix and suffix part is updated reset the value to last value
  // if the changed range is from suffix in the updated value, and the the suffix starts with the same characters, allow the change
  var updatedSuffixPart = value.substring(changeMeta.to.start, changeMeta.to.end);
  if (value.length && lastValue.length && (fromStart > lastValue.length - suffix.length || fromEnd < prefix.length) && !(updatedSuffixPart && suffix.startsWith(updatedSuffixPart))) {
    value = lastValue;
  }
  /**
   * remove prefix
   * Remove whole prefix part if its present on the value
   * If the prefix is partially deleted (in which case change start index will be less the prefix length)
   * Remove only partial part of prefix.
   */
  var startIndex = 0;
  if (value.startsWith(prefix)) { startIndex += prefix.length; }else if (changeMeta.to.start < prefix.length) { startIndex = changeMeta.to.start; }
  value = value.substring(startIndex);
  // account for deleted prefix for end
  changeMeta.to.end -= startIndex;
  /**
   * Remove suffix
   * Remove whole suffix part if its present on the value
   * If the suffix is partially deleted (in which case change end index will be greater than the suffixStartIndex)
   * remove the partial part of suffix
   */
  var endIndex = value.length;
  var suffixStartIndex = value.length - suffix.length;
  if (value.endsWith(suffix)) { endIndex = suffixStartIndex; }
  // if the suffix is removed from the end
  else if (changeMeta.to.end > suffixStartIndex) { endIndex = changeMeta.to.end; }
  // if the suffix is removed from start
  else if (changeMeta.to.end > value.length - suffix.length) { endIndex = changeMeta.to.end; }
  value = value.substring(0, endIndex);
  // add the negation back and handle for double negation
  value = handleNegation(hasNegation ? "-".concat(value) : value, local.allowNegative);
  // remove non numeric characters
  value = (value.match(getNumberRegex(separators.decimalSeparator, true)) || []).join('');
  // replace the decimalSeparator with ., and only keep the first separator, ignore following ones
  var firstIndex = value.indexOf(separators.decimalSeparator);
  value = value.replace(new RegExp(escapeRegExp(separators.decimalSeparator), 'g'), function (match, index) {
    return index === firstIndex ? '.' : '';
  });
  //check if beforeDecimal got deleted and there is nothing after decimal,
  //clear all numbers in such case while keeping the - sign
  var _splitDecimal2 = splitDecimal(value, local.allowNegative),
    beforeDecimal = _splitDecimal2.beforeDecimal,
    afterDecimal = _splitDecimal2.afterDecimal,
    addNegation = _splitDecimal2.addNegation; // eslint-disable-line prefer-const
  //clear only if something got deleted before decimal (cursor is before decimal)
  if (changeMeta.to.end - changeMeta.to.start < changeMeta.from.end - changeMeta.from.start && beforeDecimal === '' && isBeforeDecimalSeparator && !parseFloat(afterDecimal)) {
    value = addNegation ? '-' : '';
  }
  return value;
}
function _getCaretBoundary(formattedValue, props) {
  var _a, _b;
  var _splitProps7 = solidJs.splitProps(props, ['prefix', 'suffix']),
    _splitProps8 = _slicedToArray(_splitProps7, 2),
    local = _splitProps8[0],
    _ = _splitProps8[1];
  var prefix = (_a = local.prefix) !== null && _a !== void 0 ? _a : '';
  var suffix = (_b = local.suffix) !== null && _b !== void 0 ? _b : '';
  var boundaryAry = Array.from({
    length: formattedValue.length + 1
  }).map(function () {
    return true;
  });
  var hasNegation = formattedValue[0] === '-';
  // fill for prefix and negation
  boundaryAry.fill(false, 0, prefix.length + (hasNegation ? 1 : 0));
  // fill for suffix
  var valLn = formattedValue.length;
  boundaryAry.fill(false, valLn - suffix.length + 1, valLn + 1);
  return boundaryAry;
}
function validateAndUpdateProps(props) {
  var _a, _b;
  var _getSeparators = getSeparators(props),
    thousandSeparator = _getSeparators.thousandSeparator,
    decimalSeparator = _getSeparators.decimalSeparator;
  var _splitProps9 = solidJs.splitProps(props, ['prefix', 'allowNegative']),
    _splitProps0 = _slicedToArray(_splitProps9, 2),
    local = _splitProps0[0],
    _ = _splitProps0[1];
  var allowNegative = (_a = local.allowNegative) !== null && _a !== void 0 ? _a : true;
  var prefix = (_b = local.prefix) !== null && _b !== void 0 ? _b : '';
  if (thousandSeparator === decimalSeparator) {
    throw new Error("\n        Decimal separator can't be same as thousand separator.\n        thousandSeparator: ".concat(thousandSeparator, " (thousandSeparator = {true} is same as thousandSeparator = \",\")\n        decimalSeparator: ").concat(decimalSeparator, " (default value for decimalSeparator is .)\n     "));
  }
  if (prefix.startsWith('-') && allowNegative) {
    // TODO: throw error in next major version
    console.error("\n      Prefix can't start with '-' when allowNegative is true.\n      prefix: ".concat(prefix, "\n      allowNegative: ").concat(allowNegative, "\n    "));
    allowNegative = false;
  }
  return _extends(_extends({}, props), {
    allowNegative: allowNegative
  });
}
function useNumericFormat(props) {
  var _a, _b, _c, _d;
  // validate props
  props = validateAndUpdateProps(props);
  var _splitProps1 = solidJs.splitProps(props, ['decimalSeparator', 'allowedDecimalSeparators', 'thousandsGroupStyle', 'suffix', 'allowNegative', 'allowLeadingZeros', 'onKeyDown', 'onBlur', 'thousandSeparator', 'decimalScale', 'fixedDecimalScale', 'prefix', 'defaultValue', 'value', 'valueIsNumericString', 'onValueChange']),
    _splitProps10 = _slicedToArray(_splitProps1, 2),
    local = _splitProps10[0],
    restProps = _splitProps10[1];
  var prefix = (_a = local.prefix) !== null && _a !== void 0 ? _a : '';
  var onKeyDown = (_b = local.onKeyDown) !== null && _b !== void 0 ? _b : noop;
  var onBlur = (_c = local.onBlur) !== null && _c !== void 0 ? _c : noop;
  // get derived decimalSeparator and allowedDecimalSeparators
  var _getSeparators2 = getSeparators(props),
    decimalSeparator = _getSeparators2.decimalSeparator,
    allowedDecimalSeparators = _getSeparators2.allowedDecimalSeparators;
  var _format = function _format(numStr) {
    return format(numStr, props);
  };
  var _removeFormatting = function _removeFormatting(inputValue, changeMeta) {
    return removeFormatting(inputValue, changeMeta, props);
  };
  var getValue = function getValue() {
    if (typeof local.value === 'function') {
      return local.value();
    }
    return local.value;
  };
  var _value = isNil(getValue()) ? local.defaultValue : getValue();
  // try to figure out isValueNumericString based on format prop and value
  var _valueIsNumericString = (_d = local.valueIsNumericString) !== null && _d !== void 0 ? _d : isNumericString(_value, prefix, local.suffix);
  if (!isNil(getValue())) {
    _valueIsNumericString = _valueIsNumericString || typeof getValue() === 'number';
  } else if (!isNil(local.defaultValue)) {
    _valueIsNumericString = _valueIsNumericString || typeof local.defaultValue === 'number';
  }
  var roundIncomingValueToPrecision = function roundIncomingValueToPrecision(value) {
    if (isNotValidValue(value)) { return value; }
    if (typeof value === 'number') {
      value = toNumericString(value);
    }
    /**
     * only round numeric or float string values coming through props,
     * we don't need to do it for onChange events, as we want to prevent typing there
     */
    if (_valueIsNumericString && typeof local.decimalScale === 'number') {
      return roundToPrecision(value, local.decimalScale, Boolean(local.fixedDecimalScale));
    }
    return value;
  };
  var _useInternalValues = useInternalValues(function () {
      return roundIncomingValueToPrecision(getValue());
    }, roundIncomingValueToPrecision(local.defaultValue), Boolean(_valueIsNumericString), _format, _removeFormatting, local.onValueChange),
    _useInternalValues2 = _slicedToArray(_useInternalValues, 2),
    values = _useInternalValues2[0],
    _onValueChange = _useInternalValues2[1];
  var numAsString = function numAsString() {
    return values().numAsString;
  };
  var formattedValue = function formattedValue() {
    return values().formattedValue;
  };
  var _onKeyDown = function _onKeyDown(e) {
    var el = e.target;
    var key = e.key;
    var selectionStart = el.selectionStart,
      selectionEnd = el.selectionEnd,
      _el$value = el.value,
      value = _el$value === void 0 ? '' : _el$value;
    // if user tries to delete partial prefix then ignore it
    if ((key === 'Backspace' || key === 'Delete') && selectionEnd < prefix.length) {
      e.preventDefault();
      return;
    }
    // if multiple characters are selected and user hits backspace, no need to handle anything manually
    if (selectionStart !== selectionEnd) {
      typeof onKeyDown === 'function' && onKeyDown(e);
      return;
    }
    // if user hits backspace, while the cursor is before prefix, and the input has negation, remove the negation
    if (key === 'Backspace' && value[0] === '-' && selectionStart === prefix.length + 1 && local.allowNegative) {
      // bring the cursor to after negation
      setCaretPosition(el, 1);
    }
    // don't allow user to delete decimal separator when decimalScale and fixedDecimalScale is set
    if (local.decimalScale && local.fixedDecimalScale) {
      if (key === 'Backspace' && value[selectionStart - 1] === decimalSeparator) {
        setCaretPosition(el, selectionStart - 1);
        e.preventDefault();
      } else if (key === 'Delete' && value[selectionStart] === decimalSeparator) {
        e.preventDefault();
      }
    }
    // if user presses the allowed decimal separator before the separator, move the cursor after the separator
    if ((allowedDecimalSeparators === null || allowedDecimalSeparators === void 0 ? void 0 : allowedDecimalSeparators.includes(key)) && value[selectionStart] === decimalSeparator) {
      setCaretPosition(el, selectionStart + 1);
    }
    var _thousandSeparator = local.thousandSeparator === true ? ',' : local.thousandSeparator;
    // move cursor when delete or backspace is pressed before/after thousand separator
    if (key === 'Backspace' && value[selectionStart - 1] === _thousandSeparator) {
      setCaretPosition(el, selectionStart - 1);
    }
    if (key === 'Delete' && value[selectionStart] === _thousandSeparator) {
      setCaretPosition(el, selectionStart + 1);
    }
    typeof onKeyDown === 'function' && onKeyDown(e);
  };
  var _onBlur = function _onBlur(e) {
    var _value = numAsString();
    // if there no no numeric value, clear the input
    if (!_value.match(/\d/g)) {
      _value = '';
    }
    // clear leading 0s
    if (!local.allowLeadingZeros) {
      _value = fixLeadingZero(_value);
    }
    // apply fixedDecimalScale on blur event
    if (local.fixedDecimalScale && local.decimalScale) {
      _value = roundToPrecision(_value, local.decimalScale, local.fixedDecimalScale);
    }
    if (_value !== numAsString()) {
      var _formattedValue = format(_value, props);
      _onValueChange({
        formattedValue: _formattedValue,
        value: _value,
        floatValue: parseFloat(_value)
      }, {
        event: e,
        source: SourceType.event
      });
    }
    typeof onBlur === 'function' && onBlur(e);
  };
  var isValidInputCharacter = function isValidInputCharacter(inputChar) {
    if (inputChar === decimalSeparator) { return true; }
    return charIsNumber(inputChar);
  };
  var isCharacterSame = function isCharacterSame(_ref) {
    var currentValue = _ref.currentValue,
      lastValue = _ref.lastValue,
      formattedValue = _ref.formattedValue,
      currentValueIndex = _ref.currentValueIndex,
      formattedValueIndex = _ref.formattedValueIndex;
    var curChar = currentValue[currentValueIndex];
    var newChar = formattedValue[formattedValueIndex];
    /**
     * NOTE: as thousand separator and allowedDecimalSeparators can be same, we need to check on
     * typed range if we have typed any character from allowedDecimalSeparators, in that case we
     * consider different characters like , and . same within the range of updated value.
     */
    var typedRange = findChangeRange(lastValue, currentValue);
    var to = typedRange.to;
    // handle corner case where if we user types a decimal separator with fixedDecimalScale
    // and pass back float value the cursor jumps. #851
    var getDecimalSeparatorIndex = function getDecimalSeparatorIndex(value) {
      return _removeFormatting(value).indexOf('.') + prefix.length;
    };
    if (getValue() === 0 && local.fixedDecimalScale && local.decimalScale && currentValue[to.start] === decimalSeparator && getDecimalSeparatorIndex(currentValue) < currentValueIndex && getDecimalSeparatorIndex(formattedValue) > formattedValueIndex) {
      return false;
    }
    if (currentValueIndex >= to.start && currentValueIndex < to.end && allowedDecimalSeparators && allowedDecimalSeparators.includes(curChar) && newChar === decimalSeparator) {
      return true;
    }
    return curChar === newChar;
  };
  return _extends(_extends({}, restProps), {
    value: formattedValue(),
    valueIsNumericString: false,
    isValidInputCharacter: isValidInputCharacter,
    isCharacterSame: isCharacterSame,
    onValueChange: _onValueChange,
    format: _format,
    removeFormatting: _removeFormatting,
    getCaretBoundary: function getCaretBoundary(formattedValue) {
      return _getCaretBoundary(formattedValue, props);
    },
    onKeyDown: _onKeyDown,
    onBlur: _onBlur
  });
}
function NumericFormat(props) {
  var reactiveValue = solidJs.createMemo(function () {
    return props.value;
  });
  var numericFormatProps = useNumericFormat(props);
  return web.createComponent(NumberFormatBase, web.mergeProps(numericFormatProps, {
    get value() {
      return reactiveValue();
    }
  }));
}

function _format(numStr, props) {
  var patternChar = props.patternChar || '#';
  var format = props.format;
  if (numStr === '' && !props.allowEmptyFormatting) { return ''; }
  var hashCount = 0;
  var formattedNumberAry = format.split('');
  for (var i = 0, ln = format.length; i < ln; i++) {
    if (format[i] === patternChar) {
      formattedNumberAry[i] = numStr[hashCount] || getMaskAtIndex(props.mask, hashCount);
      hashCount += 1;
    }
  }
  return formattedNumberAry.join('');
}
function _removeFormatting(value) {
  var changeMeta = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : getDefaultChangeMeta(value);
  var props = arguments.length > 2 ? arguments[2] : undefined;
  var patternChar = props.patternChar || '#';
  var format = props.format;
  var isNumericSlot = function isNumericSlot(caretPos) {
    return format[caretPos] === patternChar;
  };
  var removeFormatChar = function removeFormatChar(string, startIndex) {
    var str = '';
    for (var i = 0; i < string.length; i++) {
      if (isNumericSlot(startIndex + i) && charIsNumber(string[i])) {
        str += string[i];
      }
    }
    return str;
  };
  var extractNumbers = function extractNumbers(str) {
    return str.replace(/[^0-9]/g, '');
  };
  // if format doesn't have any number, remove all the non numeric characters
  if (!format.match(/\d/)) {
    return extractNumbers(value);
  }
  /**
   * if user paste the whole formatted text in an empty input or doing select all and paste, check if matches to the pattern
   * and remove the format characters, if there is a mismatch on the pattern, do plane number extract
   */
  if ((changeMeta.lastValue === '' || changeMeta.from.end - changeMeta.from.start === changeMeta.lastValue.length) && value.length === format.length) {
    var str = '';
    for (var i = 0; i < value.length; i++) {
      if (isNumericSlot(i)) {
        if (charIsNumber(value[i])) {
          str += value[i];
        }
      } else if (value[i] !== format[i]) {
        // if there is a mismatch on the pattern, do plane number extract
        return extractNumbers(value);
      }
    }
    return str;
  }
  /**
   * For partial change,
   * where ever there is a change on the input, we can break the number in three parts
   * 1st: left part which is unchanged
   * 2nd: middle part which is changed
   * 3rd: right part which is unchanged
   *
   * The first and third section will be same as last value, only the middle part will change
   * We can consider on the change part all the new characters are non format characters.
   * And on the first and last section it can have partial format characters.
   *
   * We pick first and last section from the lastValue (as that has 1-1 mapping with format)
   * and middle one from the update value.
   */
  var firstSection = changeMeta.lastValue.substring(0, changeMeta.from.start);
  var middleSection = value.substring(changeMeta.to.start, changeMeta.to.end);
  var lastSection = changeMeta.lastValue.substring(changeMeta.from.end);
  return "".concat(removeFormatChar(firstSection, 0)).concat(extractNumbers(middleSection)).concat(removeFormatChar(lastSection, changeMeta.from.end));
}
function getCaretBoundary(formattedValue, props) {
  var format = props.format;
  var patternChar = props.patternChar || '#';
  var boundaryAry = Array.from({
    length: formattedValue.length + 1
  }).map(function () {
    return true;
  });
  var hashCount = 0;
  var firstEmptySlot = -1;
  var maskAndIndexMap = {};
  format.split('').forEach(function (_char, index) {
    var maskAtIndex = undefined;
    if (_char === patternChar) {
      hashCount++;
      maskAtIndex = getMaskAtIndex(props.mask, hashCount - 1);
      if (firstEmptySlot === -1 && formattedValue[index] === maskAtIndex) {
        firstEmptySlot = index;
      }
    }
    maskAndIndexMap[index] = maskAtIndex;
  });
  var isPosAllowed = function isPosAllowed(pos) {
    // the position is allowed if the position is not masked and valid number area
    return format[pos] === patternChar && formattedValue[pos] !== maskAndIndexMap[pos];
  };
  for (var i = 0, ln = boundaryAry.length; i < ln; i++) {
    // consider caret to be in boundary if it is before or after numeric value
    // Note: on pattern based format its denoted by patternCharacter
    // we should also allow user to put cursor on first empty slot
    boundaryAry[i] = i === firstEmptySlot || isPosAllowed(i) || isPosAllowed(i - 1);
  }
  // the first patternChar position is always allowed
  boundaryAry[format.indexOf(patternChar)] = true;
  return boundaryAry;
}
function validateProps(props) {
  if (props.mask) {
    var maskAsStr = props.mask === 'string' ? props.mask : props.mask.toString();
    if (maskAsStr.match(/\d/g)) {
      throw new Error("Mask ".concat(props.mask, " should not contain numeric character;"));
    }
  }
}
function isNumericString$1(val, format) {
  //we can treat empty string as numeric string
  if (val === '') { return true; }
  return !(format === null || format === void 0 ? void 0 : format.match(/\d/)) && typeof val === 'string' && (!!val.match(/^\d+$/) || val === '');
}
function usePatternFormat(props) {
  var _a, _b, _c, _d;
  var _splitProps = solidJs.splitProps(props, ['mask', 'allowEmptyFormatting', 'format', 'inputMode', 'onKeyDown', 'patternChar', 'value', 'defaultValue', 'valueIsNumericString']),
    _splitProps2 = _slicedToArray(_splitProps, 2),
    local = _splitProps2[0],
    restProps = _splitProps2[1];
  var formatProp = local.format;
  var inputMode = (_a = local.inputMode) !== null && _a !== void 0 ? _a : 'numeric';
  var onKeyDown = (_b = local.onKeyDown) !== null && _b !== void 0 ? _b : noop;
  var patternChar = (_c = local.patternChar) !== null && _c !== void 0 ? _c : '#';
  // validate props
  validateProps(props);
  var _getCaretBoundary = function _getCaretBoundary(formattedValue) {
    return getCaretBoundary(formattedValue, props);
  };
  var _onKeyDown = function _onKeyDown(e) {
    var key = e.key;
    var el = e.target;
    var selectionStart = el.selectionStart,
      selectionEnd = el.selectionEnd,
      value = el.value;
    // if multiple characters are selected and user hits backspace, no need to handle anything manually
    if (selectionStart !== selectionEnd) {
      typeof local.onKeyDown === 'function' && local.onKeyDown(e);
      return;
    }
    // bring the cursor to closest numeric section
    var caretPos = selectionStart;
    // if backspace is pressed after the format characters, bring it to numeric section
    // if delete is pressed before the format characters, bring it to numeric section
    if (key === 'Backspace' || key === 'Delete') {
      var direction = 'right';
      if (key === 'Backspace') {
        while (caretPos > 0 && formatProp[caretPos - 1] !== patternChar) {
          caretPos--;
        }
        direction = 'left';
      } else {
        var formatLn = formatProp.length;
        while (caretPos < formatLn && formatProp[caretPos] !== patternChar) {
          caretPos++;
        }
        direction = 'right';
      }
      caretPos = getCaretPosInBoundary(value, caretPos, _getCaretBoundary(value), direction);
    } else if (formatProp[caretPos] !== patternChar && key !== 'ArrowLeft' && key !== 'ArrowRight') {
      // if user is typing on format character position, bring user to next allowed caret position
      caretPos = getCaretPosInBoundary(value, caretPos + 1, _getCaretBoundary(value), 'right');
    }
    // if we changing caret position, set the caret position
    if (caretPos !== selectionStart) {
      setCaretPosition(el, caretPos);
    }
    typeof local.onKeyDown === 'function' && local.onKeyDown(e);
  };
  // try to figure out isValueNumericString based on format prop and value
  var _value = isNil(local.value) ? local.defaultValue : local.value;
  var isValueNumericString = (_d = local.valueIsNumericString) !== null && _d !== void 0 ? _d : isNumericString$1(_value, formatProp);
  var _props = _extends(_extends({}, props), {
    valueIsNumericString: isValueNumericString
  });
  return _extends(_extends({}, restProps), {
    value: local.value,
    defaultValue: local.defaultValue,
    valueIsNumericString: isValueNumericString,
    inputMode: inputMode,
    format: function format(numStr) {
      return _format(numStr, _props);
    },
    removeFormatting: function removeFormatting(inputValue, changeMeta) {
      return _removeFormatting(inputValue, changeMeta, _props);
    },
    getCaretBoundary: _getCaretBoundary,
    onKeyDown: _onKeyDown
  });
}
function PatternFormat(props) {
  var patternFormatProps = usePatternFormat(props);
  return web.createComponent(NumberFormatBase, patternFormatProps);
}

exports.NumberFormatBase = NumberFormatBase;
exports.NumericFormat = NumericFormat;
exports.PatternFormat = PatternFormat;
exports.getNumericCaretBoundary = _getCaretBoundary;
exports.getPatternCaretBoundary = getCaretBoundary;
exports.numericFormatter = format;
exports.patternFormatter = _format;
exports.removeNumericFormat = removeFormatting;
exports.removePatternFormat = _removeFormatting;
exports.useNumericFormat = useNumericFormat;
exports.usePatternFormat = usePatternFormat;
