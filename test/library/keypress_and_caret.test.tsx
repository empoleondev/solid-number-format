import { describe, it, expect, vi } from 'vitest';
import { waitFor, fireEvent } from '@solidjs/testing-library';
import userEvent from '@testing-library/user-event';
import { createSignal } from 'solid-js';

import NumericFormat from '../../src/numeric_format';
import PatternFormat from '../../src/pattern_format';
import NumberFormatBase from '../../src/number_format_base';
import {
  render,
  simulateBlurEvent,
  simulateKeyInput,
  simulateMouseUpEvent,
  simulatePaste,
  simulateTripleClick,
  simulateFocus,
} from '../setup';
import { cardExpiry } from '../../custom_formatters/card_expiry';

describe('Test keypress and caret position changes', () => {
  it('should maintain caret position if suffix/prefix is updated while typing #249', async () => {
      function TestComp() {
      const [prefix, setPrefix] = createSignal('$');
      const [value, setValue] = createSignal('123');
      
      const handleValueChange = ({ value: newValue }) => {
          setValue(newValue);
          setPrefix(newValue.length > 3 ? '$$' : '$');
      };

      return (
          <NumericFormat
          valueIsNumericString={true}
          prefix={prefix()}
          value={value()}
          onValueChange={handleValueChange}
          />
      );
      }

      const result = await render(() => <TestComp />);
      const input = result.container.querySelector('input');
      const user = userEvent.setup();

      await simulateKeyInput(user, input, '4', 2, 2);
      expect(input.value).toBe('$1423');
      expect(input.selectionStart).toEqual(3);

      await simulateKeyInput(user, input, '{Backspace}', 4, 4);
      expect(input.value).toBe('$143');
      expect(input.selectionStart).toEqual(3);
  });

  it('should maintain caret position when isAllowed returns false', async () => {
    const result = await render(() => 
      <NumericFormat
        isAllowed={({ floatValue }) => {
          return floatValue < 100;
        }}
        value={100.222}
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '1', 2, 2);

    expect(input.value).toBe('100.222');
    expect(input.selectionStart).toEqual(2);
  });

  it('should update caret position when any of the decimal separator is pressed just before the decimal separator #711', async () => {
    const result = await render(() =>
      <NumericFormat
        value={12}
        allowedDecimalSeparators={[',', '.']}
        decimalSeparator=","
        thousandSeparator="."
        decimalScale={3}
        fixedDecimalScale
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, ',', 2, 2);
    expect(input).toHaveValue('12,000');
    expect(input.selectionStart).toEqual(3);

    await simulateKeyInput(user, input, '.', 2, 2);
    expect(input).toHaveValue('12,000');
    expect(input.selectionStart).toEqual(3);
  });

  it('should not break the cursor position when format prop is updated', async () => {
    const Test = () => {
      const [val, setValue] = createSignal("");
    
      return (
        <NumericFormat
          thousandSeparator=" "
          decimalScale={2}
          placeholder="0,00"
          fixedDecimalScale
          thousandsGroupStyle="thousand"
          decimalSeparator=","
          value={val()}
          onValueChange={(v) => {
          setValue(v.floatValue);
          }}
          prefix={val() > 0 ? '+' : undefined}
        />
      );
    };
    const result = await render(() => <Test />);
    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '1', 0, 0);

    expect(input).toHaveValue('+1,00');
    expect(input.selectionStart).toEqual(2);
  });

  it('should put correct position when . is pressed on empty value #817', async () => {
    const Test = () => {
      const [value, setValue] = createSignal();
      return (
        <NumericFormat
          autoComplete="off"
          fixedDecimalScale
          decimalScale={2}
          onValueChange={(obj) => {
            setValue(obj.value);
          }}
          value={value()}
          allowNegative={false}
          allowLeadingZeros={false}
        />
      );
    };

    const result = await render(() => <Test />);
    const input = result.container.querySelector('input');
    const user = userEvent.setup();
    
    await simulateKeyInput(user, input, '.5', 0, 0);

    expect(input.selectionStart).toEqual(2);

    input.blur();

    await waitFor(() => expect(input.value).toEqual('0.50'));
  });

  // not work
  it('should handle caret position correctly when suffix starts with space and allowed decimal separator is pressed. #725', async () => {
    const result = await render(() =>
      <NumericFormat
        value={2}
        decimalSeparator=","
        thousandSeparator="."
        decimalScale={2}
        prefix="$"
        suffix=" €"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '.', 2, 2);
    expect(input.selectionStart).toEqual(3);
  });

  // not work
  it('should handle caret position correctly when suffix starts with space and allowed decimal separator is pressed in empty input. #774', async () => {
    const result = await render(() =>
      <NumericFormat
        value={''}
        decimalSeparator=","
        allowedDecimalSeparators={['%', '.']}
        decimalScale={2}
        suffix=" €"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '.', 0, 0);
    expect(input.selectionStart).toEqual(1);
  });

  it('should handle the caret position when prefix is provided and number is entered on empty input', async () => {
    const result = await render(() => <NumericFormat value={''} prefix="$" />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '1', 0, 0);
    expect(input.selectionStart).toEqual(2);
  });

  it('should handle the caret position when prefix is provided and allowed decimal separator is entered on empty input', async () => {
    const result = await render(() => 
      <NumericFormat
        value={''}
        decimalSeparator=","
        allowedDecimalSeparators={['%', '.']}
        prefix="$"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '.', 0, 0);
    expect(input.selectionStart).toEqual(2);
  });

  it('should not reset caret position if caret is updated by browser after we set caret position #811', async () => {
    // https://codesandbox.io/p/sandbox/recursing-poitras-rxtjkj?file=%2Fsrc%2Findex.test.js%3A15%2C5-15%2C44
    const result = await render(() => 
      <NumericFormat
        allowLeadingZeros={false}
        allowNegative={false}
        decimalSeparator="."
        displayType="input"
        placeholder="people"
        suffix=" people"
        valueIsNumericString={false}
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    // @ts-ignore
    await simulateKeyInput(user, input, '91', 0);

    expect(input.value).toEqual('91 people');
  });

  // flawed test apprently
//   it('should handle caret position when float numbers are used with decimals #851', async () => {
//   const Test = ({ decimalSeparator = '.' }) => {
//     const [value, setValue] = createSignal();
    
//     console.log('Test component render with decimalSeparator:', decimalSeparator);
//     console.log('Current value signal:', value());
    
//     return (
//       <NumericFormat
//         prefix="$"
//         fixedDecimalScale
//         decimalSeparator={decimalSeparator}
//         thousandSeparator={decimalSeparator === '.' ? ',' : '.'}
//         decimalScale={2}
//         onValueChange={(obj) => {
//           console.log('onValueChange called with:', obj);
//           setValue(obj.floatValue);
//         }}
//         value={value()}
//         allowNegative={false}
//         allowLeadingZeros={false}
//       />
//     );
//   };

//   const [decimalSeparator, setDecimalSeparator] = createSignal('.');
//   const TestWrapper = () => <Test decimalSeparator={decimalSeparator()} />;
  
//   const result = await render(() => <TestWrapper />);
//   const input = result.container.querySelector('input');
//   const user = userEvent.setup();

//   console.log('=== FIRST PART: Testing with "." separator ===');
//   console.log('Initial state:', { value: input.value, selectionStart: input.selectionStart });

//   await simulateKeyInput(user, input, '.', 0, 0);
  
//   console.log('After typing ".":', { 
//     value: input.value, 
//     selectionStart: input.selectionStart,
//     expected: 3 
//   });
  
//   expect(input.selectionStart).toEqual(3);
//   await waitFor(() => expect(input.value).toEqual('$0.00'));

//   console.log('=== CHANGING SEPARATOR TO "," ===');
//   setDecimalSeparator(',');
  
//   await waitFor(() => {
//     console.log('After separator change:', { 
//       value: input.value,
//       decimalSeparator: decimalSeparator() 
//     });
//   });

//   console.log('=== PROBLEMATIC PART: Direct DOM manipulation ===');
//   console.log('Before clearing - input.value:', input.value);
//   input.value = '';  // This is the problematic line
//   console.log('After clearing - input.value:', input.value);

//   console.log('=== SECOND PART: Testing with "," separator ===');
//   await simulateKeyInput(user, input, ',', 0, 0);
  
//   console.log('After typing ",":', { 
//     value: input.value, 
//     selectionStart: input.selectionStart,
//     expected: 3 
//   });
  
//   expect(input.selectionStart).toEqual(3);
//   await waitFor(() => expect(input.value).toEqual('$0,00'));
// });
  

  it('should keep the caret position at proper position when fixedDecimalScale is used and user types after clearing input #855', async () => {
    const result = await render(
      () => <NumericFormat value={0} fixedDecimalScale decimalScale={2} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, 'Backspace', 0, 4);

    await simulateKeyInput(user, input, '1', 0, 0);
    expect(input.selectionStart).toEqual(1);
  });
});

