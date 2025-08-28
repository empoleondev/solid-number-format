import {
  escapeRegExp,
  splitDecimal,
  limitToScale,
  applyThousandSeparator,
  getDefaultChangeMeta,
  fixLeadingZero,
  noop,
  useInternalValues,
  isNil,
  roundToPrecision,
  setCaretPosition,
  toNumericString,
  charIsNumber,
  isNotValidValue,
  findChangeRange,
} from './utils';
import {
  NumericFormatProps,
  ChangeMeta,
  SourceType,
  InputAttributes,
  NumberFormatBaseProps,
  IsCharacterSame,
} from './types';
import NumberFormatBase from './number_format_base';
import { createMemo, JSX, mergeProps, splitProps } from 'solid-js';

export function format<BaseType = InputAttributes>(
  numStr: string,
  props: NumericFormatProps<BaseType>,
) {
  const [local, _] = splitProps(props, [
    'decimalScale',
    'fixedDecimalScale',
    'prefix',
    'suffix',
    'allowNegative',
    'allowLeadingZeros',
    'thousandsGroupStyle',
  ]);

  const prefix = local.prefix ?? '';
  const suffix = local.suffix ?? '';

  // don't apply formatting on empty string or '-'
  if (numStr === '' || numStr === '-') {
    return numStr;
  }

  const separators = getSeparators(props);

  // If decimalScale is 0 and we have a decimal number, round the entire number first
  if (local.decimalScale === 0 && numStr.includes('.')) {
    const num = parseFloat(numStr);
    const truncated = Math.floor(Math.abs(num)) * Math.sign(num);
    numStr = truncated.toString();
  }

  /**
   * Keep the decimal separator
   * when decimalScale is not defined or non zero and the numStr has decimal in it
   * Or if decimalScale is > 0 and fixeDecimalScale is true (even if numStr has no decimal)
   */
  const hasDecimalSeparator =
    (local.decimalScale !== 0 && numStr.indexOf('.') !== -1) ||
    (local.decimalScale && local.fixedDecimalScale);

  let decimal = splitDecimal(numStr, local.allowNegative); // eslint-disable-line prefer-const

  //apply decimal precision if its defined
  if (local.decimalScale !== undefined) {
    decimal.afterDecimal = limitToScale(decimal.afterDecimal, local.decimalScale, !!local.fixedDecimalScale);
  }

  if (separators.thousandSeparator) {
    decimal.beforeDecimal = applyThousandSeparator(
      decimal.beforeDecimal,
      separators.thousandSeparator,
      local.thousandsGroupStyle ?? 'thousand',
    );
  }

  //add prefix and suffix when there is a number present
  if (prefix) decimal.beforeDecimal = prefix + decimal.beforeDecimal;
  if (suffix) decimal.afterDecimal = decimal.afterDecimal + suffix;

  //restore negation sign
  if (decimal.addNegation) decimal.beforeDecimal = '-' + decimal.beforeDecimal;

  numStr =
    decimal.beforeDecimal + ((hasDecimalSeparator && separators.decimalSeparator) || '') + decimal.afterDecimal;

  return numStr;
}

function getSeparators<BaseType = InputAttributes>(props: NumericFormatProps<BaseType>) {
  const [local, _] = splitProps(props, [
    'decimalSeparator',
    'thousandSeparator',
    'allowedDecimalSeparators',
  ]);

  const decimalSeparator = local.decimalSeparator ?? '.';
  const thousandSeparator =
    local.thousandSeparator === true
      ? ','
      : typeof local.thousandSeparator === 'string'
      ? local.thousandSeparator
      : '';
  const allowedDecimalSeparators = local.allowedDecimalSeparators ?? [decimalSeparator, '.'];

  return {
    decimalSeparator,
    thousandSeparator,
    allowedDecimalSeparators,
  };
}

