import { createSignal, on, createEffect } from 'solid-js';
import { NumericFormat, PatternFormat, NumberFormatBase } from 'solid-number-format';

// Helper for CustomNegationNumberFormat
const NEGATION_FORMAT_REGEX = /^\((.*)\)$/;

function extractNegationAndNumber(value: number | string | undefined) {
  let hasNegation = false;
  if (typeof value === 'number') {
    hasNegation = value < 0;
    value = hasNegation ? value * -1 : value;
  } else if (typeof value === 'string') {
    if (value?.[0] === '-') {
      hasNegation = true;
      value = value.substring(1);
    } else if (value?.match(NEGATION_FORMAT_REGEX)) {
      hasNegation = true;
      value = value.replace(NEGATION_FORMAT_REGEX, '$1');
    }
  }

  return { hasNegation, value: value ?? '' };
}


// --- Custom Components ---

const persianNumeral = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

interface CustomNumeralProps {
  value?: number | string;
  prefix?: string;
  suffix?: string;
  decimalSeparator?: string;
  allowedDecimalSeparators?: string[];
  [key: string]: any;
}

function CustomNumeralNumericFormat(props: CustomNumeralProps) {
  const toPersian = (val: string) => val.replace(/\d/g, ($1) => persianNumeral[Number($1)]);
  return (
    <NumericFormat
      {...props}
      renderText={(formattedValue: string) => <i>{toPersian(formattedValue)}</i>}
      placeholder="Persian numerals example"
    />
  );
}

interface CustomNegationProps {
  prefix?: string;
  suffix?: string;
  value?: number | string;
  defaultValue?: number | string;
  onValueChange?: (values: { formattedValue: string; value: string; floatValue: number | undefined }) => void;
  [key: string]: any;
}

function CustomNegationNumberFormat(props: CustomNegationProps) {
  const initial = extractNegationAndNumber(props.value ?? props.defaultValue);
  const [hasNegation, setHasNegation] = createSignal(initial.hasNegation);
  const [internalValue, setInternalValue] = createSignal(initial.value);

  createEffect(on(() => props.value, (value) => {
    if (value !== undefined) {
      const { hasNegation: newHasNegation, value: newInternalValue } = extractNegationAndNumber(value);
      setHasNegation(newHasNegation);
      setInternalValue(newInternalValue);
    }
  }));

  const _onValueChange = (values: { formattedValue: string; value: string; floatValue: number | undefined }) => {
    if (!props.onValueChange) return;

    const { value, floatValue } = values;
    props.onValueChange({
      ...values,
      value: hasNegation() ? `-${value}` : value,
      floatValue: hasNegation() && floatValue !== undefined ? -floatValue : floatValue,
    });
  };

  const _onKeyDown = (e: KeyboardEvent) => {
    const el = e.target as HTMLInputElement;
    const { key } = e;
    const { selectionStart } = el;

    if (key === '-') {
      setHasNegation(!hasNegation());
      e.preventDefault();
      return;
    }

    if (key === 'Backspace' && el.value[selectionStart - 1] === '(') {
        setHasNegation(false);
        e.preventDefault();
        return;
    }
  };

  const dynamicPrefix = () => (hasNegation() ? `(${props.prefix || ''}` : props.prefix || '');
  const dynamicSuffix = () => (hasNegation() ? `${props.suffix || ''})` : props.suffix || '');

  return (
    <NumericFormat
      {...props}
      prefix={dynamicPrefix()}
      suffix={dynamicSuffix()}
      allowNegative={false} // We handle negation manually
      value={internalValue()}
      onValueChange={_onValueChange}
      onKeyDown={_onKeyDown}
      placeholder="Custom negation example"
    />
  );
}

// --- Storybook Exports ---

export default {
  title: "Number Format Examples",
};

export function CurrencyText() {
  return (
    <div style="padding: 20px;">
      <h3>Prefix and thousand separator : Format currency as text</h3>
      <NumericFormat value={2456981} displayType="text" thousandSeparator={true} prefix="$" />
    </div>
  );
}

export function CreditCardText() {
  return (
    <div style="padding: 20px;">
      <h3>Format with pattern : Format credit card as text</h3>
      <PatternFormat value="4111111111111111" displayType="text" format="#### #### #### ####" />
    </div>
  );
}

export function CustomRenderText() {
  return (
    <div style="padding: 20px;">
      <h3>Custom renderText method</h3>
      <PatternFormat
        value="4111111111111111"
        displayType="text"
        format="#### #### #### ####"
        renderText={(value) => <i>{value}</i>}
      />
    </div>
  );
}

export function CurrencyInput() {
  const [test, setTest] = createSignal("1232323.78");

  const handleValueChange = (values: { formattedValue: string; value: string; floatValue: number | undefined }) => {
    setTest(values.value);
  };

  return (
    <div style="padding: 20px;">
      <h3>Prefix and thousand separator : Format currency in input</h3>
      <NumericFormat
        thousandSeparator=","
        decimalSeparator="."
        value={test()}
        prefix="$"
        onValueChange={handleValueChange}
      />
    </div>
  );
}

export function LeadingZeros() {
  return (
    <div style="padding: 20px;">
      <h3>Allow Leading Zeros: Will retain leading zeros onBlur</h3>
      <NumericFormat value="00012345" allowLeadingZeros={true} prefix="$" />
    </div>
  );
}

