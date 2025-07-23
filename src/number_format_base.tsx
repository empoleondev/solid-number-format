import { createEffect, createSignal, onCleanup, onMount, splitProps } from 'solid-js';
import type { JSX } from 'solid-js';
import {
  FormatInputValueFunction,
  NumberFormatBaseProps,
  InputAttributes,
  SourceType,
  Timeout,
} from './types';
import {
  addInputMode,
  findChangeRange,
  geInputCaretPosition,
  setCaretPosition,
  getCaretPosition,
  charIsNumber,
  useInternalValues,
  noop,
  caretUnknownFormatBoundary,
  getCaretPosInBoundary,
  findChangedRangeFromCaretPositions,
} from './utils';

function defaultRemoveFormatting(value: string) {
  return value.replace(/[^0-9]/g, '');
}

function defaultFormat(value: string) {
  return value;
}

export default function NumberFormatBase<BaseType = InputAttributes>(
  props: NumberFormatBaseProps<BaseType>,
): JSX.Element {
  const [local, otherProps] = splitProps(props, [
    'type',
    'displayType',
    'customInput',
    'renderText',
    'getInputRef',
    'format',
    'removeFormatting',
    'defaultValue',
    'valueIsNumericString',
    'onValueChange',
    'isAllowed',
    'onChange',
    'onKeyDown',
    'onMouseUp',
    'onFocus',
    'onBlur',
    'value',
    'getCaretBoundary',
    'isValidInputCharacter',
    'isCharacterSame',
  ]);

  const removeFormatting = local.removeFormatting ?? defaultRemoveFormatting;
  const format = local.format ?? defaultFormat;

  const type = local.type ?? 'text';
  const displayType = local.displayType ?? 'input';
  const onChange = local.onChange ?? noop;
  const onKeyDown = local.onKeyDown ?? noop;
  const onMouseUp = local.onMouseUp ?? noop;
  const onFocus = local.onFocus ?? noop;
  const onBlur = local.onBlur ?? noop;
  const getCaretBoundary = local.getCaretBoundary ?? caretUnknownFormatBoundary;
  const isValidInputCharacter = local.isValidInputCharacter ?? charIsNumber;

  // const [{ formattedValue, numAsString }, onFormattedValueChange] = useInternalValues(
  //   () => local.value,
  //   local.defaultValue,
  //   Boolean(local.valueIsNumericString),
  //   format as FormatInputValueFunction,
  //   removeFormatting,
  //   local.onValueChange,
  // );
  const [values, onFormattedValueChange] = useInternalValues(
    () => local.value,
    local.defaultValue,
    Boolean(local.valueIsNumericString),
    format as FormatInputValueFunction,
    removeFormatting,
    local.onValueChange,
  );
  const formattedValue = () => values().formattedValue;
  const numAsString = () => values().numAsString;

  let caretPositionBeforeChange: { selectionStart: number; selectionEnd: number } | undefined;
  let lastUpdatedValue = { formattedValue: formattedValue(), numAsString: numAsString() };

  const _onValueChange: NumberFormatBaseProps['onValueChange'] = (values, source) => {
    lastUpdatedValue = { formattedValue: values.formattedValue, numAsString: values.value };
    onFormattedValueChange(values, source);
  };

  const [mounted, setMounted] = createSignal(false);
  let focusedElm: HTMLInputElement | null = null;

  const timeout = {
    setCaretTimeout: null as Timeout | null,
    focusTimeout: null as Timeout | null,
  };

  onMount(() => {
    setMounted(true);
  });

  onCleanup(() => {
    clearTimeout(timeout.setCaretTimeout as unknown as Timeout);
    clearTimeout(timeout.focusTimeout as unknown as Timeout);
  });

  const _format = format as FormatInputValueFunction;

  const getValueObject = (formattedValue: string, numAsString: string) => {
    const floatValue = parseFloat(numAsString);

    return {
      formattedValue,
      value: numAsString,
      floatValue: isNaN(floatValue) ? undefined : floatValue,
    };
  };

  const setPatchedCaretPosition = (
    el: HTMLInputElement,
    caretPos: number,
    currentValue: string,
  ) => {
    // don't reset the caret position when the whole input content is selected
    if (el.selectionStart === 0 && el.selectionEnd === el.value.length) return;

    /* setting caret position within timeout of 0ms is required for mobile chrome,
    otherwise browser resets the caret position after we set it
    We are also setting it without timeout so that in normal browser we don't see the flickering */
    setCaretPosition(el, caretPos);

    timeout.setCaretTimeout = setTimeout(() => {
      if (el.value === currentValue && el.selectionStart !== caretPos) {
        setCaretPosition(el, caretPos);
      }
    }, 0);
  };

  /* This keeps the caret within typing area so people can't type in between prefix or suffix */
  const correctCaretPosition = (value: string, caretPos: number, direction?: string) => {
    return getCaretPosInBoundary(value, caretPos, getCaretBoundary(value), direction);
  };

  const getNewCaretPosition = (inputValue: string, newFormattedValue: string, caretPos: number) => {
    const caretBoundary = getCaretBoundary(newFormattedValue);
    let updatedCaretPos = getCaretPosition(
      newFormattedValue,
      formattedValue(),
      inputValue,
      caretPos,
      caretBoundary,
      isValidInputCharacter,
      local.isCharacterSame,
    );

    //correct caret position if its outside of editable area
    updatedCaretPos = getCaretPosInBoundary(newFormattedValue, updatedCaretPos, caretBoundary);

    return updatedCaretPos;
  };

  const updateValueAndCaretPosition = (params: {
    formattedValue?: string;
    numAsString: string;
    inputValue?: string;
    input?: HTMLInputElement | null;
    event?: InputEvent | FocusEvent | KeyboardEvent;
    source: SourceType;
  }) => {
    let caretPos;
    const newFormattedValue = params.formattedValue ?? '';

    if (params.input) {
      const inputValue = params.inputValue || params.input.value;

      const currentCaretPosition = geInputCaretPosition(params.input);

      /**
       * set the value imperatively, this is required for IE fix
       * This is also required as if new caret position is beyond the previous value.
       * Caret position will not be set correctly
       */
      params.input.value = newFormattedValue;

      //get the caret position
      caretPos = getNewCaretPosition(inputValue, newFormattedValue, currentCaretPosition);

      //set caret position imperatively
      if (caretPos !== undefined) {
        setPatchedCaretPosition(params.input, caretPos, newFormattedValue);
      }
    }

    if (newFormattedValue !== formattedValue()) {
      // trigger onValueChange synchronously, so parent is updated along with the number format. Fix for #277, #287
      _onValueChange(getValueObject(newFormattedValue, params.numAsString), {
        event: params.event,
        source: params.source,
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
  const currentCaretPosition = focusedElm ? geInputCaretPosition(focusedElm) : undefined;

  // needed to prevent warning with useLayoutEffect on server

  onMount(() => {
    const input = focusedElm;
    if (formattedValue() !== lastUpdatedValue.formattedValue && input) {
      const caretPos = getNewCaretPosition(
        lastUpdatedValue.formattedValue,
        formattedValue(),
        currentCaretPosition,
      );
      /**
       * set the value imperatively, as we set the caret position as well imperatively.
       * This is to keep value and caret position in sync
       */
      input.value = formattedValue();
      setPatchedCaretPosition(input, caretPos, formattedValue());
    }
  });

  const formatInputValue = (
    inputValue: string,
    event: InputEvent | FocusEvent | KeyboardEvent,
    source: SourceType,
  ) => {
    const input = event.target as HTMLInputElement;

    const changeRange = caretPositionBeforeChange
      ? findChangedRangeFromCaretPositions(caretPositionBeforeChange, input.selectionEnd)
      : findChangeRange(formattedValue(), inputValue);

    const changeMeta = {
      ...changeRange,
      lastValue: formattedValue(),
    };
    let _numAsString = removeFormatting(inputValue, changeMeta);
    const _formattedValue = _format(_numAsString);

    // if (local.isAllowed) {
    //   const valueObj = getValueObject(_formattedValue, _numAsString);
    //   console.log('   ⇨ isAllowed check with:', valueObj);
    // }

    // formatting can remove some of the number chars, so we need to fine number string again
    _numAsString = removeFormatting(_formattedValue, undefined);

    if (local.isAllowed && !local.isAllowed(getValueObject(_formattedValue, _numAsString))) {
      //reset the caret position
      const input = event.target as HTMLInputElement;
      const currentCaretPosition = geInputCaretPosition(input);

      const caretPos = getNewCaretPosition(inputValue, formattedValue(), currentCaretPosition);
      input.value = formattedValue();
      setPatchedCaretPosition(input, caretPos, formattedValue());
      return false;
    }

    updateValueAndCaretPosition({
      formattedValue: _formattedValue,
      numAsString: _numAsString,
      inputValue,
      event,
      source,
      input: event.target as HTMLInputElement,
    });

    return true;
  };

  const setCaretPositionInfoBeforeChange = (el: HTMLInputElement, endOffset: number = 0) => {
    caretPositionBeforeChange = {
      selectionStart: el.selectionStart,
      selectionEnd: el.selectionEnd + endOffset,
    };
  };

  const _onChange = (e: InputEvent) => {
    const el = e.target as HTMLInputElement;
    const inputValue = el.value;

    const changed = formatInputValue(inputValue, e, SourceType.event);

    if (changed)
      typeof onChange === 'function' &&
        onChange(
          e as unknown as Event & { currentTarget: HTMLInputElement; target: HTMLInputElement },
        );

    // reset the position, as we have already handled the caret position
    caretPositionBeforeChange = undefined;
  };

  const handleRawChange: JSX.DOMAttributes<HTMLInputElement>['onChange'] = (e) => {
    // cast the Solid/DOM event to InputEvent
    _onChange(e as unknown as InputEvent);
  };

  const _onKeyDown = (e: KeyboardEvent) => {
    const el = e.target as HTMLInputElement;
    const { key } = e;
    const { selectionStart, selectionEnd, value = '' } = el;

    let expectedCaretPosition;

    //Handle backspace and delete against non numerical/decimal characters or arrow keys
    if (key === 'ArrowLeft' || key === 'Backspace') {
      expectedCaretPosition = Math.max((selectionStart as number) - 1, 0);
    } else if (key === 'ArrowRight') {
      expectedCaretPosition = Math.min((selectionStart as number) + 1, value.length);
    } else if (key === 'Delete') {
      expectedCaretPosition = selectionStart;
    }

    // if key is delete and text is not selected keep the end offset to 1, as it deletes one character
    // this is required as selection is not changed on delete case, which changes the change range calculation
    let endOffset = 0;
    if (key === 'Delete' && selectionStart === selectionEnd) {
      endOffset = 1;
    }

    const isArrowKey = key === 'ArrowLeft' || key === 'ArrowRight';

    //if expectedCaretPosition is not set it means we don't want to Handle keyDown
    // also if multiple characters are selected don't handle
    if (expectedCaretPosition === undefined || (selectionStart !== selectionEnd && !isArrowKey)) {
      typeof onKeyDown === 'function' &&
        onKeyDown(
          e as unknown as KeyboardEvent & { currentTarget: HTMLInputElement; target: Element },
        );
      // keep information of what was the caret position before keyDown
      // set it after onKeyDown, in case parent updates the position manually
      setCaretPositionInfoBeforeChange(el, endOffset);
      return;
    }

    let newCaretPosition = expectedCaretPosition;

    if (isArrowKey) {
      const direction = key === 'ArrowLeft' ? 'left' : 'right';
      newCaretPosition = correctCaretPosition(value, expectedCaretPosition, direction);
      // arrow left or right only moves the caret, so no need to handle the event, if we are handling it manually
      if (newCaretPosition !== expectedCaretPosition) {
        e.preventDefault();
      }
    } else if (key === 'Delete' && !isValidInputCharacter(value[expectedCaretPosition])) {
      // in case of delete go to closest caret boundary on the right side
      newCaretPosition = correctCaretPosition(value, expectedCaretPosition, 'right');
    } else if (key === 'Backspace' && !isValidInputCharacter(value[expectedCaretPosition])) {
      // in case of backspace go to closest caret boundary on the left side
      newCaretPosition = correctCaretPosition(value, expectedCaretPosition, 'left');
    }

    if (newCaretPosition !== expectedCaretPosition) {
      setPatchedCaretPosition(el, newCaretPosition, value);
    }

    typeof onKeyDown === 'function' &&
      onKeyDown(
        e as unknown as KeyboardEvent & { currentTarget: HTMLInputElement; target: Element },
      );

    setCaretPositionInfoBeforeChange(el, endOffset);
  };

  /** required to handle the caret position when click anywhere within the input **/
  const _onMouseUp = (e: MouseEvent) => {
    const el = e.target as HTMLInputElement;

    /**
     * NOTE: we have to give default value for value as in case when custom input is provided
     * value can come as undefined when nothing is provided on value prop.
     */

    const correctCaretPositionIfRequired = () => {
      const { selectionStart, selectionEnd, value = '' } = el;
      if (selectionStart === selectionEnd) {
        const caretPosition = correctCaretPosition(value, selectionStart as number);
        if (caretPosition !== selectionStart) {
          setPatchedCaretPosition(el, caretPosition, value);
        }
      }
    };

    correctCaretPositionIfRequired();

    // try to correct after selection has updated by browser
    // this case is required when user clicks on some position while a text is selected on input
    requestAnimationFrame(() => {
      correctCaretPositionIfRequired();
    });

    typeof onMouseUp === 'function' &&
      onMouseUp(e as unknown as MouseEvent & { currentTarget: HTMLInputElement; target: Element });
    setCaretPositionInfoBeforeChange(el);
  };

  const _onFocus = (e: FocusEvent) => {
    const el = e.target as HTMLInputElement;
    const currentTarget = e.currentTarget as HTMLInputElement;
    focusedElm = el;

    timeout.focusTimeout = setTimeout(() => {
      const { selectionStart, selectionEnd, value = '' } = el;

      const caretPosition = correctCaretPosition(value, selectionStart as number);

      //setPatchedCaretPosition only when everything is not selected on focus (while tabbing into the field)
      if (
        caretPosition !== selectionStart &&
        !(selectionStart === 0 && selectionEnd === value.length)
      ) {
        setPatchedCaretPosition(el, caretPosition, value);
      }

      typeof onFocus === 'function' &&
        onFocus({
          ...e,
          currentTarget,
          target: el,
        });
    }, 0);
  };

  const _onBlur = (e: FocusEvent) => {
    const el = e.target as HTMLInputElement;
    const currentTarget = e.currentTarget as HTMLInputElement;
    focusedElm = null;
    clearTimeout(timeout.focusTimeout as unknown as Timeout);
    clearTimeout(timeout.setCaretTimeout as unknown as Timeout);
    typeof onBlur === 'function' &&
      onBlur({
        ...e,
        currentTarget,
        target: el,
      });
  };

  // add input mode on element based on format prop and device once the component is mounted
  const inputMode: InputAttributes['inputMode'] =
    mounted() && addInputMode() ? 'numeric' : undefined;

  if (displayType === 'text') {
    return local.renderText ? (
      <>{local.renderText(formattedValue(), otherProps) || null}</>
    ) : (
      <span {...otherProps} ref={local.getInputRef}>
        {formattedValue()}
      </span>
    );
  } else if (local.customInput) {
    const CustomInput = local.customInput;

    return (
      /* @ts-ignore */
      <CustomInput
        {...otherProps}
        type={local.type ?? 'text'}
        value={formattedValue()}
        onInput={_onChange}
        ref={local.getInputRef}
        onKeyDown={onKeyDown}
        onMouseUp={onMouseUp}
        onFocus={_onFocus}
        onBlur={_onBlur}
      />
    );
  }

  return (
    <input
      {...otherProps}
      type={local.type ?? 'text'}
      value={formattedValue()}
      onInput={_onChange}
      onChange={handleRawChange} 
      ref={local.getInputRef}
      onKeyDown={onKeyDown}
      onMouseUp={onMouseUp}
      onFocus={_onFocus}
      onBlur={_onBlur}
    />
  );
}