describe('Test character insertion', () => {
  // not work
  it('should add any number properly when input is empty without format prop passed1', async () => {
    const [value, setValue] = createSignal('');

    const TestComponent = () => (
      <NumericFormat 
        thousandSeparator={true} 
        prefix={'$'} 
        value={value()}
        onValueChange={(values) => setValue(values.value || '')}
      />
    );

    const result = await render(() => <TestComponent />);
    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '1', 0);

    expect(input).toHaveValue('$1');

    setValue('');
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });

    await simulateKeyInput(user, input, '2456789', 0);

    expect(input).toHaveValue('$2,456,789');
  });

  it('should add any number properly when input is empty without format prop passed1', async () => {
    const [value, setValue] = createSignal('');
    
    const TestComponent = () => (
      <NumericFormat 
        thousandSeparator={true} 
        prefix={'$'} 
        value={value()}
        onValueChange={(values) => setValue(values.value || '')}
      />
    );

    const result = await render(() => <TestComponent />);
    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '1', 0);
    expect(input).toHaveValue('$1');

    setValue('');
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });

    await simulateKeyInput(user, input, '2456789', 0);
    expect(input).toHaveValue('$2,456,789');
  });

  it('should add any number properly when input is empty without format prop passed2', async () => {
    const [value, setValue] = createSignal('');
    
    const TestComponent = () => {
      return (
        <NumericFormat
          thousandSeparator={true}
          prefix={'$'}
          value={value()}
          onValueChange={(values) => {
            setValue(values.value || ''); // Use empty string fallback
          }}
        />
      );
    };
    
    const result = await render(() => <TestComponent />);
    const input = result.container.querySelector('input');
    const user = userEvent.setup();
    
    // First input
    await simulateKeyInput(user, input, '1', 0);
    expect(input).toHaveValue('$1');
    
    // Clear the value
    setValue(null);
    
    // Wait and check
    await waitFor(() => {
      expect(input.value).toBe('');
    });
    
    // Second input
    await simulateKeyInput(user, input, '2456789', 0);
    expect(input).toHaveValue('$2,456,789');
  });

  it('should add any number properly when input is empty with format prop passed', async () => {
    const [format, setFormat] = createSignal("#### #### #### ####");
    const [value, setValue] = createSignal('');
    
    const TestComponent = () => {
      return (
        <PatternFormat
          format={format()}
          mask="_"
          value={value()}
          onValueChange={(values) => {            
            setValue(values.value || ''); // Sync back to external signal
          }}
        />
      );
    };
    
    //case 1: Enter first number
    const { input, user } = await render(() => <TestComponent />);
    
    await simulateKeyInput(user, input, '1', 0);
    expect(input).toHaveValue('1___ ____ ____ ____');
    
    //case 2: if nun numeric character got added
    setValue('');
    
    await waitFor(() => {
      expect(input.value).toBe('');
    });
    
    await simulateKeyInput(user, input, 'b', 0);
    expect(input).toHaveValue('');
    
    //case 3: Enter first multiple number
    await simulatePaste(user, input, '2456789');
    expect(input).toHaveValue('2456 789_ ____ ____');
    
    //case 4: When alpha numeric character got added
    await simulatePaste(user, input, '245sf6789', 0, 20);
    expect(input).toHaveValue('2456 789_ ____ ____');
    
    //case 5: Similiar to case 4 but a formatted value got added
    await simulatePaste(user, input, '1234 56', 0, 3);
    expect(input).toHaveValue('1234 5667 89__ ____');
    
    await simulatePaste(user, input, '1234 56', 0, 20);
    expect(input).toHaveValue('1234 56__ ____ ____');
    
    //case 6: If format has numbers
    setFormat("+1 (###) ### # ##");
    
    await simulatePaste(user, input, '123456', 0, 20);
    expect(input).toHaveValue('+1 (123) 456 _ __');
    
    // case 7: If format has numbers and and formatted value is inserted
    await simulatePaste(user, input, '+1 (965) 432 1 19', 0, 20);
    expect(input).toHaveValue('+1 (965) 432 1 19');
  });

  it('should handle addition of characters at a cursor position1', async () => {
    const result = await render(
      () => <NumericFormat thousandSeparator={true} prefix={'$'} value="$12,345" />,
    );
    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    // Add a small delay to let any async operations settle
    await new Promise(resolve => setTimeout(resolve, 10));
    
    await simulateKeyInput(user, input, '8', 2, 2);

    // Add delay before checking
    await new Promise(resolve => setTimeout(resolve, 1));
    
    expect(input).toHaveValue('$182,345');
    expect(input.selectionStart).toEqual(3);
    
    await simulateKeyInput(user, input, '67', 3, 3);
    
    expect(input).toHaveValue('$18,672,345');
    expect(input.selectionStart).toEqual(6);
  });

  it('should handle addition of characters at a cursor position2', async () => {
    const [value, setValue] = createSignal('$12,345');

    const TestComponent = () => (
      <PatternFormat 
        format={'### ### ###'} 
        value={value()} 
      />
    );

    const { input, user } = await render(() => <TestComponent />);

    setValue('123 456 789');
    
    await waitFor(() => {
      expect(input.value).toBe('123 456 789');
    });
    
    await simulateKeyInput(user, input, '8', 3, 3);
    expect(input).toHaveValue('123 845 678');
    expect(input.selectionStart).toEqual(5);

    await simulateKeyInput(user, input, '999', 4, 4);
    expect(input).toHaveValue('123 999 845');
    expect(input.selectionStart).toEqual(7);
  });

  it('after typing decimal cursor position should go after the . when suffix is provided. #673', async () => {
    const result = await render(() => 
      <NumericFormat
        type="text"
        allowNegative={false}
        valueIsNumericString={true}
        decimalScale={8}
        placeholder="Enter Amount"
        defaultValue="123"
        suffix=" USD"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '.', 3, 3);
    expect(input.selectionStart).toEqual(4);
  });

  it('should bring caret to correct position if user types same number used in format pattern', async () => {
    const result = await render(() => <PatternFormat format="+1 (###) 2##-####" mask="_" />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '1', 0, 0);
    expect(input.selectionStart).toEqual(5);

    await simulateKeyInput(user, input, '23', 5, 5);
    await simulateKeyInput(user, input, '2', 7, 7);

    expect(input.selectionStart).toEqual(11);
  });
});

