import { escapeRegExp, splitDecimal, limitToScale, applyThousandSeparator, getDefaultChangeMeta, fixLeadingZero, noop, useInternalValues, isNil, roundToPrecision, setCaretPosition, toNumericString, charIsNumber, isNotValidValue, findChangeRange, } from './utils';
import { SourceType, } from './types';
import NumberFormatBase from './number_format_base';
import { createMemo, splitProps } from 'solid-js';
export function format(numStr, props) {
    var _a, _b, _c;
    const [local, _] = splitProps(props, [
        'decimalScale',
        'fixedDecimalScale',
        'prefix',
        'suffix',
        'allowNegative',
        'thousandsGroupStyle',
    ]);
    const prefix = (_a = local.prefix) !== null && _a !== void 0 ? _a : '';
    const suffix = (_b = local.suffix) !== null && _b !== void 0 ? _b : '';
    // don't apply formatting on empty string or '-'
    if (numStr === '' || numStr === '-') {
        return numStr;
    }
    const separators = getSeparators(props);
    /**
     * Keep the decimal separator
     * when decimalScale is not defined or non zero and the numStr has decimal in it
     * Or if decimalScale is > 0 and fixeDecimalScale is true (even if numStr has no decimal)
     */
    const hasDecimalSeparator = (local.decimalScale !== 0 && numStr.indexOf('.') !== -1) ||
        (local.decimalScale && local.fixedDecimalScale);
    let { beforeDecimal, afterDecimal, addNegation } = splitDecimal(numStr, local.allowNegative); // eslint-disable-line prefer-const
    //apply decimal precision if its defined
    if (local.decimalScale !== undefined) {
        afterDecimal = limitToScale(afterDecimal, local.decimalScale, !!local.fixedDecimalScale);
    }
    if (separators.thousandSeparator) {
        beforeDecimal = applyThousandSeparator(beforeDecimal, separators.thousandSeparator, (_c = local.thousandsGroupStyle) !== null && _c !== void 0 ? _c : 'thousand');
    }
    //add prefix and suffix when there is a number present
    if (prefix)
        beforeDecimal = prefix + beforeDecimal;
    if (suffix)
        afterDecimal = afterDecimal + suffix;
    //restore negation sign
    if (addNegation)
        beforeDecimal = '-' + beforeDecimal;
    numStr =
        beforeDecimal + ((hasDecimalSeparator && separators.decimalSeparator) || '') + afterDecimal;
    return numStr;
}
function getSeparators(props) {
    var _a, _b;
    const [local, _] = splitProps(props, [
        'decimalSeparator',
        'thousandSeparator',
        'allowedDecimalSeparators',
    ]);
    const decimalSeparator = (_a = local.decimalSeparator) !== null && _a !== void 0 ? _a : '.';
    const thousandSeparator = local.thousandSeparator === true
        ? ','
        : typeof local.thousandSeparator === 'string'
            ? local.thousandSeparator
            : '';
    const allowedDecimalSeparators = (_b = local.allowedDecimalSeparators) !== null && _b !== void 0 ? _b : [decimalSeparator, '.'];
    return {
        decimalSeparator,
        thousandSeparator,
        allowedDecimalSeparators,
    };
}
function handleNegation(value = '', allowNegative) {
    const negationRegex = new RegExp('(-)');
    const doubleNegationRegex = new RegExp('(-)(.)*(-)');
    // Check number has '-' value
    const hasNegation = negationRegex.test(value);
    // Check number has 2 or more '-' values
    const removeNegation = doubleNegationRegex.test(value);
    //remove negation
    value = value.replace(/-/g, '');
    if (hasNegation && !removeNegation && allowNegative) {
        value = '-' + value;
    }
    return value;
}
function getNumberRegex(decimalSeparator, global) {
    return new RegExp(`(^-)|[0-9]|${escapeRegExp(decimalSeparator)}`, global ? 'g' : undefined);
}
function isNumericString(val, prefix, suffix) {
    // for empty value we can always treat it as numeric string
    if (val === '')
        return true;
    return (!(prefix === null || prefix === void 0 ? void 0 : prefix.match(/\d/)) && !(suffix === null || suffix === void 0 ? void 0 : suffix.match(/\d/)) && typeof val === 'string' && !isNaN(Number(val)));
}
export function removeFormatting(value, changeMeta = getDefaultChangeMeta(value), props) {
    var _a, _b;
    const [local, _] = splitProps(props, ['allowNegative', 'prefix', 'suffix', 'decimalScale']);
    const prefix = (_a = local.prefix) !== null && _a !== void 0 ? _a : '';
    const suffix = (_b = local.suffix) !== null && _b !== void 0 ? _b : '';
    const separators = getSeparators(props);
    const isBeforeDecimalSeparator = value[changeMeta.to.end] === separators.decimalSeparator;
    /**
     * If only a number is added on empty input which matches with the prefix or suffix,
     * then don't remove it, just return the same
     */
    if (charIsNumber(value) &&
        (value === prefix || value === suffix) &&
        changeMeta.lastValue === '') {
        return value;
    }
    /** Check for any allowed decimal separator is added in the numeric format and replace it with decimal separator */
    if (changeMeta.to.end - changeMeta.to.start === 1 &&
        separators.allowedDecimalSeparators.indexOf(value[changeMeta.to.start]) !== -1) {
        const separator = local.decimalScale === 0 ? '' : separators.decimalSeparator;
        value =
            value.substring(0, changeMeta.to.start) +
                separator +
                value.substring(changeMeta.to.start + 1, value.length);
    }
    const stripNegation = (value, start, end) => {
        /**
         * if prefix starts with - we don't allow negative number to avoid confusion
         * if suffix starts with - and the value length is same as suffix length, then the - sign is from the suffix
         * In other cases, if the value starts with - then it is a negation
         */
        let hasNegation = false;
        let hasDoubleNegation = false;
        if (prefix.startsWith('-')) {
            hasNegation = false;
        }
        else if (value.startsWith('--')) {
            hasNegation = false;
            hasDoubleNegation = true;
        }
        else if (suffix.startsWith('-') && value.length === suffix.length) {
            hasNegation = false;
        }
        else if (value[0] === '-') {
            hasNegation = true;
        }
        let charsToRemove = hasNegation ? 1 : 0;
        if (hasDoubleNegation)
            charsToRemove = 2;
        // remove negation/double negation from start to simplify prefix logic as negation comes before prefix
        if (charsToRemove) {
            value = value.substring(charsToRemove);
            // account for the removal of the negation for start and end index
            start -= charsToRemove;
            end -= charsToRemove;
        }
        return { value, start, end, hasNegation };
    };
    const toMetadata = stripNegation(value, changeMeta.to.start, changeMeta.to.end);
    const { hasNegation } = toMetadata;
    ({ value, start: changeMeta.to.start, end: changeMeta.to.end } = toMetadata);
    const { start: fromStart, end: fromEnd, value: lastValue, } = stripNegation(changeMeta.lastValue, changeMeta.from.start, changeMeta.from.end);
    // if only prefix and suffix part is updated reset the value to last value
    // if the changed range is from suffix in the updated value, and the the suffix starts with the same characters, allow the change
    const updatedSuffixPart = value.substring(changeMeta.to.start, changeMeta.to.end);
    if (value.length &&
        lastValue.length &&
        (fromStart > lastValue.length - suffix.length || fromEnd < prefix.length) &&
        !(updatedSuffixPart && suffix.startsWith(updatedSuffixPart))) {
        value = lastValue;
    }
    /**
     * remove prefix
     * Remove whole prefix part if its present on the value
     * If the prefix is partially deleted (in which case change start index will be less the prefix length)
     * Remove only partial part of prefix.
     */
    let startIndex = 0;
    if (value.startsWith(prefix))
        startIndex += prefix.length;
    else if (changeMeta.to.start < prefix.length)
        startIndex = changeMeta.to.start;
    value = value.substring(startIndex);
    // account for deleted prefix for end
    changeMeta.to.end -= startIndex;
    /**
     * Remove suffix
     * Remove whole suffix part if its present on the value
     * If the suffix is partially deleted (in which case change end index will be greater than the suffixStartIndex)
     * remove the partial part of suffix
     */
    let endIndex = value.length;
    const suffixStartIndex = value.length - suffix.length;
    if (value.endsWith(suffix))
        endIndex = suffixStartIndex;
    // if the suffix is removed from the end
    else if (changeMeta.to.end > suffixStartIndex)
        endIndex = changeMeta.to.end;
    // if the suffix is removed from start
    else if (changeMeta.to.end > value.length - suffix.length)
        endIndex = changeMeta.to.end;
    value = value.substring(0, endIndex);
    // add the negation back and handle for double negation
    value = handleNegation(hasNegation ? `-${value}` : value, local.allowNegative);
    // remove non numeric characters
    value = (value.match(getNumberRegex(separators.decimalSeparator, true)) || []).join('');
    // replace the decimalSeparator with ., and only keep the first separator, ignore following ones
    const firstIndex = value.indexOf(separators.decimalSeparator);
    value = value.replace(new RegExp(escapeRegExp(separators.decimalSeparator), 'g'), (match, index) => {
        return index === firstIndex ? '.' : '';
    });
    //check if beforeDecimal got deleted and there is nothing after decimal,
    //clear all numbers in such case while keeping the - sign
    const { beforeDecimal, afterDecimal, addNegation } = splitDecimal(value, local.allowNegative); // eslint-disable-line prefer-const
    //clear only if something got deleted before decimal (cursor is before decimal)
    if (changeMeta.to.end - changeMeta.to.start < changeMeta.from.end - changeMeta.from.start &&
        beforeDecimal === '' &&
        isBeforeDecimalSeparator &&
        !parseFloat(afterDecimal)) {
        value = addNegation ? '-' : '';
    }
    return value;
}
export function getCaretBoundary(formattedValue, props) {
    var _a, _b;
    const [local, _] = splitProps(props, ['prefix', 'suffix']);
    const prefix = (_a = local.prefix) !== null && _a !== void 0 ? _a : '';
    const suffix = (_b = local.suffix) !== null && _b !== void 0 ? _b : '';
    const boundaryAry = Array.from({ length: formattedValue.length + 1 }).map(() => true);
    const hasNegation = formattedValue[0] === '-';
    // fill for prefix and negation
    boundaryAry.fill(false, 0, prefix.length + (hasNegation ? 1 : 0));
    // fill for suffix
    const valLn = formattedValue.length;
    boundaryAry.fill(false, valLn - suffix.length + 1, valLn + 1);
    return boundaryAry;
}
function validateAndUpdateProps(props) {
    var _a, _b;
    const { thousandSeparator, decimalSeparator } = getSeparators(props);
    const [local, _] = splitProps(props, ['prefix', 'allowNegative']);
    let allowNegative = (_a = local.allowNegative) !== null && _a !== void 0 ? _a : true;
    const prefix = (_b = local.prefix) !== null && _b !== void 0 ? _b : '';
    if (thousandSeparator === decimalSeparator) {
        throw new Error(`
        Decimal separator can't be same as thousand separator.
        thousandSeparator: ${thousandSeparator} (thousandSeparator = {true} is same as thousandSeparator = ",")
        decimalSeparator: ${decimalSeparator} (default value for decimalSeparator is .)
     `);
    }
    if (prefix.startsWith('-') && allowNegative) {
        // TODO: throw error in next major version
        console.error(`
      Prefix can't start with '-' when allowNegative is true.
      prefix: ${prefix}
      allowNegative: ${allowNegative}
    `);
        allowNegative = false;
    }
    return Object.assign(Object.assign({}, props), { allowNegative });
}
export function useNumericFormat(props) {
    var _a, _b, _c, _d;
    // validate props
    props = validateAndUpdateProps(props);
    const [local, restProps] = splitProps(props, [
        'decimalSeparator',
        'allowedDecimalSeparators',
        'thousandsGroupStyle',
        'suffix',
        'allowNegative',
        'allowLeadingZeros',
        'onKeyDown',
        'onBlur',
        'thousandSeparator',
        'decimalScale',
        'fixedDecimalScale',
        'prefix',
        'defaultValue',
        'value',
        'valueIsNumericString',
        'onValueChange',
    ]);
    const prefix = (_a = local.prefix) !== null && _a !== void 0 ? _a : '';
    const onKeyDown = (_b = local.onKeyDown) !== null && _b !== void 0 ? _b : noop;
    const onBlur = (_c = local.onBlur) !== null && _c !== void 0 ? _c : noop;
    // get derived decimalSeparator and allowedDecimalSeparators
    const { decimalSeparator, allowedDecimalSeparators } = getSeparators(props);
    const _format = (numStr) => format(numStr, props);
    const _removeFormatting = (inputValue, changeMeta) => removeFormatting(inputValue, changeMeta, props);
    const getValue = () => {
        if (typeof local.value === 'function') {
            return local.value();
        }
        return local.value;
    };
    const _value = isNil(getValue()) ? local.defaultValue : getValue();
    // try to figure out isValueNumericString based on format prop and value
    let _valueIsNumericString = (_d = local.valueIsNumericString) !== null && _d !== void 0 ? _d : isNumericString(_value, prefix, local.suffix);
    if (!isNil(getValue())) {
        _valueIsNumericString = _valueIsNumericString || typeof getValue() === 'number';
    }
    else if (!isNil(local.defaultValue)) {
        _valueIsNumericString = _valueIsNumericString || typeof local.defaultValue === 'number';
    }
    const roundIncomingValueToPrecision = (value) => {
        if (isNotValidValue(value))
            return value;
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
    const [values, _onValueChange] = useInternalValues(() => roundIncomingValueToPrecision(getValue()), roundIncomingValueToPrecision(local.defaultValue), Boolean(_valueIsNumericString), _format, _removeFormatting, local.onValueChange);
    const numAsString = () => values().numAsString;
    const formattedValue = () => values().formattedValue;
    const _onKeyDown = (e) => {
        const el = e.target;
        const { key } = e;
        const { selectionStart, selectionEnd, value = '' } = el;
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
        if (key === 'Backspace' &&
            value[0] === '-' &&
            selectionStart === prefix.length + 1 &&
            local.allowNegative) {
            // bring the cursor to after negation
            setCaretPosition(el, 1);
        }
        // don't allow user to delete decimal separator when decimalScale and fixedDecimalScale is set
        if (local.decimalScale && local.fixedDecimalScale) {
            if (key === 'Backspace' && value[selectionStart - 1] === decimalSeparator) {
                setCaretPosition(el, selectionStart - 1);
                e.preventDefault();
            }
            else if (key === 'Delete' && value[selectionStart] === decimalSeparator) {
                e.preventDefault();
            }
        }
        // if user presses the allowed decimal separator before the separator, move the cursor after the separator
        if ((allowedDecimalSeparators === null || allowedDecimalSeparators === void 0 ? void 0 : allowedDecimalSeparators.includes(key)) && value[selectionStart] === decimalSeparator) {
            setCaretPosition(el, selectionStart + 1);
        }
        const _thousandSeparator = local.thousandSeparator === true ? ',' : local.thousandSeparator;
        // move cursor when delete or backspace is pressed before/after thousand separator
        if (key === 'Backspace' && value[selectionStart - 1] === _thousandSeparator) {
            setCaretPosition(el, selectionStart - 1);
        }
        if (key === 'Delete' && value[selectionStart] === _thousandSeparator) {
            setCaretPosition(el, selectionStart + 1);
        }
        typeof onKeyDown === 'function' && onKeyDown(e);
    };
    const _onBlur = (e) => {
        let _value = numAsString();
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
            const formattedValue = format(_value, props);
            _onValueChange({
                formattedValue,
                value: _value,
                floatValue: parseFloat(_value),
            }, {
                event: e,
                source: SourceType.event,
            });
        }
        typeof onBlur === 'function' && onBlur(e);
    };
    const isValidInputCharacter = (inputChar) => {
        if (inputChar === decimalSeparator)
            return true;
        return charIsNumber(inputChar);
    };
    const isCharacterSame = ({ currentValue, lastValue, formattedValue, currentValueIndex, formattedValueIndex, }) => {
        const curChar = currentValue[currentValueIndex];
        const newChar = formattedValue[formattedValueIndex];
        /**
         * NOTE: as thousand separator and allowedDecimalSeparators can be same, we need to check on
         * typed range if we have typed any character from allowedDecimalSeparators, in that case we
         * consider different characters like , and . same within the range of updated value.
         */
        const typedRange = findChangeRange(lastValue, currentValue);
        const { to } = typedRange;
        // handle corner case where if we user types a decimal separator with fixedDecimalScale
        // and pass back float value the cursor jumps. #851
        const getDecimalSeparatorIndex = (value) => {
            return _removeFormatting(value).indexOf('.') + prefix.length;
        };
        if (getValue() === 0 &&
            local.fixedDecimalScale &&
            local.decimalScale &&
            currentValue[to.start] === decimalSeparator &&
            getDecimalSeparatorIndex(currentValue) < currentValueIndex &&
            getDecimalSeparatorIndex(formattedValue) > formattedValueIndex) {
            return false;
        }
        if (currentValueIndex >= to.start &&
            currentValueIndex < to.end &&
            allowedDecimalSeparators &&
            allowedDecimalSeparators.includes(curChar) &&
            newChar === decimalSeparator) {
            return true;
        }
        return curChar === newChar;
    };
    return Object.assign(Object.assign({}, restProps), { value: formattedValue(), valueIsNumericString: false, isValidInputCharacter,
        isCharacterSame, onValueChange: _onValueChange, format: _format, removeFormatting: _removeFormatting, getCaretBoundary: (formattedValue) => getCaretBoundary(formattedValue, props), onKeyDown: _onKeyDown, onBlur: _onBlur });
}
export default function NumericFormat(props) {
    const reactiveValue = createMemo(() => props.value);
    const numericFormatProps = useNumericFormat(props);
    return <NumberFormatBase {...numericFormatProps} value={reactiveValue()}/>;
}
