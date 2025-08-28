import { describe, it, test, expect, beforeEach, afterEach, vi, beforeAll } from 'vitest';
import { render as rtlRender, waitFor, fireEvent, screen } from '@solidjs/testing-library';

import NumericFormat from '../../src/numeric_format';

import {
  simulateBlurEvent,
  render,
  simulateKeyInput,
  clearInput,
  simulateDblClick,
  simulatePaste,
} from '../setup';
import userEvent from '@testing-library/user-event';
import { createSignal } from 'solid-js';

/**
 * This suit is to test NumberFormat when normal numeric values are provided without any formatting options
 * Use cases:
 * currency
 * Number
 * units
 */
describe('Test NumberFormat as input with numeric format options', () => {
  it('should show the initial value as $0 when number 0 is passed', async () => {
    const { input } = await render(
      () => <NumericFormat value={0} thousandSeparator={true} prefix={'$'} />,
    );
    expect(input).toHaveValue('$0');
  });

  it('should show the initial value as empty string when empty string is passed and decimalScale is set', async () => {
    const { input } = await render(
      () => <NumericFormat value="" thousandSeparator={true} decimalScale={2} />,
    );
    expect(input).toHaveValue('');
  });

  it('should show the initial value as empty string when empty string is passed and decimalScale is not set', async () => {
    const { input } = await render(() => <NumericFormat value="" thousandSeparator={true} />);
    expect(input).toHaveValue('');
  });

  it('should maintain decimal points', async () => {
    const result = await render(() => <NumericFormat thousandSeparator={true} prefix={'$'} />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '2456981.89', 0);

    expect(input).toHaveValue('$2,456,981.89');
  });

  it('supports negative numbers', async () => {
    const result = await render(() => <NumericFormat thousandSeparator={true} prefix={'$'} />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '-', 0);

    expect(input).toHaveValue('-');

    await simulateKeyInput(user, input, '123.55', 1);

    expect(input).toHaveValue('-$123.55');
  });

  it('removes negation when double negation is done', async () => {
    const [value, setValue] = createSignal(-2456981.89);
    
    const TestComponent = () => (
      <NumericFormat thousandSeparator={true} prefix={'$'} value={value()} />
    );

    const { input, user } = await render(() => <TestComponent />);

    expect(input).toHaveValue('-$2,456,981.89');

    await simulateKeyInput(user, input, '-', 1);

    expect(input).toHaveValue('$2,456,981.89');

    setValue('');
    
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
    
    await simulateKeyInput(user, input, '--', 0);
    expect(input).toHaveValue('');
  });

  it('allows negation and double negation any cursor position in the input', async () => {
    const result = await render(
      () => <NumericFormat thousandSeparator={true} prefix={'$'} value={2456981.89} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '-', 5);

    expect(input).toHaveValue('-$2,456,981.89');

    //restore negation back
    await simulateKeyInput(user, input, '-', 7);

    expect(input).toHaveValue('$2,456,981.89');
  });

  it('should support custom thousand separator', async () => {
    const [thousandSeparator, setThousandSeparator] = createSignal('.');
    const [decimalSeparator, setDecimalSeparator] = createSignal(',');
    const [value, setValue] = createSignal('');
    
    const TestComponent = () => (
      <NumericFormat 
        thousandSeparator={thousandSeparator()} 
        decimalSeparator={decimalSeparator()} 
        prefix={'$'} 
        value={value()}
      />
    );

    const { input, user } = await render(() => <TestComponent />);

    await simulateKeyInput(user, input, '2456981,89', 0);
    expect(input).toHaveValue('$2.456.981,89');

    setThousandSeparator("'");
    setValue('2456981.89'); // Force re-format with new separator

    await waitFor(() => {
      expect(input).toHaveValue("$2'456'981,89");
    });

    //changing decimal separator in the fly should work
    setDecimalSeparator('.');
    setValue('2456981.89'); // Force re-format with new separator
    
    await waitFor(() => {
      expect(input).toHaveValue("$2'456'981.89");
    });

    setThousandSeparator(' ');
    setDecimalSeparator("'");
    setValue('');
    
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
    
    await clearInput(user, input);

    await simulateKeyInput(user, input, "2456981'89", 0);
    expect(input).toHaveValue("$2 456 981'89");
  });

  it('should support custom thousand separator', async () => {
    let component: any;
    
    const { input, user } = await render(() => {
      const [thousandSeparator, setThousandSeparator] = createSignal('.');
      const [decimalSeparator, setDecimalSeparator] = createSignal(',');
      const [value, setValue] = createSignal('');
      
      // Store component reference for external access
      component = { setThousandSeparator, setDecimalSeparator, setValue };
      
      return (
        <NumericFormat 
          thousandSeparator={thousandSeparator()} 
          decimalSeparator={decimalSeparator()} 
          prefix={'$'}
          value={value()}
        />
      );
    });

    await simulateKeyInput(user, input, '2456981,89', 0);
    expect(input).toHaveValue('$2.456.981,89');

    // Change thousand separator and force re-render by setting the numeric value
    component.setThousandSeparator("'");
    component.setValue('2456981.89'); // Set the numeric value to trigger reformat

    await waitFor(() => {
      expect(input).toHaveValue("$2'456'981,89");
    });

    // Change decimal separator
    component.setDecimalSeparator('.');
    
    await waitFor(() => {
      expect(input).toHaveValue("$2'456'981.89");
    });

    // Change both separators and clear value
    component.setThousandSeparator(' ');
    component.setDecimalSeparator("'");
    component.setValue('');
    
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
    
    await clearInput(user, input);
    await simulateKeyInput(user, input, "2456981'89", 0);
    expect(input).toHaveValue("$2 456 981'89");
  });

  it('should support custom thousand separator', async () => {
    let component: any;
    
    const { input, user } = await render(() => {
      const [thousandSeparator, setThousandSeparator] = createSignal('.');
      const [decimalSeparator, setDecimalSeparator] = createSignal(',');
      const [value, setValue] = createSignal('');
      
      // Store component reference for external access
      component = { setThousandSeparator, setDecimalSeparator, setValue };
      
      return (
        <NumericFormat 
          thousandSeparator={thousandSeparator()} 
          decimalSeparator={decimalSeparator()} 
          prefix={'$'} 
          value={value()}
        />
      );
    });

    await simulateKeyInput(user, input, '2456981,89', 0);
    expect(input).toHaveValue('$2.456.981,89');

    // Change separator and force re-render with new value
    component.setThousandSeparator("'");
    component.setValue('2456981.89');

    await waitFor(() => {
      expect(input).toHaveValue("$2'456'981,89");
    });

    // Continue with rest of test...
    component.setDecimalSeparator('.');
    
    await waitFor(() => {
      expect(input).toHaveValue("$2'456'981.89");
    });

    component.setThousandSeparator(' ');
    component.setDecimalSeparator("'");
    component.setValue('');
    
    await waitFor(() => {
      expect(input).toHaveValue('');
    });
    
    await clearInput(user, input);
    await simulateKeyInput(user, input, "2456981'89", 0);
    expect(input).toHaveValue("$2 456 981'89");
  });

  it('should throw error when decimal separator and thousand separator are same', async () => {
    expect(() => rtlRender(() => <NumericFormat thousandSeparator={'.'} prefix={'$'} />)).toThrowError();

    expect(() =>
      rtlRender(() => <NumericFormat thousandSeparator={','} decimalSeparator={','} prefix={'$'} />),
    ).toThrowError();
  });

  it('should allow floating/integer numbers as values and do proper formatting', async () => {
    const [value, setValue] = createSignal(12345.67);
    const [thousandSeparator, setThousandSeparator] = createSignal(undefined);
    const [decimalSeparator, setDecimalSeparator] = createSignal('.');
    const [decimalScale, setDecimalScale] = createSignal(undefined);
    
    const TestComponent = () => (
      <NumericFormat 
        value={value()} 
        thousandSeparator={thousandSeparator()}
        decimalSeparator={decimalSeparator()}
        decimalScale={decimalScale()}
      />
    );

    const { input } = await render(() => <TestComponent />);
    expect(input).toHaveValue('12345.67');

    setThousandSeparator(true);
    
    await waitFor(() => {
      expect(input).toHaveValue('12,345.67');
    });

    setThousandSeparator('.');
    setDecimalSeparator(',');
    
    await waitFor(() => {
      expect(input).toHaveValue('12.345,67');
    });

    setDecimalScale(0);
    
    await waitFor(() => {
      expect(input).toHaveValue('12.346');
    });
  });

  it('should update formatted value if any of the props changes', async () => {
    const [value, setValue] = createSignal(12345.67);
    const [thousandSeparator, setThousandSeparator] = createSignal(undefined);
    const [decimalSeparator, setDecimalSeparator] = createSignal('.');
    const [decimalScale, setDecimalScale] = createSignal(undefined);
    
    const TestComponent = () => (
      <NumericFormat 
        value={value()} 
        thousandSeparator={thousandSeparator()}
        decimalSeparator={decimalSeparator()}
        decimalScale={decimalScale()}
      />
    );

    const { input } = await render(() => <TestComponent />);
    expect(input).toHaveValue('12345.67');

    setThousandSeparator(true);
    
    await waitFor(() => {
      expect(input).toHaveValue('12,345.67');
    });

    setThousandSeparator('.');
    setDecimalSeparator(',');
    
    await waitFor(() => {
      expect(input).toHaveValue('12.345,67');
    });

    setDecimalScale(0);
    
    await waitFor(() => {
      expect(input).toHaveValue('12.346');
    });
  });

  it('should allow bigger number than 2^53 and do proper formatting', async () => {
    const result = await render(
      () => <NumericFormat thousandSeparator="." decimalSeparator="," />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '981273724234817383478127', 0);
    expect(input).toHaveValue('981.273.724.234.817.383.478.127');

    await clearInput(user, input);

    await simulateKeyInput(user, input, '981273724234817383478,127', 0);
    expect(input).toHaveValue('981.273.724.234.817.383.478,127');
  });

  it('should support decimal scale with custom decimal separator', async () => {
    const result = await render(
      () => <NumericFormat thousandSeparator={'.'} decimalSeparator={','} decimalScale={2} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '2456981,89', 0);
    expect(input).toHaveValue('2.456.981,89');
  });

  it('should limit to passed decimal scale', async () => {
    const [decimalScale, setDecimalScale] = createSignal(4);
    const [fixedDecimalScale, setFixedDecimalScale] = createSignal(true);
    
    const TestComponent = () => (
      <NumericFormat 
        decimalScale={decimalScale()} 
        fixedDecimalScale={fixedDecimalScale()} 
      />
    );

    const { input, user } = await render(() => <TestComponent />);

    //case 1st - already exactly scale 4 should stay that way
    await simulateKeyInput(user, input, '4111.1111', 0);
    expect(input).toHaveValue('4111.1111');

    await clearInput(user, input);  // ADD THIS

    //case 2nd - longer scale should round
    await simulateKeyInput(user, input, '4111.11111', 0);
    expect(input).toHaveValue('4111.1111');

    await clearInput(user, input);  // ADD THIS

    /** Only initial value should round off not while input **/
    await simulateKeyInput(user, input, '4111.11118', 0);
    expect(input.value).toEqual('4111.1111');

    await clearInput(user, input);  // ADD THIS

    //case 3rd - shorter scale adds 0
    await simulateKeyInput(user, input, '4111.111', 0);
    expect(input).toHaveValue('4111.1110');

    await clearInput(user, input);  // ADD THIS

    //case 4th - no decimal should round with 4 zeros
    await simulateKeyInput(user, input, '4111', 0);
    expect(input).toHaveValue('4111.0000');

    //case 5 - round with two decimal scale
    setDecimalScale(2);
    
    await waitFor(() => {
      // Wait for the component to update with new decimal scale
    });
    
    await clearInput(user, input);  // ADD THIS
    await simulateKeyInput(user, input, '4111.111', 0);
    expect(input).toHaveValue('4111.11');
  });

  it('should not add zeros to fixedDecimalScale is not set', async () => {
    const [value, setValue] = createSignal(24.45);
    const [decimalScale, setDecimalScale] = createSignal(4);
    
    const TestComponent = () => (
      <NumericFormat 
        decimalScale={decimalScale()} 
        value={value()} 
      />
    );

    const { input } = await render(() => <TestComponent />);
    expect(input).toHaveValue('24.45');

    setValue(24.45678);
    
    await waitFor(() => {
      expect(input).toHaveValue('24.4568');
    });
  });

  it('should handle fixedDecimalScale correctly #670', async () => {
    const { input } = await render(
      () => <NumericFormat thousandSeparator value={12} decimalScale={2} fixedDecimalScale />,
    );
    expect(input).toHaveValue('12.00');
  });

  it('should not round the initial if decimalScale is not provided', async () => {
  const [value, setValue] = createSignal(123213.7535);
  const [thousandSeparator, setThousandSeparator] = createSignal(undefined);
  const [decimalSeparator, setDecimalSeparator] = createSignal('.');
  
  const TestComponent = () => (
    <NumericFormat 
      value={value()} 
      thousandSeparator={thousandSeparator()}
      decimalSeparator={decimalSeparator()}
    />
  );

  const { input } = await render(() => <TestComponent />);
  expect(input).toHaveValue('123213.7535');

  setThousandSeparator(true);
  
  await waitFor(() => {
    expect(input).toHaveValue('123,213.7535');
  });

  setThousandSeparator('.');
  setDecimalSeparator(',');
  
  await waitFor(() => {
    expect(input).toHaveValue('123.213,7535');
  });

  setValue(36790.876);
  
  await waitFor(() => {
    expect(input).toHaveValue('36.790,876');
  });

  setValue(56790.876); // Use numeric value instead of formatted string
  
  await waitFor(() => {
    expect(input).toHaveValue('56.790,876');
  });
});

it('should round the initial value to given decimalScale', async () => {
  const [value, setValue] = createSignal('123213.7536');
  const [valueIsNumericString, setValueIsNumericString] = createSignal(true);
  const [decimalScale, setDecimalScale] = createSignal(1);
  const [thousandSeparator, setThousandSeparator] = createSignal(undefined);
  const [decimalSeparator, setDecimalSeparator] = createSignal('.');
  
  const TestComponent = () => (
    <NumericFormat
      value={value()}
      valueIsNumericString={valueIsNumericString()}
      decimalScale={decimalScale()}
      thousandSeparator={thousandSeparator()}
      decimalSeparator={decimalSeparator()}
    />
  );

  const { input } = await render(() => <TestComponent />);
  expect(input).toHaveValue('123213.8');

  setThousandSeparator(true);
  
  await waitFor(() => {
    expect(input).toHaveValue('123,213.8');
  });

  setDecimalScale(3);
  setThousandSeparator('.');
  setDecimalSeparator(',');
  
  await waitFor(() => {
    expect(input).toHaveValue('123.213,754');
  });

  setValue('36790.876');
  setDecimalScale(0);
  
  await waitFor(() => {
    expect(input).toHaveValue('36.791');
  });

  setDecimalScale(2);
  
  await waitFor(() => {
    expect(input).toHaveValue('36.790,88');
  });

  setValue('56790.876');
  
  await waitFor(() => {
    expect(input).toHaveValue('56.790,88');
  });

  setValue('981273724234817383478127.678');
  
  await waitFor(() => {
    expect(input).toHaveValue('981.273.724.234.817.383.478.127,68');
  });
});

  it('should allow deleting all numbers when decimalScale and fixedDecimalScale is defined', async () => {
    const result = await render(
      () => <NumericFormat prefix="$" decimalScale={3} value="$1.000" fixedDecimalScale={true} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 2);

    expect(input).toHaveValue('');
  });

  it('should not allow to remove decimalSeparator if decimalScale and fixedDecimalScale is defined', async () => {
    const [prefix, setPrefix] = createSignal('$');
    const [thousandSeparator, setThousandSeparator] = createSignal(true);
    const [decimalScale, setDecimalScale] = createSignal(3);
    const [fixedDecimalScale, setFixedDecimalScale] = createSignal(true);
    const [value, setValue] = createSignal('$1,234.000');
    
    const TestComponent = () => (
      <NumericFormat
        prefix={prefix()}
        thousandSeparator={thousandSeparator()}
        decimalScale={decimalScale()}
        fixedDecimalScale={fixedDecimalScale()}
        value={value()}
      />
    );

    const { input, user } = await render(() => <TestComponent />);
    
    await simulateKeyInput(user, input, '{Backspace}', 7);
    expect(input).toHaveValue('$1,234.000');

    simulateBlurEvent(input);

    setDecimalScale(undefined);
    
    await waitFor(() => {
      // Wait for component to update with new decimalScale
    });
    
    await simulateKeyInput(user, input, '{Backspace}', 7);
    expect(input).toHaveValue('$1,234,000');
  });

  it(`should allow replacing all digits (without prefix and/or suffix) with input
    digit(s) when decimalScale and fixedDecimalScale is defined. Issue #159`, async () => {
    const [prefix, setPrefix] = createSignal('$');
    const [suffix, setSuffix] = createSignal('');
    const [thousandSeparator, setThousandSeparator] = createSignal(true);
    const [decimalScale, setDecimalScale] = createSignal(2);
    const [fixedDecimalScale, setFixedDecimalScale] = createSignal(true);
    const [value, setValue] = createSignal(1234);
    
    const TestComponent = () => (
      <NumericFormat
        prefix={prefix()}
        suffix={suffix()}
        thousandSeparator={thousandSeparator()}
        decimalScale={decimalScale()}
        fixedDecimalScale={fixedDecimalScale()}
        value={value()}
      />
    );

    const { input, user } = await render(() => <TestComponent />);
    
    await simulateKeyInput(user, input, '56', 1, 9);
    expect(input).toHaveValue('$56.00');

    setPrefix('');
    setSuffix('%');
    setValue(98.76); // Set new value to trigger re-render with new prefix/suffix
    
    await waitFor(() => {
      expect(input).toHaveValue('98.76%');
    });
    
    await simulateKeyInput(user, input, '1', 0, 6);
    expect(input).toHaveValue('1.00%');

    setPrefix('$');
    setValue(23); // Set new value to trigger re-render with new prefix
    
    await waitFor(() => {
      expect(input).toHaveValue('$23.00%');
    });
    
    await simulateKeyInput(user, input, '15', 1, 6);
    expect(input).toHaveValue('$15.00%');
  });

  it('should not round by default', async () => {
    const result = await render(() => <NumericFormat />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    //case 1st - no rounding with long decimal
    await simulateKeyInput(user, input, '4111.111111', 0);
    expect(input).toHaveValue('4111.111111');

    await clearInput(user, input);
    //case 2nd - no rounding with whole numbers
    await simulateKeyInput(user, input, '4111', 0);
    expect(input).toHaveValue('4111');

    await clearInput(user, input);
    //case 3rd - no rounding on single place decimals
    await simulateKeyInput(user, input, '4111.1', 0);
    expect(input).toHaveValue('4111.1');
  });

  it('sould not allow decimal numbers if decimal scale is set to 0', async () => {
    const [thousandSeparator, setThousandSeparator] = createSignal(true);
    const [decimalScale, setDecimalScale] = createSignal(0);
    const [value, setValue] = createSignal(undefined);
    
    const TestComponent = () => (
      <NumericFormat
        thousandSeparator={thousandSeparator()}
        decimalScale={decimalScale()}
        value={value()}
      />
    );

    const { input, user } = await render(() => <TestComponent />);

    //case 1 - decimal scale set to 0
    await simulateKeyInput(user, input, '4111.', 0);
    expect(input).toHaveValue('4,111');

    //case 2 - It should round to integer if passed value props as decimal values
    setValue(1234.78);
    
    await waitFor(() => {
      expect(input).toHaveValue('1,235');
    });
  });

  it('should allow decimal separator and thousand separator on suffix prefix', async () => {
    const [value, setValue] = createSignal(1231237.56);
    const [thousandSeparator, setThousandSeparator] = createSignal(',');
    const [decimalSeparator, setDecimalSeparator] = createSignal('.');
    const [prefix, setPrefix] = createSignal('$');
    const [suffix, setSuffix] = createSignal(' per sq. ft.');
    
    const TestComponent = () => (
      <NumericFormat
        value={value()}
        thousandSeparator={thousandSeparator()}
        decimalSeparator={decimalSeparator()}
        prefix={prefix()}
        suffix={suffix()}
      />
    );

    const { input } = await render(() => <TestComponent />);
    expect(input).toHaveValue('$1,231,237.56 per sq. ft.');

    setPrefix('$ per, sq. ft. ');
    setSuffix('');
    
    await waitFor(() => {
      expect(input).toHaveValue('$ per, sq. ft. 1,231,237.56');
    });
  });

  it('should not remove leading 0s while user is in focus', async () => {
    const [value, setValue] = createSignal(23456.78);
    
    const TestComponent = () => (
      <NumericFormat
        value={value()}
        thousandSeparator={','}
        decimalSeparator={'.'}
        prefix={'$'}
      />
    );

    const { input, user } = await render(() => <TestComponent />);

    await simulateKeyInput(user, input, '0', 1);
    expect(input).toHaveValue('$023,456.78');

    simulateBlurEvent(input);

    setValue(10000.25);
    
    await waitFor(() => {
      expect(input).toHaveValue('$10,000.25');
    });

    await simulateKeyInput(user, input, '{Backspace}', 2);
    expect(input).toHaveValue('$0000.25');

    await simulateKeyInput(user, input, '2', 1);
    expect(input).toHaveValue('$20,000.25');
  });

  it('should remove leading 0s while user go out of focus and allowLeadingZeros is false', async () => {
    const [value, setValue] = createSignal(23456.78);
    
    const TestComponent = () => (
      <NumericFormat
        value={value()}
        thousandSeparator={','}
        decimalSeparator={'.'}
        prefix={'$'}
      />
    );

    const { input, user } = await render(() => <TestComponent />);

    await simulateKeyInput(user, input, '0', 1);
    simulateBlurEvent(input);

    expect(input).toHaveValue('$23,456.78');

    setValue(10000.25);
    
    await waitFor(() => {
      expect(input).toHaveValue('$10,000.25');
    });

    await simulateKeyInput(user, input, '{Backspace}', 2);
    simulateBlurEvent(input);
    expect(input).toHaveValue('$0.25');
  });

  it('should not remove leading 0s while user go out of focus and allowLeadingZeros is true', async () => {
    const [value, setValue] = createSignal(23456.78);
    
    const TestComponent = () => (
      <NumericFormat
        value={value()}
        thousandSeparator={','}
        decimalSeparator={'.'}
        prefix={'$'}
        allowLeadingZeros={true}
      />
    );

    const { input, user } = await render(() => <TestComponent />);

    await simulateKeyInput(user, input, '0', 1);
    simulateBlurEvent(input);

    expect(input).toHaveValue('$023,456.78');

    setValue(10000.25);
    
    await waitFor(() => {
      expect(input).toHaveValue('$10,000.25');
    });

    await simulateKeyInput(user, input, '{Backspace}', 2);
    simulateBlurEvent(input);
    expect(input).toHaveValue('$0000.25');
  });

  it('should not remove leading 0s while user go out of focus and allowLeadingZeros is true', async () => {
    const [value, setValue] = createSignal(23456.78);
    
    const TestComponent = () => (
      <NumericFormat
        value={value()}
        thousandSeparator={','}
        decimalSeparator={'.'}
        prefix={'$'}
        allowLeadingZeros={true}
      />
    );

    const { input, user } = await render(() => <TestComponent />);

    await simulateKeyInput(user, input, '0', 1);
    simulateBlurEvent(input);
    expect(input).toHaveValue('$023,456.78');

    setValue(10000.25);
    
    await waitFor(() => {
      expect(input).toHaveValue('$10,000.25'); // This should have comma
    });

    await simulateKeyInput(user, input, '{Backspace}', 2);
    simulateBlurEvent(input);
    expect(input).toHaveValue('$0000.25'); // This should NOT have comma (leading zeros)
  });

  it('should make input empty when there is only non numeric values (ie just -) on blur', async () => {
    const result = await render(() => <NumericFormat decimalScale={2} />);
    
    const input = result.container.querySelector('input');
    const user = userEvent.setup();
    
    await simulateKeyInput(user, input, '-', 0);
    simulateBlurEvent(input);

    expect(input).toHaveValue('');
  });

  it('should not add 0 before decimal if user is in focus', async () => {
    const result = await render(
      () => <NumericFormat value={0.78} thousandSeparator={','} decimalSeparator={'.'} prefix={'$'} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 2);

    expect(input).toHaveValue('$.78');

    await simulateKeyInput(user, input, '2', 1);
    expect(input).toHaveValue('$2.78');
  });

  it('should add 0 before decimal if user goes out of focus', async () => {
    const result = await render(
      () => <NumericFormat value={0.78} thousandSeparator={','} decimalSeparator={'.'} prefix={'$'} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 2);

    expect(input).toHaveValue('$.78');

    simulateBlurEvent(input);
    expect(input).toHaveValue('$0.78');
  });

  it('should allow typing decimalSeparator if input is empty', async () => {
    const result = await render(
      () => <NumericFormat thousandSeparator={','} decimalSeparator={'.'} prefix={'$'} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '.', 0);

    expect(input).toHaveValue('$.');
  });

  it('should delete all characters if nothing is after decimalSeparator and before decimalSeparator is deleted', async () => {
    const result = await render(
      () => <NumericFormat decimalSeparator={'.'} prefix={'$'} value="$0." />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    expect(input).toHaveValue('$0.');

    await simulateKeyInput(user, input, '{Backspace}', 2);
    expect(input).toHaveValue('');
  });

  it('should not clear input if after decimal is deleted and nothing is before decimal', async () => {
    const result = await render(
      () => <NumericFormat decimalSeparator={'.'} prefix={'$'} value="$.3" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 4);
    expect(input).toHaveValue('$.');
  });

  it('should allow ctrl + a -> decimalSeparator', async () => {
    const result = await render(
      () => <NumericFormat decimalSeparator={'.'} prefix={'$'} value="$34.35" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '.', 0, 6);
    expect(input).toHaveValue('$.');
  });

  //Issue #137 valueIsNumericString=true breaks decimal places
  it('should not break decimal palces when valueIsNumericString is set to true and decimal scale is provided. Issue #137', async () => {
    function IssueExample() {
      const [value, setValue] = createSignal('3456');

      return (
        <NumericFormat
          valueIsNumericString={true}
          decimalScale={2}
          prefix={'$'}
          value={value()}
          onValueChange={({ value }) => {
            setValue(value);
          }}
        />
      );
    }

    const { input, user } = await render(() => <IssueExample />);
    await simulateKeyInput(user, input, '.', 5);
    expect(input).toHaveValue('$3456.');
  });

  //Issue #140
  it('should not give NaN zeros, when decimalScale is 0 and roundedValue will be multiple of 10s, Issue #140', async () => {
    const [value, setValue] = createSignal(-9.5);
    
    const TestComponent = () => (
      <NumericFormat 
        value={value()} 
        decimalScale={0} 
      />
    );

    const { input } = await render(() => <TestComponent />);
    expect(input).toHaveValue('-10');

    setValue(-99.5);
    
    await waitFor(() => {
      expect(input).toHaveValue('-100');
    });
  });

  //Issue #145
  it('should give correct formatted value when pasting a number with decimal and decimal scale is set to zero, issue #145', async () => {
    console.log('🔍 Starting paste test');
    const result = await render(() => <NumericFormat decimalScale={0} />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    console.log('🔍 Initial input value:', input.value);
    
    await simulatePaste(user, input, '9.55');
    console.log('🔍 After paste, before blur:', input.value);
    
    simulateBlurEvent(input);
    console.log('🔍 After blur:', input.value);
    
    expect(input).toHaveValue('9');
  });

  it('should format the number correctly when thousandSeparator is true and decimal scale is 0. Issue #178', async () => {
    const result = await render(
      () => <NumericFormat decimalScale={0} thousandSeparator={true} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '10000');
    expect(input).toHaveValue('10,000');
    await simulateKeyInput(user, input, '0', 6);
    expect(input).toHaveValue('100,000');
  });

  it(`should give correct formatted value when decimal value is passed as prop and
    decimal scale is set to zero and fixedDecimalScale is true, issue #183`, async () => {
    const { input } = await render(
      () => <NumericFormat decimalScale={0} fixedDecimalScale={true} value={1.333333333} />,
    );
    expect(input).toHaveValue('1');
  });

  it(`should not add 0 after minus immediately after minus is entered in case valueIsNumericString and
    decimalScale props are passed #198`, async () => {
    const result = await render(() => <NumericFormat valueIsNumericString decimalScale={2} />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '-', 0, 0);
    expect(input).toHaveValue('-');
  });

  it('should allow typing . as decimal separator when some other decimal separator is given', async () => {
    const result = await render(
      <NumericFormat
        decimalSeparator=","
        thousandSeparator="."
        value="234.456 Sq. ft"
        suffix=" Sq. ft"
      />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '.', 5, 5);
    
    expect(input).toHaveValue('2.344,56 Sq. ft');
    expect(input.selectionStart).toEqual(6);

    await simulateKeyInput(user, input, ',', 3, 3);
    
    expect(input).toHaveValue('23,4456 Sq. ft');
  });

  it('should not break if suffix/prefix has negation sign. Issue #245', async () => {
    const result = await render(() => <NumericFormat suffix="-" />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '2', 0);
    expect(input).toHaveValue('2-');

    await simulateKeyInput(user, input, '1', 1);
    expect(input).toHaveValue('21-');

    await simulateKeyInput(user, input, '-', 2);
    expect(input).toHaveValue('-21-');
  });

  it('should not apply thousand separator on the leading zeros #289', async () => {
    const result = await render(() => <NumericFormat prefix="$" thousandSeparator="," />);

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '000012345678', 0);
    expect(input).toHaveValue('$000012,345,678');
  });

  //Issue #375
  it('should give correct formatted value when pasting the dot symbol with decimal scale is set to zero, issue #375', async () => {
    const result = await render(
      () => <NumericFormat value={4200} thousandSeparator={true} decimalScale={0} />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '.', 2, 2);
    expect(input).toHaveValue('4,200');
  });

  it('should handle decimal numbers correctly #519', async () => {
    function Test() {
      const [value, setValue] = createSignal('1.000001');

      return (
        <NumericFormat
          value={value()}
          onValueChange={(values) => {
            setValue(values.value);
          }}
          valueIsNumericString
          decimalScale={8}
        />
      );
    }

    const result = await render(() => <Test />);
    const input = result.container.querySelector('input');
    const user = userEvent.setup();
    await simulateKeyInput(user, input, '0', 4, 4);
    expect(input).toHaveValue('1.0000001');
  });

  it('should handle exponential value as prop correctly #506', async () => {
    const { input } = await render(() => <NumericFormat value={0.00000001} />);
    expect(input).toHaveValue('0.00000001');
  });

  describe('should allow typing number if prefix or suffix is just an number #691', () => {
    it('when prefix is number', async () => {
      const result = await render(() => <NumericFormat prefix="1" />);

      const input = result.container.querySelector('input');
      const user = userEvent.setup();

      await simulateKeyInput(user, input, '1', 0, 0);
      expect(input).toHaveValue('11');
    });

    it('when prefix is multiple digit', async () => {
      const result = await render(() => <NumericFormat prefix="11" />);

      const input = result.container.querySelector('input');
      const user = userEvent.setup();

      await simulateKeyInput(user, input, '11', 0, 0);
      expect(input).toHaveValue('1111');
    });

    it('when suffix is number', async () => {
      const result = await render(() => <NumericFormat suffix="1" />);

      const input = result.container.querySelector('input');
      const user = userEvent.setup();

      await simulateKeyInput(user, input, '1', 0, 0);
      expect(input).toHaveValue('11');
    });

    it('when prefix and suffix both are number', async () => {
      const result = await render(() => <NumericFormat prefix="1" suffix="1" />);

      const input = result.container.querySelector('input');
      const user = userEvent.setup();

      await simulateKeyInput(user, input, '1', 0, 0);
      expect(input).toHaveValue('111');
    });
  });

  describe('should handle if only partial prefix or suffix is removed using double click select and the remove. #694', () => {
    it('while changing suffix', async () => {
      const result = await render(
        <NumericFormat prefix="100-" value={1} suffix="000 USD" />,
      );

      const input = result.container.querySelector('input');
      const user = userEvent.setup();

      await simulateDblClick(user, input, 10);
      
      await simulateKeyInput(user, input, '1');
      
    expect(input).toHaveValue('100-1000 USD');
  });

  it('while changing prefix', async () => {
    const result = await render(
      <NumericFormat prefix="100-" value={1} suffix="000 USD" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    // Double click at position 1 (should be in the prefix "100-")
    await simulateDblClick(user, input, 1);
    
    // Type '1'
    await simulateKeyInput(user, input, '1');
    
    expect(input).toHaveValue('100-1000 USD');
  });

  it('while deleting suffix', async () => {
    const result = await render(
      <NumericFormat prefix="100-" value={1} suffix="000 USD" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateDblClick(user, input, 10);
    await simulateKeyInput(user, input, '{Backspace}');
    expect(input).toHaveValue('100-1000 USD');
  });

  it('while deleting prefix', async () => {
    const result = await render(
      <NumericFormat prefix="100-" value={1} suffix="000 USD" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateKeyInput(user, input, '{Backspace}', 0, 4);
    expect(input).toHaveValue('100-1000 USD');
  });

  it('while deleting part of the prefix', async () => {
    const result = await render(
      <NumericFormat prefix="100-" value={1} suffix="000 USD" />,
    );

    const input = result.container.querySelector('input');
    const user = userEvent.setup();

    await simulateDblClick(user, input, 1);
    await simulateKeyInput(user, input, '{Backspace}');
    expect(input).toHaveValue('100-1000 USD');
  });
});

  describe('Test thousand group style', () => {
    it('should format on english style thousand grouping', async () => {
      const result = await render(
        () => <NumericFormat thousandSeparator={true} value={12345678} />,
      );

      const input = result.container.querySelector('input');
      const user = userEvent.setup();

      expect(input).toHaveValue('12,345,678');
      await simulateKeyInput(user, input, '9', 10, 10);
      expect(input).toHaveValue('123,456,789');
    });

    it('should format on indian (lakh) style thousand grouping', async () => {
      const result = await render(
        () => <NumericFormat thousandSeparator={true} thousandsGroupStyle="lakh" value={12345678} />,
      );

      const input = result.container.querySelector('input');
      const user = userEvent.setup();

      expect(input).toHaveValue('1,23,45,678');
      await simulateKeyInput(user, input, '9', 11, 11);
      expect(input).toHaveValue('12,34,56,789');
    });

    it('should format on chinese (wan) style thousand grouping', async () => {
      const result = await render(
        <NumericFormat thousandSeparator={true} thousandsGroupStyle="wan" value={12345678} />,
      );

      const input = result.container.querySelector('input');
      const user = userEvent.setup();

      expect(input).toHaveValue('1234,5678');
      await simulateKeyInput(user, input, '9', 9, 9);
      expect(input).toHaveValue('1,2345,6789');
    });
  });
});