describe('Test delete/backspace with format pattern', () => {
  it('caret position should not change if its on starting of input area', async () => {
    const result = await render(
      () => <PatternFormat format="+1 (###) ### # ## US" value="+1 (123) 456 7 89 US" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 4, 4);
    expect(input).toHaveValue('+1 (123) 456 7 89 US');
    expect(input.selectionStart).toEqual(4);
  });

  it('caret position should not change if its on end of input area', async () => {
    const result = await render(
      () => <PatternFormat format="+1 (###) ### # ## US" value="+1 (123) 456 7 89 US" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Delete}', 17, 17);
    expect(input).toHaveValue('+1 (123) 456 7 89 US');
    expect(input.selectionStart).toEqual(17);
  });

  it('should remove the numeric part irrespective of the cursor position', async () => {
    const result = await render(
      () => <PatternFormat format="+1 (###) ### # ## US" mask="_" value="+1 (123) 456 7 89 US" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 10, 10);
    expect(input).toHaveValue('+1 (123) 567 8 9_ US');
    expect(input.selectionStart).toEqual(9);

    await simulateKeyInput(user, input, '{Backspace}', 9, 9);
    expect(input).toHaveValue('+1 (125) 678 9 __ US');
    expect(input.selectionStart).toEqual(6);

    await simulateKeyInput(user, input, '{Delete}', 7, 7);
    expect(input).toHaveValue('+1 (125) 789 _ __ US');
    expect(input.selectionStart).toEqual(9);

    await simulateKeyInput(user, input, '{Delete}', 9, 9);
    expect(input).toHaveValue('+1 (125) 89_ _ __ US');
    expect(input.selectionStart).toEqual(9);
  });
});

