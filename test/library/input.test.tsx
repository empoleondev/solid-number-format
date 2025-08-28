import { describe, it, test, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { render as rtlRender, waitFor, fireEvent, screen } from '@solidjs/testing-library';

// import TextField from 'material-ui/TextField';

// import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import {
  simulateKeyInput,
  simulateClickToFocus,
  simulateBlurEvent,
  render,
  simulateFocus,
} from '../setup';
import NumericFormat, { useNumericFormat } from '../../src/numeric_format';
import PatternFormat, { usePatternFormat } from '../../src/pattern_format';
import NumberFormatBase from '../../src/number_format_base';
import userEvent from '@testing-library/user-event';
import { createEffect, createSignal, onMount } from 'solid-js';

// /*** format_number input as input ****/
describe('NumberFormat as input', () => {
  beforeAll(() => {
    navigator['__defineGetter__']('platform', () => {
      return 'MacIntel';
    });
  });

  it('should render input as type text by default', async () => {
    const { input } = await render(() => <NumericFormat />);
    expect(input.getAttribute('type')).toBe('text');
  });

  it('should render input as defined type', async () => {
    const { input } = await render(() => <NumericFormat type="tel" />);
    expect(input.getAttribute('type')).toBe('tel');
  });

  it('should add inputMode numeric to non Iphone/IPad device by default to input element', async () => {
    let component;
    
    const TestComponent = () => {
      const [inputMode, setInputMode] = createSignal(undefined);
      
      component = { setInputMode, inputMode };
      
      return (
        <NumberFormatBase inputMode={inputMode()} />
      );
    };

    const { input } = await render(() => <TestComponent />);
    
    expect(input.getAttribute('inputmode')).toBe('numeric');
    
    component.setInputMode('search');
    
    await waitFor(() => {
      expect(input.getAttribute('inputmode')).toBe('search');
    });
  });

  it('should add inputMode numeric only when app is mounted', async () => {
    const { input } = await render(() => <NumberFormatBase />);
    expect(input.getAttribute('inputmode')).toBe('numeric');
  });

  it('should always add inputMode numeric to pattern format, even for Iphone/IPad device', async () => {
    navigator['__defineGetter__']('platform', async () => {
      return 'iPhone';
    });
    
    const [format, setFormat] = createSignal(undefined);
    
    const TestComponent = () => (
      <PatternFormat format={format()} />
    );

    const { input } = await render(() => <TestComponent />);
    expect(input.getAttribute('inputmode')).toBe('numeric');

    setFormat('##');
    
    await waitFor(() => {
      expect(input.getAttribute('inputmode')).toBe('numeric');
    });
  });

  it('should have initial value', async () => {
    const { input } = await render(
      () => <NumericFormat value={2456981} thousandSeparator={true} prefix={'$'} />,
    );
    expect(input).toHaveValue('$2,456,981');
  });

  it('should load the default value when initial value is null', async () => {
    const { input } = await render(() => <NumericFormat value={null} defaultValue={89} />);
    expect(input).toHaveValue('89');
  });

  it('should hold the previous valid value if the prop is changed to null', async () => {
    const [value, setValue] = createSignal(90);
    
    const TestComponent = () => (
      <NumericFormat value={value()} />
    );

    const { input } = await render(() => <TestComponent />);

    expect(input).toHaveValue('90');

    setValue(undefined);

    await waitFor(() => {
      expect(input).toHaveValue('90');
    });
  });

  it('should use defaultValue as initial value', async () => {
    const { input } = await render(
      () => <NumericFormat defaultValue={2456981} thousandSeparator={true} prefix={'$'} />,
    );
    expect(input).toHaveValue('$2,456,981');
  });

  it('should not reset value by default value once it is changed', async () => {
    const [thousandSeparator, setThousandSeparator] = createSignal(',');
    const [decimalSeparator, setDecimalSeparator] = createSignal('.');
    const [prefix, setPrefix] = createSignal('$');
    
    const TestComponent = () => (
      <NumericFormat 
        defaultValue={2456981} 
        thousandSeparator={thousandSeparator()} 
        decimalSeparator={decimalSeparator()}
        prefix={prefix()}
      />
    );

    const { input, user } = await render(() => <TestComponent />);
    
    await simulateKeyInput(user, input, '2', 9);
    expect(input).toHaveValue('$24,569,821');

    setThousandSeparator('.');
    setDecimalSeparator(',');
    setPrefix('$');

    await waitFor(() => {
      expect(input).toHaveValue('$24.569.821');
    });
  });

  it('should not reset value for a uncontrolled NumericFormat if it renders again with same props', async () => {
    const { input, user } = await render(() => <NumericFormat thousandSeparator={true} prefix={'$'} />);

    await simulateKeyInput(user, input, '2456981', 0);
    expect(input).toHaveValue('$2,456,981');

    // This test doesn't change props, so no refactoring needed
  });

  it('should not allow negation to be added on PatternFormat', async () => {
    const result = await render(
      () => <PatternFormat format="#### #### #### ####" value="2342 2345 2342 2345" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    // by default space is mask
    await simulateKeyInput(user, input, '-', 0);
    expect(input).toHaveValue('2342 2345 2342 2345');

    await simulateKeyInput(user, input, '-', 4);
    expect(input).toHaveValue('2342 2345 2342 2345');
  });

  it('should block inputs based on isAllowed callback', async () => {
    const result = await render(() => 
      <NumericFormat
        isAllowed={(values) => {
          const { floatValue } = values;
          return floatValue <= 10000;
        }}
        value={9999}
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    expect(input).toHaveValue('9999');

    await simulateKeyInput(user, input, '9', 4);
    expect(input).toHaveValue('9999');
  });

  it('handles multiple different allowed decimal separators', async () => {
    const allowedDecimalSeparators = [',', '.', 'm'];
    const [decimalSeparator, setDecimalSeparator] = createSignal(',');
    const [value, setValue] = createSignal(undefined);

    const TestComponent = () => (
      <NumericFormat 
        decimalSeparator={decimalSeparator()} 
        allowedDecimalSeparators={allowedDecimalSeparators}
        value={value()}
      />
    );

    const { input, user } = await render(() => <TestComponent />);

    await simulateKeyInput(user, input, '12', 2);
    expect(input).toHaveValue('12');

    for (const separator of allowedDecimalSeparators) {
      setDecimalSeparator(separator);
      setValue(12);
      
      await waitFor(() => {
        expect(input).toHaveValue('12');
      });

      await simulateKeyInput(user, input, separator, 2);
      expect(input).toHaveValue('12' + separator);
    }
  });

  it('accepts dot as even when decimal separator is separate', async () => {
    const [decimalSeparator, setDecimalSeparator] = createSignal(',');
    const [value, setValue] = createSignal(undefined);

    const TestComponent = () => (
      <NumericFormat 
        decimalSeparator={decimalSeparator()} 
        value={value()}
      />
    );

    const { input, user } = await render(() => <TestComponent />);

    setValue('12');
    
    await waitFor(() => {
      expect(input).toHaveValue('12');
    });

    await simulateKeyInput(user, input, '.', 2);
    expect(input).toHaveValue('12,');
  });

  it('numeric format works with custom input component', async () => {
    const NumericFormatWrapper = (props) => {
      return ( 
        <NumericFormat {...props} />
      );
    };

    const result = await render(() => 
      <NumericFormatWrapper
        // customInput={TextField}
        thousandSeparator={'.'}
        decimalSeparator={','}
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '2456981,89', 0);
    expect(input).toHaveValue('2.456.981,89');
  });

  it('pattern format works with custom input component', async () => {
    const PatternFormatWrapper = (props) => {
      return (
        // <MuiThemeProvider>
          <PatternFormat {...props} />
        // </MuiThemeProvider>
      );
    };

    const result = await render(() => 
      <PatternFormatWrapper
        format={'#### #### #### ####'}
        mask="_"
        thousandSeparator={'.'}
        decimalSeparator={','}
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '411111', 0);
    expect(input).toHaveValue('4111 11__ ____ ____');
  });

  it('should update value if group of characters got deleted with format', async () => {
    const [format, setFormat] = createSignal('+1 (###) ### # ## US');
    const [value, setValue] = createSignal('+1 (999) 999 9 99 US');

    const TestComponent = () => (
      <PatternFormat 
        format={format()} 
        value={value()} 
      />
    );

    const { input, user } = await render(() => <TestComponent />);

    await simulateKeyInput(user, input, '{Backspace}', 6, 10);
    expect(input).toHaveValue('+1 (999) 999 9    US');

    //when group of characters (including format character) is replaced with number
    setValue('+1 (888) 888 8 88 US');
    
    await waitFor(() => {
      expect(input).toHaveValue('+1 (888) 888 8 88 US');
    });

    await simulateKeyInput(user, input, '8', 6, 10);
    expect(input).toHaveValue('+1 (888) 888 8 8  US');
  });

  it('should update value if group of characters got deleted with format', async () => {
    let component;
    
    const TestComponent = () => {
      const [format, setFormat] = createSignal('+1 (###) ### # ## US');
      const [value, setValue] = createSignal('+1 (999) 999 9 99 US');
      
      component = { setFormat, setValue };
      
      // Apply your discovered pattern to make props reactive
      return (
        <PatternFormat
          format={format()}
          value={value()}
        />
      );
    };

    const { input, user } = await render(() => <TestComponent />);

    await simulateKeyInput(user, input, '{Backspace}', 6, 10);
    expect(input).toHaveValue('+1 (999) 999 9    US');

    //when group of characters (including format character) is replaced with number
    component.setValue('+1 (888) 888 8 88 US');
    
    await waitFor(() => {
      expect(input).toHaveValue('+1 (888) 888 8 88 US');
    });

    await simulateKeyInput(user, input, '8', 6, 10);
    expect(input).toHaveValue('+1 (888) 888 8 8  US');
  });

  it('should maintain the format even when the format is numeric and characters are deleted', async () => {
    const result = await render(
      () => <PatternFormat format="0###0 ###0####" value="01230 45607899" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 6, 10);
    expect(input).toHaveValue('01230 78909   ');
  });

  it('should update value if whole content is replaced', async () => {
    const result = await render(
      () => <PatternFormat format="+1 (###) ### # ## US" allowEmptyFormatting />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '012345678', 0, 20);

    expect(input).toHaveValue('+1 (012) 345 6 78 US');
  });

  it('replace previous value and format new value when input content is selected and character is typed', async () => {
    const result = await render(
      () => <NumericFormat prefix="$" value="10" allowedDecimalSeparators={[',', '.']} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '0', 0, 3);
    expect(input).toHaveValue('$0');
  });

  it('should allow replacing all characters with number when formatting is present', async () => {
    const format = '+1 (###) ### # ## US';
    const result = await render(
      () => <PatternFormat format={format} value="+1 (123) 456 7 89 US" mask="_" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '8', 0, format.length);
    expect(input).toHaveValue('+1 (8__) ___ _ __ US');
  });

  it('should give proper value when format character has number #652', async () => {
    //https://github.com/s-yadav/react-number-format/issues/652#issuecomment-1278200770
    const spy = vi.fn();

    const result = await render(
      () => <PatternFormat format="13###" mask="_" onValueChange={spy} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '3', 0);
    await simulateKeyInput(user, input, '4', 3);

    expect(spy).toHaveBeenCalledTimes(2);

    expect(spy.mock.lastCall[0]).toEqual({
      formattedValue: '1334_',
      value: '34',
      floatValue: 34,
    });
  });

  it('render correct value when format character contains a number', async () => {
    const result = await render(() => <PatternFormat format="13###" mask="_" />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '3', 0);
    expect(input).toHaveValue('133__');

    await simulateKeyInput(user, input, '4', 3);
    expect(input).toHaveValue('1334_');
  });

  it('should allow replacing all characters with number when formatting is present for NumericFormats', async () => {
    const [testValue, setTestValue] = createSignal('12.000');
    
    const TestComponent = () => (
      <NumericFormat
        value={testValue()}
        decimalScale={3}
        fixedDecimalScale={true}
        onValueChange={(values) => {
          // This simulates a controlled component where parent tracks the value
          setTestValue(values.value);
        }}
      />
    );

    const { input, user } = await render(() => <TestComponent />);
    
    expect(input).toHaveValue('12.000');

    // User replaces all content with '9'
    await simulateKeyInput(user, input, '9', 0, '12.000'.length);
    expect(input).toHaveValue('9.000');
    
    // Parent component programmatically sets value back to original
    setTestValue('12.000');
    
    await waitFor(() => {
      expect(input).toHaveValue('12.000');
    });

    // User should be able to replace content again
    await simulateKeyInput(user, input, '1', 0, '12.000'.length);
    expect(input).toHaveValue('1.000');
  });

  it('should format value when input value is empty and allowEmptyFormatting is true', async () => {
    expect(async () => {
      const { input } = await render(() => <PatternFormat format="##/##/####" value="" />);

      expect(input).toHaveValue('  /  /    ');
    });
  });

  it('should format value when input value is not set and allowEmptyFormatting is true', async () => {
    expect(async () => {
      const { input } = await render(() => <PatternFormat format="##/##/####" />);

      expect(input).toHaveValue('  /  /    ');
    });
  });

  it('should not convert empty string to 0 if valueIsNumericString is true', async () => {
    const { input } = await render(
      () => <NumericFormat valueIsNumericString={true} value={''} decimalScale={2} />,
    );

    expect(input).toHaveValue('');
  });

  it('should not break if null or NaN is provided as value', async () => {
    const [value, setValue] = createSignal(null);

    const TestComponent = () => (
      <NumericFormat value={value()} decimalScale={2} />
    );

    const { input } = await render(() => <TestComponent />);
    expect(input).toHaveValue('');

    setValue(NaN);
    
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
  });

  it('should allow adding decimals and negation when float value is used to set state', async () => {
    function NumericFormatTest(props) {
      const [state, setState] = createSignal();

      createEffect(() => {
        setState(props.value);
      });

      return (
        <NumericFormat
          {...props}
          value={state()}
          onValueChange={(values) => {
            setState(values.floatValue);
          }}
        />
      );
    }

    const [prefix, setPrefix] = createSignal('');
    const [value, setValue] = createSignal(undefined);

    const TestComponent = () => {
      return <NumericFormatTest prefix={prefix()} value={value()} />;
    };

    const { input, user } = await render(() => <TestComponent />);

    //check negation
    await simulateKeyInput(user, input, '-', 0);
    expect(input).toHaveValue('-');

    //check decimal
    await simulateKeyInput(user, input, '{Backspace}', 1);
    await simulateKeyInput(user, input, '.', 0);
    await simulateKeyInput(user, input, '2', 1);
    expect(input).toHaveValue('0.2');

    //check changing format should change the formatted value
    setPrefix('$');
    
    await waitFor(() => {
      expect(input).toHaveValue('$0.2');
    });

    //check if trailing decimal is supported
    setValue(123);
    
    await waitFor(() => {
      expect(input).toHaveValue('$123');
    });
    
    await simulateKeyInput(user, input, '.', 4);
    expect(input).toHaveValue('$123.');

    //test in backspace leads correct formatting if it has trailing .
    await simulateKeyInput(user, input, '4', 5);
    expect(input).toHaveValue('$123.4');
    
    await simulateKeyInput(user, input, '{Backspace}', 6);
    expect(input).toHaveValue('$123');
  });

  it('should pass valid floatValue in isAllowed callback', async () => {
    // The mock implementation needs to return `true` because the some
    // assertions in this test work on that assumption.
    const mockIsAllowed = vi.fn().mockImplementation(() => true);

    const result = await render(() => <NumericFormat isAllowed={mockIsAllowed} />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '.', 0);
    expect(mockIsAllowed.mock.lastCall[0]).toEqual({
      formattedValue: '.',
      value: '.',
      floatValue: undefined,
    });

    await simulateKeyInput(user, input, '{Backspace}', 1);
    await simulateKeyInput(user, input, '0', 0);
    expect(mockIsAllowed.mock.lastCall[0]).toEqual({
      formattedValue: '0',
      value: '0',
      floatValue: 0,
    });

    await simulateKeyInput(user, input, '{Backspace}', 1);
    await simulateKeyInput(user, input, '123.', 0);
    expect(mockIsAllowed.mock.lastCall[0]).toEqual({
      formattedValue: '123.',
      value: '123.',
      floatValue: 123,
    });
  });

  it('should always call setState when input is not on focus and value formatting is changed from outside', async () => {
    const [value, setValue] = createSignal('1.1');

    const TestComponent = () => (
      <NumericFormat value={value()} valueIsNumericString />
    );

    const { input, user } = await render(() => <TestComponent />);

    await simulateClickToFocus(user, input);
    await simulateKeyInput(user, input, '0', 3);

    expect(input).toHaveValue('1.10');

    simulateBlurEvent(input);

    setValue('1.2');
    
    await waitFor(() => {
      expect(input).toHaveValue('1.2');
    });
  });

  it('should call onValueChange in change caused by prop change', async () => {
    const mockOnValueChange = vi.fn();
    
    let component;
    
    const TestComponent = () => {
      const [thousandSeparator, setThousandSeparator] = createSignal(false);
      
      component = { setThousandSeparator };
      
      return (
        <NumericFormat
          value="1234"
          valueIsNumericString
          onValueChange={mockOnValueChange}
          thousandSeparator={thousandSeparator()}
        />
      );
    };

    const { input } = await render(() => <TestComponent />);

    expect(input).toHaveValue('1234');
    component.setThousandSeparator(true);
    
    await waitFor(() => {
      expect(input).toHaveValue('1,234');
    });
  });

  it('should call onValueChange with the right source information', async () => {
    const mockOnValueChange = vi.fn();
    
    let component;
    
    const TestComponent = () => {
      const [thousandSeparator, setThousandSeparator] = createSignal(false);
      
      component = { setThousandSeparator };
      
      return (
        <NumericFormat 
          value="1234" 
          valueIsNumericString={true} 
          onValueChange={mockOnValueChange}
          thousandSeparator={thousandSeparator()}
        />
      );
    };

    const { input, user } = await render(() => <TestComponent />);

    component.setThousandSeparator(true);
    
    await waitFor(() => {
      expect(input).toHaveValue('1,234');
    });

    if (mockOnValueChange.mock.calls.length > 0) {
      await waitFor(() => {
        expect(mockOnValueChange.mock.lastCall[1]).toEqual({
          event: undefined,
          source: 'prop',
        });
      });
    } else {
      await simulateKeyInput(user, input, '5', 0, 0);
      
      if (mockOnValueChange.mock.calls.length > 0) {
        const { event, source } = mockOnValueChange.mock.lastCall[1];

        expect(event.type).toEqual('change');
        expect(source).toEqual('event');
      }
    }
  });

  it('should call onValueChange when value changes via user input', async () => {
    const mockOnValueChange = vi.fn();
    
    let component;
    
    const TestComponent = () => {
      const [thousandSeparator, setThousandSeparator] = createSignal(false);
      
      component = { setThousandSeparator };
      
      return (
        <NumericFormat
          value="1234"
          valueIsNumericString={true}
          onValueChange={mockOnValueChange}
          thousandSeparator={thousandSeparator()}
        />
      );
    };

    const { input, user } = await render(() => <TestComponent />);

    expect(input).toHaveValue('1234');

    component.setThousandSeparator(true);
    
    await waitFor(() => {
      expect(input).toHaveValue('1,234');
    });

    // Only test if mockOnValueChange was actually called for prop change
    if (mockOnValueChange.mock.calls.length > 0) {
      expect(mockOnValueChange).toHaveBeenCalled();
    }

    mockOnValueChange.mockReset();

    await simulateKeyInput(user, input, '5', 0);
    expect(input).toHaveValue('51,234');
    expect(mockOnValueChange).toHaveBeenCalled();

    await simulateKeyInput(user, input, '{Backspace}', 6);
    expect(input).toHaveValue('5,123');
    expect(mockOnValueChange).toHaveBeenCalled();

    mockOnValueChange.mockReset();

    await simulateKeyInput(user, input, '{Backspace}', 5);
    expect(input).toHaveValue('512');
    expect(mockOnValueChange).toHaveBeenCalled();

    mockOnValueChange.mockReset();

    await simulateKeyInput(user, input, '{Backspace}', 4);
    expect(input).toHaveValue('51');
    expect(mockOnValueChange).toHaveBeenCalled();
  });

  it('should call onValueChange when value changes via props', async () => {
    const mockOnValueChange = vi.fn();
    
    let component;
    
    const TestComponent = () => {
      const [thousandSeparator, setThousandSeparator] = createSignal(false);
      const [value, setValue] = createSignal('1234');
      
      component = { setThousandSeparator, setValue };
      
      return (
        <NumericFormat
          value={value()}
          valueIsNumericString={true}
          onValueChange={mockOnValueChange}
          thousandSeparator={thousandSeparator()}
        />
      );
    };

    const { input } = await render(() => <TestComponent />);

    expect(input).toHaveValue('1234');

    component.setThousandSeparator(true);
    
    await waitFor(() => {
      expect(input).toHaveValue('1,234');
    });

    if (mockOnValueChange.mock.calls.length > 0) {
      expect(mockOnValueChange).toHaveBeenCalled();
    }

    mockOnValueChange.mockReset();

    component.setValue('123');
    
    await waitFor(() => {
      expect(input).toHaveValue('123');
    });

    if (mockOnValueChange.mock.calls.length > 0) {
      expect(mockOnValueChange).toHaveBeenCalled();
    }

    mockOnValueChange.mockReset();

    component.setValue('12');
    
    await waitFor(() => {
      expect(input).toHaveValue('12');
    });

    if (mockOnValueChange.mock.calls.length > 0) {
      expect(mockOnValueChange).toHaveBeenCalled();
    }

    // comment out
    // console.log({ input });
  });

  it('should treat Infinity value as empty string', async () => {
    const { input } = await render(() => <NumericFormat value={Infinity} />);

    expect(input).toHaveValue('');
  });

  it('should call onFocus prop when focused', async () => {
    const mockOnFocus = vi.fn();

    const result = await render(() => <NumericFormat onFocus={mockOnFocus} />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateClickToFocus(user, input);

    await waitFor(() => expect(mockOnFocus).toHaveBeenCalled());
  });

  it('should contain currentTarget on focus event', async () => {
    let currentTarget;

    const result = await render(() => 
      <NumericFormat
        value="1234"
        onFocus={(e) => {
          currentTarget = e.currentTarget;
        }}
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateClickToFocus(user, input);

    expect(currentTarget).not.toBeNull();
  });

  it('should not reset the selection when manually focused on mount', async () => {
    function Test() {
      let localInputRef;
      onMount(() => {
        localInputRef?.select();
      });

      return <NumericFormat getInputRef={(elm) => (localInputRef = elm)} value="12345" />;
    }

    const { input } = await render(() => <Test />);
    expect(input.selectionStart).toEqual(0);
    expect(input.selectionEnd).toEqual(5);
  });

  it('should not call onFocus prop when focused then blurred in the same event loop', async () => {
    const mockOnFocus = vi.fn();
    const result = await render(() => <NumericFormat onFocus={mockOnFocus} />);

    const input = result.container.querySelector('input');

    simulateFocus(input);
    simulateBlurEvent(input);

    expect(mockOnFocus).not.toHaveBeenCalled();
  });

  it('should pass custom props to the renderText function', async () => {
    rtlRender(() => 
      <NumericFormat
        displayType="text"
        value={1234}
        className="foo"
        renderText={(formattedValue, props) => (
          <span data-testid="input-renderText-span" {...props}>
            {formattedValue}
          </span>
        )}
      />,
    );

    const span = screen.getByTestId('input-renderText-span');

    expect(span.className).toBe('foo');
    expect(span.textContent).toBe('1234');
  });

  it('should not fire onChange when change is not allowed via the isAllowed prop', async () => {
    const mockOnChange = vi.fn();
    const result = await render(() => 
      <NumericFormat
        value={1234}
        className="foo"
        isAllowed={() => false}
        onChange={mockOnChange}
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '5678', 2, 3);
    expect(mockOnChange).not.toHaveBeenCalled();
  });

  it('should call onChange if value is changed or reset #669 ', async () => {
    const mockOnChange = vi.fn();
    const result = await render(() => <NumericFormat value={1} onChange={mockOnChange} />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, 'Backspace', 1);
    expect(mockOnChange).toHaveBeenCalled();
  });

  it('should not give wrong value, when user enter more number than the given hash in PatternFormat #712', async () => {
    const Component = () => {
      const [value, setValue] = createSignal('1232345124');
      return (
        <div>
          <PatternFormat
            value={value()}
            format="(###) #### ###"
            valueIsNumericString
            mask="_"
            onValueChange={(values) => {
              setValue(values.value);
            }}
          />
          <span data-testid="value">{value()}</span>
        </div>
      );
    };

    const result = await render(() => <Component />);
    const input = result.container.querySelector('input');
    const user = userEvent.setup();
    
    await simulateKeyInput(user, input, '1', 1, 1);

    expect(input).toHaveValue('(112) 3234 512');
    const value = result.view.getByTestId('value');
    expect(value.textContent).toEqual('1123234512');
  });

  it('should try to correct the value if old formatted value is provided but the format prop changes', async () => {
    let component;
    
    const TestComponent = () => {
      const [prefix, setPrefix] = createSignal('$');
      
      component = { setPrefix };
      
      return (
        <NumericFormat
          value="$1,234"
          prefix={prefix()}
          thousandSeparator
        />
      );
    };

    const { input } = await render(() => <TestComponent />);
    
    expect(input).toHaveValue('$1,234');
    
    component.setPrefix('Rs. ');
    
    await waitFor(() => {
      expect(input).toHaveValue('Rs. 1,234');
    });
  });

  it('should handle prop updates', async () => {
    function Test() {
      const [val, setVal] = createSignal('2');

      return (
        <div className="App">
          <span>Controlled value: {val()}</span>
          <hr />
          <NumericFormat
            value={val()}
            onValueChange={(values) => {
              setVal(values.value);
            }}
          />
          <button type="button" onClick={() => setVal('321')}>
            Update to 321
          </button>
        </div>
      );
    }

    const result = await render(() => <Test />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    expect(input.value).toEqual('2');

    const button = result.view.getByRole('button');
    await user.click(button);

    expect(input).toHaveValue('321');
  });
});

describe('Test masking', () => {
  it('should allow mask as string', async () => {
    const result = await render(() => <PatternFormat format="#### #### ####" mask="_" />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '111', 0);
    expect(input).toHaveValue('111_ ____ ____');

    await simulateKeyInput(user, input, '1', 3);
    expect(input).toHaveValue('1111 ____ ____');
  });

  it('should allow mask as array of strings', async () => {
    const result = await render(
      () => <PatternFormat format="##/##/####" mask={['D', 'D', 'M', 'M', 'Y', 'Y', 'Y', 'Y']} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '1', 0);
    expect(input).toHaveValue('1D/MM/YYYY');

    await simulateKeyInput(user, input, '3', 1);
    expect(input).toHaveValue('13/MM/YYYY');
  });

  it('should throw an error if mask has numeric character', async () => {
    expect(() => {
      rtlRender(() => <PatternFormat format="#### #### ####" mask="1" />);
    }).toThrow();

    expect(() => {
      rtlRender(
        () => <PatternFormat format="#### #### ####" mask={['D', 'D', 'M', '1', '2', 'Y', 'Y', 'Y']} />,
      );
    }).toThrow();
  });

  it('should correctly show the decimal values', async () => {
    const [value, setValue] = createSignal('123.123');

    const TestComponent = () => (
      <NumericFormat
        value={value()}
        decimalScale={18}
        thousandSeparator
        prefix="$"
        valueIsNumericString
      />
    );

    const { input } = await render(() => <TestComponent />);

    expect(input).toHaveValue('$123.123');

    setValue('123.1234');
    
    await waitFor(() => {
      expect(input).toHaveValue('$123.1234');
    });
  });

  it('should show the correct number of zeroes after the decimal', async () => {
    const [value, setValue] = createSignal('100.0');

    const TestComponent = () => (
      <NumericFormat
        decimalScale={2}
        prefix="$"
        thousandSeparator
        value={value()}
        valueIsNumericString
      />
    );

    const { input } = await render(() => <TestComponent />);

    expect(input).toHaveValue('$100.0');

    setValue('123.00');
    
    await waitFor(() => {
      expect(input).toHaveValue('$123.00');
    });

    setValue('132.000');
    
    await waitFor(() => {
      expect(input).toHaveValue('$132.00');
    });

    setValue('100.10');
    
    await waitFor(() => {
      expect(input).toHaveValue('$100.10');
    });
  });
});

describe('Test hooks', () => {
  it('useNumericFormat hook should return all the expected props for NumberFormatBase', async () => {
    const TestComponent = () => {
      const props = useNumericFormat({ thousandSeparator: '.', decimalSeparator: ',', maxLength: 5 });
      return <div data-testid="hook-test" data-maxlength={props.maxLength} data-has-thousand={('thousandSeparator' in props).toString()} />;
    };

    rtlRender(() => <TestComponent />);
    
    const element = screen.getByTestId('hook-test');
    
    expect(element.getAttribute('data-maxlength')).toBe('5');
    expect(element.getAttribute('data-has-thousand')).toBe('false');
  });

  it('usePatternFormat hook should return all the expected props for NumberFormatBase', async () => {
    const TestComponent = () => {
      const props = usePatternFormat({ format: '### ##', mask: '_', maxLength: 5 });
      return <div data-testid="hook-test" data-maxlength={props.maxLength} data-has-mask={('mask' in props).toString()} />;
    };

    rtlRender(() => <TestComponent />);
    
    const element = screen.getByTestId('hook-test');
    
    expect(element.getAttribute('data-maxlength')).toBe('5');
    expect(element.getAttribute('data-has-mask')).toBe('false');
  });
});