import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@solidjs/testing-library';
import '@testing-library/jest-dom';

import NumericFormat from '../../src/numeric_format';
import PatternFormat from '../../src/pattern_format';
import { createSignal } from 'solid-js';

beforeEach(() => {
  Object.defineProperty(HTMLElement.prototype, 'offsetParent', {
    get() {
      return this.parentNode;
    },
    configurable: true
  });
});

/*** format_number input as text ****/
describe('NumberFormat as text', () => {
  it('should format numbers to currency', () => {
    render(
      () => <NumericFormat value={2456981} displayType={'text'} thousandSeparator={true} prefix={'$'} />,
    );

    const span = screen.getByText(/\$2,456,981/);
    expect(span).toBeVisible();
  });

  it('should format as given format', () => {
    render(
      () => <PatternFormat value={4111111111111111} displayType={'text'} format="#### #### #### ####" />,
    );

    const span = screen.getByText(/4111 1111 1111 1111/);
    expect(span).toBeVisible();
  });

  it('should format as given format when input is string', () => {
    render(() => 
      <PatternFormat
        value="4111111111111111"
        valueIsNumericString
        displayType={'text'}
        format="#### #### #### ####"
      />,
    );

    const span = screen.getByText(/4111 1111 1111 1111/);
    expect(span).toBeVisible();
  });

  it('should format as given format when input length is less than format length', () => {
    render(() => 
      <PatternFormat
        value="41111111111111"
        valueIsNumericString
        displayType={'text'}
        format="#### #### #### ####"
      />,
    );

    const span = screen.getByText(/4111 1111 1111 11  /, {
      collapseWhitespace: false,
      trim: false,
    });
    expect(span).toBeVisible();
  });

  it('should format as given format with mask', () => {
    render(() => 
      <PatternFormat
        value="41111111111111"
        valueIsNumericString
        displayType={'text'}
        format="#### #### #### ####"
        mask="_"
      />,
    );

    const span = screen.getByText('4111 1111 1111 11__');
    expect(span).toBeVisible();
  });

  it('should limit decimal scale to given value', async () => {
    const [value, setValue] = createSignal(4111.344);
    
    const TestComponent = () => {
      return <NumericFormat value={value()} displayType={'text'} decimalScale={2} />;
    };

    const { container } = render(() => <TestComponent />);
    
    let span = screen.getByText('4111.34');
    expect(span).toBeVisible();
    setValue(4111.358);
    
    await waitFor(() => {
      // Re-query the span element since the content has changed
      const updatedSpan = container.querySelector('span');
      expect(updatedSpan).not.toBeNull();
      // This should match the React behavior: 4111.358 should round to 4111.36
      expect(updatedSpan!.textContent).toEqual('4111.36');
    });
  });

  it('should limit decimal scale to given value', async () => {
    const [value, setValue] = createSignal(4111.344);
    
    const TestComponent = () => (
      <NumericFormat value={value()} displayType={'text'} decimalScale={2} />
    );

    render(() => <TestComponent />);
    
    let span = screen.getByText('4111.34');
    expect(span.offsetParent).not.toBeNull(); // This will now work

    setValue(4111.358);
    
    await waitFor(() => {
      span = screen.getByText('4111.36');
      expect(span.textContent).toEqual('4111.36');
    });
  });

  it('should add zeros if fixedDecimalScale is provided', async () => {
    const [decimalScale, setDecimalScale] = createSignal(4);
    
    const TestComponent = () => (
      <NumericFormat
        value="4111.11"
        valueIsNumericString
        displayType={'text'}
        decimalScale={decimalScale()}
        fixedDecimalScale={true}
      />
    );

    const { container } = render(() => <TestComponent />);
    
    let span = screen.getByText('4111.1100');
    expect(span).toBeVisible();

    setDecimalScale(1);
    
    await waitFor(() => {
      const updatedSpan = container.querySelector('span');
      expect(updatedSpan!.textContent).toEqual('4111.1');
    });
  });

  it('should accept custom renderText method', () => {
    render(() => 
      <NumericFormat
        value="4111.11"
        valueIsNumericString
        thousandSeparator=","
        renderText={(value) => <div data-testid="rnf-renderText-div">{value}</div>}
        displayType={'text'}
      />,
    );

    const div = screen.getByTestId('rnf-renderText-div');
    expect(div.textContent).toEqual('4,111.11');
  });
});