export function IndianNumbering() {
  return (
    <div style="padding: 20px;">
      <h3>Indian (lakh) style number grouping</h3>
      <NumericFormat value={123456789} thousandSeparator={true} prefix="₹" thousandsGroupStyle="lakh" />
    </div>
  );
}

export function ChineseNumbering() {
  return (
    <div style="padding: 20px;">
      <h3>Chinese (wan) style number grouping</h3>
      <NumericFormat value={123456789} thousandSeparator={true} prefix="¥" thousandsGroupStyle="wan" />
    </div>
  );
}

export function DecimalScale() {
  return (
    <div style="padding: 20px;">
      <h3>Decimal scale : Format currency in input with decimal scale</h3>
      <NumericFormat
        value={1234.500}
        thousandSeparator={true}
        decimalScale={3}
        fixedDecimalScale={true}
        prefix="$"
      />
    </div>
  );
}

export function CustomThousandSeparator() {
  return (
    <div style="padding: 20px;">
      <h3>Custom thousand separator : Format currency in input</h3>
      <div>ThousandSeparator: '.', decimalSeparator=','</div>
      <div style="margin: 10px 0;">
        <NumericFormat value={1234567.8901} thousandSeparator="." decimalSeparator="," prefix="$" />
        <NumericFormat value={9876543.21} thousandSeparator="." decimalSeparator="," prefix="$" suffix=" /-" />
      </div>
      <br />
      <div>ThousandSeparator: ' ', decimalSeparator='.'</div>
      <div style="margin: 10px 0;">
        <NumericFormat value={1234567.89} thousandSeparator=" " decimalSeparator="." prefix="$" />
      </div>
    </div>
  );
}

export function ThousandSeparatorWithDecimal() {
  return (
    <div style="padding: 20px;">
      <h3>Custom thousand separator with decimal precision</h3>
      <div>ThousandSeparator: ',', decimalSeparator='.', decimalScale:2</div>
      <div style="margin: 10px 0;">
        <NumericFormat value={1234567.89} thousandSeparator="," decimalSeparator="." decimalScale={2} fixedDecimalScale />
      </div>
      <br />
      <div>ThousandSeparator: '.', decimalSeparator=',', decimalScale:2</div>
      <div style="margin: 10px 0;">
        <NumericFormat value={1234567.89} thousandSeparator="." decimalSeparator="," decimalScale={2} fixedDecimalScale />
      </div>
    </div>
  );
}

export function CustomDecimalSeparators() {
  return (
    <div style="padding: 20px;">
      <h3>Custom allowed decimal separators</h3>
      <NumericFormat
        value="1234.56"
        thousandSeparator=" "
        decimalSeparator="."
        allowedDecimalSeparators={['.', ',']}
      />
    </div>
  );
}

export function CreditCardInput() {
  return (
    <div style="padding: 20px;">
      <h3>Format with pattern : Format credit card in an input</h3>
      <PatternFormat value="4111111111111111" format="#### #### #### ####" mask="_" />
    </div>
  );
}

export function MaskAsArray() {
  return (
    <div style="padding: 20px;">
      <h3>Format with mask as array</h3>
      <PatternFormat value="1225" format="##/##" placeholder="MM/YY" mask={['M', 'M', 'Y', 'Y']} />
    </div>
  );
}

export function CreditCardWithMask() {
  return (
    <div style="padding: 20px;">
      <h3>Format with mask : Format credit card in an input</h3>
      <PatternFormat value="4111111111111111" format="#### #### #### ####" mask="_" />
    </div>
  );
}

export function CardExpiry() {
    const format = (val: string) => {
        let month = val.substring(0, 2);
        const year = val.substring(2, 4);

        if (month.length === 1 && parseInt(month[0], 10) > 1) {
            month = `0${month[0]}`;
        }
        if (month.length === 2 && parseInt(month, 10) > 12) {
            month = '12';
        }
        
        return month + (year.length ? '/' + year : '');
    };

    return (
        <div style="padding: 20px;">
            <h3>Custom format method : Format credit card expiry time</h3>
            <NumberFormatBase value="1225" format={format} placeholder="MM/YY" />
        </div>
    );
}


export function PhoneNumber() {
  return (
    <div style="padding: 20px;">
      <h3>Format phone number</h3>
      <PatternFormat value="1234567890" format="+1 (###) ###-####" mask="_" />
    </div>
  );
}

export function ShowMaskOnEmpty() {
  return (
    <div style="padding: 20px;">
      <h3>Show mask on empty input</h3>
      <PatternFormat format="+1 (###) ###-####" mask="_" allowEmptyFormatting />
    </div>
  );
}

export function CustomInput() {
  return (
    <div style="padding: 20px;">
      <h3>Custom input : Format credit card number</h3>
      <PatternFormat value="4111111111111111" format="#### #### #### ####" />
    </div>
  );
}

export function CustomNumeral() {
  return (
    <div style="padding: 20px;">
      <h3>Custom Numeral: add support for custom languages</h3>
      <CustomNumeralNumericFormat
        value={12345.67}
        prefix="$"
        thousandSeparator=","
        decimalSeparator="."
        suffix="/-"
        allowedDecimalSeparators={[',', '.']}
      />
    </div>
  );
}

export function CustomNegation() {
  return (
    <div style="padding: 20px;">
      <h3>Custom Negation: Format numbers with parentheses for negation</h3>
      <CustomNegationNumberFormat
        thousandSeparator
        prefix="$"
        defaultValue={-1234}
      />
    </div>
  );
}