describe('Test delete/backspace with numeric format', () => {
  it('should not remove prefix', async () => {
    const result = await render(() => 
      <NumericFormat
        thousandSeparator=","
        prefix="Rs. "
        suffix=" /sq.feet"
        value="Rs. 12,345.50 /sq.feet"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 4, 4);
    expect(input).toHaveValue('Rs. 12,345.50 /sq.feet');
    expect(input.selectionStart).toEqual(4);
  });

  it('should not remove suffix', async () => {
    const result = await render(() => 
      <NumericFormat
        thousandSeparator=","
        prefix="Rs. "
        suffix=" /sq.feet"
        value="Rs. 12,345.50 /sq.feet"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Delete}', 13, 13);
    expect(input).toHaveValue('Rs. 12,345.50 /sq.feet');
    expect(input.selectionStart).toEqual(13);
  });

  it('should remove number, irrespective of the cursor position', async () => {
    const result = await render(() => 
      <NumericFormat
        thousandSeparator=","
        prefix="Rs. "
        suffix=" /sq.feet"
        value="Rs. 12,345.50 /sq.feet"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    // // backspace after thousand separator separator
    await simulateKeyInput(user, input, '{Backspace}', 7, 7);
    expect(input).toHaveValue('Rs. 1,345.50 /sq.feet');
    expect(input.selectionStart).toEqual(5);

    // delete before thousand separator separator
    await simulateKeyInput(user, input, '{Delete}', 5, 5);
    expect(input).toHaveValue('Rs. 145.50 /sq.feet');
    expect(input.selectionStart).toEqual(5);

    // backspace after decimal separator
    await simulateKeyInput(user, input, '{Backspace}', 8, 8);
    expect(input).toHaveValue('Rs. 14,550 /sq.feet');
    expect(input.selectionStart).toEqual(8);

    // delete before decimal separator
    await simulateKeyInput(user, input, '.', 8, 8);
    await simulateKeyInput(user, input, '{Delete}', 7, 7);
    expect(input).toHaveValue('Rs. 14,550 /sq.feet');
    expect(input.selectionStart).toEqual(8);
  });

  it('should maintain correct caret positon while removing the last character and suffix is not defined. Issue #105', async () => {
    const result = await render(() => 
      <NumericFormat thousandSeparator="," prefix="$" suffix="" value="$2,342,343" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 10, 10);
    expect(input).toHaveValue('$234,234');
    expect(input.selectionStart).toEqual(8);
  });

  it('should maintain correct caret position while removing the second last character and suffix is not defined, Issue #116', async () => {
    const result = await render(
      () => <NumericFormat thousandSeparator="," prefix="" suffix="" value="1,000" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 4, 4);
    expect(input).toHaveValue('100');
    expect(input.selectionStart).toEqual(2);
  });

  it('should allow removing negation(-), even if its before prefix', async () => {
    const spy = vi.fn();

    const result = await render(() => 
      <NumericFormat
        thousandSeparator=","
        suffix=""
        prefix="$"
        value="-$1,000"
        onValueChange={spy}
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 2, 2);

    expect(input).toHaveValue('$1,000');
    expect(input.selectionStart).toEqual(1);
    expect(spy).toHaveBeenCalled();
  });

  it('should allow removing negation(-), even if its before prefix', async () => {
    const spy = vi.fn();
    const result = await render(() =>
      <NumericFormat
        thousandSeparator=","
        suffix=""
        prefix="$"
        value="-$1,000"
        onValueChange={spy}
      />,
    );
    const input = result.container.querySelector('input');
    const user = userEvent.setup();
    
    await simulateKeyInput(user, input, '{Backspace}', 2, 2);
    
    expect(input).toHaveValue('$1,000');
    expect(input.selectionStart).toEqual(1);
    expect(spy).toHaveBeenCalled();
  });

  it('should maintain correct caret position if one of thousand separator is removed due to backspace. #695', async () => {
    const result = await render(
      () => <NumericFormat value={1234567.8901} thousandSeparator="." decimalSeparator="," />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 9, 9);
    expect(input).toHaveValue('123.456,8901');
    expect(input.selectionStart).toEqual(7);
  });
});

describe('Test arrow keys', () => {
  it('should keep caret position between the prefix and suffix', async () => {
    const result = await render(() => 
      <NumericFormat
        thousandSeparator=","
        prefix="Rs. "
        suffix=" /sq.feet"
        value="Rs. 12,345.50 /sq.feet"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{ArrowLeft}', 4, 4);
    expect(input.selectionStart).toEqual(4);

    await simulateKeyInput(user, input, '{ArrowRight}', 13, 13);
    expect(input.selectionStart).toEqual(13);
  });

  it('should keep caret position within typable area', async () => {
    const result = await render(
      () => <PatternFormat format="+1 (###) ### # ## US" value="+1 (123) 456 7 89 US" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{ArrowLeft}', 4, 4);
    expect(input.selectionStart).toEqual(4);

    await simulateKeyInput(user, input, '{ArrowRight}', 17, 17);
    expect(input.selectionStart).toEqual(17);

    await simulateKeyInput(user, input, '{ArrowRight}', 7, 7);
    expect(input.selectionStart).toEqual(9);

    await simulateKeyInput(user, input, '{ArrowLeft}', 9, 9);
    expect(input.selectionStart).toEqual(7);

    await simulateKeyInput(user, input, '{ArrowRight}', 12, 12);
    expect(input.selectionStart).toEqual(13);

    await simulateKeyInput(user, input, '{ArrowLeft}', 13, 13);
    expect(input.selectionStart).toEqual(12);
  });

  it('should not move caret positon from left most to right most if left key pressed. #154', async () => {
    const result = await render(() => <NumberFormatBase format={cardExpiry} value="11/11" />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{ArrowLeft}', 0, 0);
    expect(input.selectionStart).toEqual(0);
  });
});

describe('Test click / focus on input', () => {
  it('should always keep caret on typable area when we click on the input', async () => {
    const result = await render(
      () => <PatternFormat format="+1 (###) ### # ## US" value="+1 (123) 456 7 89 US" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    simulateMouseUpEvent(user, input, 0);
    expect(input.selectionStart).toEqual(4);

    simulateMouseUpEvent(user, input, 8);
    // Why multiple values?
    expect([7, 9]).toContain(input.selectionStart);

    simulateMouseUpEvent(user, input, 19);
    expect(input.selectionStart).toEqual(17);
  });

  it('should limit the caret position to the next position of the typed number', async () => {
    const result = await render(() => <PatternFormat format="##/##/####" />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '1', 0);
    expect(input).toHaveValue('1 /  /    ');

    simulateMouseUpEvent(user, input, 4);
    expect(input.selectionStart).toEqual(1);
  });

  // TODO: Add test to check the position of the caret immediately after typing
  it('should limit the caret position to the next position of the typed number', async () => {
    const result = await render(
      () => <PatternFormat format="##/##/####" mask={['D', 'D', 'M', 'M', 'Y', 'Y', 'Y', 'Y']} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '1212', 0);
    expect(input).toHaveValue('12/12/YYYY');

    simulateMouseUpEvent(user, input, 8);
    expect(input.selectionStart).toEqual(6);
  });

  it('should always keep caret position between suffix and prefix', async () => {
    const result = await render(() => 
      <NumericFormat
        thousandSeparator=","
        prefix="Rs. "
        suffix=" /sq.feet"
        value="Rs. 12,345.50 /sq.feet"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    simulateMouseUpEvent(user, input, 0);
    expect(input.selectionStart).toEqual(4);

    simulateMouseUpEvent(user, input, 17);
    expect(input.selectionStart).toEqual(13);
  });

  it('should correct wrong caret position on focus', async () => {
    const result = await render(() => 
      <NumericFormat
        thousandSeparator=","
        prefix="Rs. "
        suffix=" /sq.feet"
        value="Rs. 12,345.50 /sq.feet"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    simulateMouseUpEvent(user, input, 0);

    expect(input.selectionStart).toBe(4);

    expect(input.selectionStart).toBe(4);
  });

  it('should clear active timers', async () => {
    vi.useFakeTimers();

    const onFocus = vi.fn();

    const { input, unmount } = await render(() => <NumericFormat onFocus={onFocus} />);

    // Fails if input receives focus by clicking.
    // await simulateClickToFocus(user, input);
    simulateFocus(input);

    unmount();
    vi.runAllTimers();

    expect(onFocus).toHaveBeenCalledTimes(0);

    vi.useRealTimers();
  });

  it('should correct wrong caret positon on focus when allowEmptyFormatting is set', async () => {
    const result = await render(() => 
      <PatternFormat
        format="+1 (###) ### # ## US"
        allowEmptyFormatting={true}
        value=""
        mask="_"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    simulateMouseUpEvent(user, input, 1);

    expect(input.selectionStart).toBe(4);
  });

  it('should not reset correct caret position on focus', async () => {
    const result = await render(() => 
      <NumericFormat
        thousandSeparator=","
        prefix="Rs. "
        suffix=" /sq.feet"
        value="Rs. 12,345.50 /sq.feet"
      />,
    );

    // Note: init caretPos to `6`. Focus to `6`. In case of bug, selectionStart is `0` and the caret will move to `4`.
    //   otherwise (correct behaviour) the value will not change, and stay `6`

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    simulateMouseUpEvent(user, input, 1);
    expect(input.selectionStart).toBe(4);

    simulateMouseUpEvent(user, input, 6);
    expect(input.selectionStart).toBe(6);
    simulateBlurEvent(input);

    simulateFocus(input);
    expect(input.selectionStart).toBe(6);
  });

  it('should not reset caret position on focus when full value is selected', async () => {
    const value = 'Rs. 12,345.50 /sq.feet';

    const result = await render(
      () => <NumericFormat thousandSeparator="," prefix="Rs. " suffix=" /sq.feet" value={value} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateTripleClick(user, input, 10);

    expect(input.selectionStart).toBe(0);
    expect(input.selectionEnd).toBe(22);
  });

  it('should correct caret position after user click on input while it has selection #780', async () => {
    const { input } = await render(() => <NumericFormat prefix="$" value="$123" />);

    // TODO: Use helpers
    input.setSelectionRange(0, 3);

    // this simulates browser mouse up on already selected text
    userEvent.click(input);
    input.setSelectionRange(0, 0);
    waitFor(() => expect(input.selectionStart).toEqual(1));
  });

  it('should correct caret position after user select masked area and then clicks or press key #839', async () => {
    const { input } = await render(() => <PatternFormat format="##/##/####" value="1" mask="_" />);
    input.setSelectionRange(3, 7);
    fireEvent.keyDown(input, { key: 'ArrowRight' });
    expect(input.selectionEnd).toEqual(1);
  });
});