function handleNegation(value: string = '', allowNegative: boolean) {
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

function getNumberRegex(decimalSeparator: string, global: boolean) {
  return new RegExp(`(^-)|[0-9]|${escapeRegExp(decimalSeparator)}`, global ? 'g' : undefined);
}

function isNumericString(
  val: string | number | undefined | null,
  prefix?: string,
  suffix?: string,
) {
  // for empty value we can always treat it as numeric string
  if (val === '') return true;

  return (
    !prefix?.match(/\d/) && !suffix?.match(/\d/) && typeof val === 'string' && !isNaN(Number(val))
  );
}

export function removeFormatting<BaseType = InputAttributes>(
  value: string,
  changeMeta: ChangeMeta = getDefaultChangeMeta(value),
  props: NumericFormatProps<BaseType>,
) {
  const [local, _] = splitProps(props, ['allowNegative', 'prefix', 'suffix', 'decimalScale']);

  const prefix = local.prefix ?? '';
  const suffix = local.suffix ?? '';
  const separators = getSeparators(props);
  const isBeforeDecimalSeparator = value[changeMeta.to.end] === separators.decimalSeparator;

  if (
    charIsNumber(value) &&
    (value === prefix || value === suffix) &&
    changeMeta.lastValue === ''
  ) {
    return value;
  }

  if (
    changeMeta.to.end - changeMeta.to.start === 1 &&
    separators.allowedDecimalSeparators.indexOf(value[changeMeta.to.start]) !== -1
  ) {
    const separator = local.decimalScale === 0 ? '' : separators.decimalSeparator;
    
    value =
      value.substring(0, changeMeta.to.start) +
      separator +
      value.substring(changeMeta.to.start + 1, value.length);
  }

  const stripNegation = (value: string, start: number, end: number) => {
    let hasNegation = false;
    let hasDoubleNegation = false;

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

    let charsToRemove = hasNegation ? 1 : 0;
    if (hasDoubleNegation) charsToRemove = 2;

    if (charsToRemove) {
      value = value.substring(charsToRemove);
      start -= charsToRemove;
      end -= charsToRemove;
    }

    return { value, start, end, hasNegation };
  };

  const toMetadata = stripNegation(value, changeMeta.to.start, changeMeta.to.end);
  const { hasNegation } = toMetadata;
  ({ value, start: changeMeta.to.start, end: changeMeta.to.end } = toMetadata);

  const negotiation = stripNegation(changeMeta.lastValue, changeMeta.from.start, changeMeta.from.end);

  const updatedSuffixPart = value.substring(changeMeta.to.start, changeMeta.to.end);
  if (
    value.length &&
    negotiation.start &&
    (negotiation.start > negotiation.value.length - suffix.length || negotiation.end < prefix.length) &&
    !(updatedSuffixPart && suffix.startsWith(updatedSuffixPart))
  ) {
    value = negotiation.value;
  }

  if (
    changeMeta.to.start < prefix.length &&
    !value.startsWith(prefix) &&
    changeMeta.lastValue.startsWith(prefix) &&
    prefix.length > 0
  ) {
    const isFullReplacement =
      changeMeta.from.start === 0 && changeMeta.from.end === changeMeta.lastValue.length;

    if (changeMeta.to.end < changeMeta.lastValue.length && !isFullReplacement) {
      value = negotiation.value;
    }
  }

  let startIndex = 0;
  if (value.startsWith(prefix)) startIndex += prefix.length;
  else if (changeMeta.to.start < prefix.length) startIndex = changeMeta.to.start;
  value = value.substring(startIndex);

  changeMeta.to.end -= startIndex;

  let endIndex = value.length;
  const suffixStartIndex = value.length - suffix.length;

  if (value.endsWith(suffix)) endIndex = suffixStartIndex;
  else if (changeMeta.to.end > suffixStartIndex) endIndex = changeMeta.to.end;
  else if (changeMeta.to.end > value.length - suffix.length) endIndex = changeMeta.to.end;

  value = value.substring(0, endIndex);

  value = handleNegation(hasNegation ? `-${value}` : value, local.allowNegative ?? true);

  let decimalSeparatorIndex = -1;

  // If this is a single character insertion
  if (changeMeta.to.end - changeMeta.to.start === 1) {
    // The typed character position needs to be adjusted for prefix removal
    const adjustedTypedPos = changeMeta.to.start - startIndex;
    
    // The typed character should be treated as the decimal separator if it's an allowed decimal separator
    if (adjustedTypedPos >= 0 && adjustedTypedPos < value.length && 
        separators.allowedDecimalSeparators.includes(value[adjustedTypedPos])) {
      decimalSeparatorIndex = adjustedTypedPos;
    } else {
      // Find the rightmost separator that's NOT the one just typed
      for (let i = value.length - 1; i >= 0; i--) {
        if (separators.allowedDecimalSeparators.includes(value[i]) && 
            i !== adjustedTypedPos) {
          decimalSeparatorIndex = i;
          break;
        }
      }
    }
  } else {
    // For other cases, use rightmost separator
    for (let i = value.length - 1; i >= 0; i--) {
      if (separators.allowedDecimalSeparators.includes(value[i])) {
        decimalSeparatorIndex = i;
        break;
      }
    }
  }

  // Remove all separators and only keep the decimal one
  if (decimalSeparatorIndex !== -1) {
    let cleanValue = '';
    for (let i = 0; i < value.length; i++) {
      if (separators.allowedDecimalSeparators.includes(value[i])) {
        if (i === decimalSeparatorIndex) {
          cleanValue += '.'; // Replace the decimal separator with '.'
        }
        // Skip all other separators (they're thousand separators)
      } else {
        cleanValue += value[i];
      }
    }
    value = cleanValue;
  }

  // Remove any remaining non-numeric characters except dots and minus
  value = value.replace(new RegExp(`[^0-9.\\-${escapeRegExp(separators.decimalSeparator)}]`, 'g'), '');

  // Original final decimal cleanup logic
  const decimal = splitDecimal(value, local.allowNegative ?? true);

  // Clear only if something got deleted before decimal (cursor is before decimal)
  if (
    changeMeta.to.end - changeMeta.to.start < changeMeta.from.end - changeMeta.from.start &&
  decimal.beforeDecimal === '' &&
  isBeforeDecimalSeparator &&
  !parseFloat(decimal.afterDecimal)
  ) {
    value = decimal.addNegation ? '-' : '';
  }

  return value;
}

export function getCaretBoundary<BaseType = InputAttributes>(
  formattedValue: string,
  props: NumericFormatProps<BaseType>,
) {
  const [local, _] = splitProps(props, ['prefix', 'suffix']);

  const prefix = local.prefix ?? '';
  const suffix = local.suffix ?? '';

  const boundaryAry = Array.from({ length: formattedValue.length + 1 }).map(() => true);

  const hasNegation = formattedValue[0] === '-';

  // fill for prefix and negation
  boundaryAry.fill(false, 0, prefix.length + (hasNegation ? 1 : 0));

  // fill for suffix
  const valLn = formattedValue.length;
  boundaryAry.fill(false, valLn - suffix.length + 1, valLn + 1);

  return boundaryAry;
}

function validateAndUpdateProps<BaseType = InputAttributes>(props: NumericFormatProps<BaseType>) {
  const separators = getSeparators(props);
  const thousandSeparator = separators.thousandSeparator;
  const decimalSeparator = separators.decimalSeparator;
  
  const merged = mergeProps({ prefix: '', allowNegative: true }, props);
  let allowNegative = merged.allowNegative;
  const prefix = merged.prefix;
  
  if (thousandSeparator === decimalSeparator) {
    throw new Error(`
        Decimal separator can't be same as thousand separator.
        thousandSeparator: ${thousandSeparator} (thousandSeparator = {true} is same as thousandSeparator = ",")
        decimalSeparator: ${decimalSeparator} (default value for decimalSeparator is .)
     `);
  }

  if (prefix.startsWith('-') && allowNegative) {
    // TODO: throw error in next major version
    allowNegative = false;
  }

  return mergeProps(props, { allowNegative }) as NumericFormatProps<BaseType>;
}

export function useNumericFormat<BaseType = InputAttributes>(
  props: NumericFormatProps<BaseType>,
): NumberFormatBaseProps<BaseType> {
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

  const prefix = local.prefix ?? '';
  const onKeyDown = local.onKeyDown ?? noop;
  const onBlur = local.onBlur ?? noop;

  // get derived decimalSeparator and allowedDecimalSeparators
  const separators = getSeparators(props);
  
  // Create reactive format function
  const _format = createMemo(() => {
    return (numStr: string) => format(numStr, props);
  });

  // Create reactive removeFormatting function  
  const _removeFormatting = createMemo(() => {
    return (value: string, changeMeta: any) => removeFormatting(value, changeMeta, props);
  });

  const getValue = (): string | number | null | undefined => {
    if (typeof local.value === 'function') {
      return (local.value as () => string | number | null | undefined)();
    }
    return local.value;
  };

  const _value = isNil(getValue()) ? local.defaultValue : getValue();
  // try to figure out isValueNumericString based on format prop and value
  let _valueIsNumericString =
    local.valueIsNumericString ?? isNumericString(_value, prefix, local.suffix);

  if (!isNil(getValue())) {
    _valueIsNumericString = _valueIsNumericString || typeof getValue() === 'number';
  } else if (!isNil(local.defaultValue)) {
    _valueIsNumericString = _valueIsNumericString || typeof local.defaultValue === 'number';
  }

  const roundIncomingValueToPrecision = (value: string | number | null | undefined) => {
    if (isNotValidValue(value)) return value;

    if (typeof value === 'number') {
      value = toNumericString(value);
    }

    // Always handle decimalScale=0 rounding for prop values, regardless of _valueIsNumericString
    if (typeof local.decimalScale === 'number' && local.decimalScale === 0) {
      if (typeof value === 'string' && value.includes('.')) {
        const num = parseFloat(value);
        const rounded = num < 0 ? Math.ceil(num - 0.5) : Math.floor(num + 0.5);
        return rounded.toString();
      }
    }

    if (_valueIsNumericString && typeof local.decimalScale === 'number') {
      return roundToPrecision(value, local.decimalScale, Boolean(local.fixedDecimalScale));
    }

    return value;
  };

  const [values, _onValueChange] = useInternalValues(
    () => roundIncomingValueToPrecision(getValue()),
    roundIncomingValueToPrecision(local.defaultValue),
    Boolean(_valueIsNumericString),
    _format(),
    _removeFormatting(),
    local.onValueChange,
  );
  
  const numAsString = () => values().numAsString;
  const formattedValue = () => values().formattedValue;

  const _onKeyDown: InputAttributes['onKeyDown'] = (e) => {
    const el = e.target as HTMLInputElement;
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
    if (
      key === 'Backspace' &&
      value[0] === '-' &&
      selectionStart === prefix.length + 1 &&
      local.allowNegative
    ) {
      // bring the cursor to after negation
      setCaretPosition(el, 1);
    }

    // don't allow user to delete decimal separator when decimalScale and fixedDecimalScale is set
    if (local.decimalScale && local.fixedDecimalScale) {
      if (key === 'Backspace' && value[selectionStart - 1] === separators.decimalSeparator) {
        setCaretPosition(el, selectionStart - 1);
        e.preventDefault();
      } else if (key === 'Delete' && value[selectionStart] === separators.decimalSeparator) {
        e.preventDefault();
      }
    }

    // if user presses the allowed decimal separator before the separator, move the cursor after the separator
    if (separators.allowedDecimalSeparators?.includes(key) && value[selectionStart] === separators.decimalSeparator) {
      setCaretPosition(el, selectionStart + 1);
    }

    const _thousandSeparator = local.thousandSeparator === true ? ',' : local.thousandSeparator;

    // move cursor when delete or backspace is pressed before/after thousand separator
    if (key === 'Backspace' && value[(selectionStart as number) - 1] === _thousandSeparator) {
      setCaretPosition(el, (selectionStart as number) - 1);
    }

    if (key === 'Delete' && value[selectionStart as number] === _thousandSeparator) {
      setCaretPosition(el, (selectionStart as number) + 1);
    }

    typeof onKeyDown === 'function' && onKeyDown(e);
  };

  const _onBlur: InputAttributes['onBlur'] = (e) => {
    let _value = numAsString();

    // if there no no numeric value, clear the input
    if (!_value.match(/\d/g)) {
      _value = '';
    }

    // clear leading 0s
    if (!local.allowLeadingZeros) {
      _value = fixLeadingZero(_value) as string;
    }

    // apply fixedDecimalScale on blur event
    if (local.fixedDecimalScale && local.decimalScale) {
      _value = roundToPrecision(_value, local.decimalScale, local.fixedDecimalScale);
    }

    if (_value !== numAsString()) {
      const formattedValue = format(_value, props);
      _onValueChange(
        {
          formattedValue,
          value: _value,
          floatValue: parseFloat(_value),
        },
        {
          event: e,
          source: SourceType.event,
        },
      );
    }

    typeof onBlur === 'function' && onBlur(e);
  };

  const isValidInputCharacter = (inputChar: string) => {
    if (inputChar === separators.decimalSeparator) return true;
    return charIsNumber(inputChar);
  };

  const isCharacterSame: IsCharacterSame = ({
    currentValue,
    lastValue,
    formattedValue,
    currentValueIndex,
    formattedValueIndex,
  }) => {
    const curChar = currentValue[currentValueIndex];
    const newChar = formattedValue[formattedValueIndex];

    const typedRange = findChangeRange(lastValue, currentValue);
    const { to } = typedRange;

    // handle corner case where if we user types a decimal separator with fixedDecimalScale
    // and pass back float value the cursor jumps. #851
    const getDecimalSeparatorIndex = (value: string) => {
      return _removeFormatting()(value, getDefaultChangeMeta(value)).indexOf('.') + prefix.length;
    };

    if (
      getValue() === 0 &&
      local.fixedDecimalScale &&
      local.decimalScale &&
      currentValue[to.start] === separators.decimalSeparator &&
      getDecimalSeparatorIndex(currentValue) < currentValueIndex &&
      getDecimalSeparatorIndex(formattedValue) > formattedValueIndex
    ) {
      return false;
    }

    // Special case FIRST: when user types an allowed decimal separator within typed range,
    // only allow it to match with the configured decimal separator, not thousand separator
    if (
      currentValueIndex >= to.start &&
      currentValueIndex < to.end &&
      separators.allowedDecimalSeparators &&
      separators.allowedDecimalSeparators.includes(curChar)
    ) {
      const result = newChar === separators.decimalSeparator;   
      // Only match with the actual decimal separator
      return result;
    }

    // Default character match for all other cases
    const defaultResult = curChar === newChar;

    return defaultResult;
  };

  return {
    ...(restProps as NumberFormatBaseProps<BaseType>),
    value: () => formattedValue(),
    numAsString: numAsString(),
    valueIsNumericString: false,
    isValidInputCharacter,
    isCharacterSame,
    onValueChange: _onValueChange,
    format: _format(),
    removeFormatting: _removeFormatting(),
    getCaretBoundary: (formattedValue: string) => getCaretBoundary(formattedValue, props),
    onKeyDown: _onKeyDown,
    onBlur: _onBlur,
  };
}

export default function NumericFormat<BaseType = InputAttributes>(
  props: NumericFormatProps<BaseType>,
): JSX.Element {
  const numericFormatProps = useNumericFormat(props);

  return <NumberFormatBase {...numericFormatProps} />;
}