/**
 * Utility to convert numeric currency values (Naira / NGN) into official English words.
 * Example: 5420000 -> "Five Million, Four Hundred and Twenty Thousand Naira Only"
 */

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
  'Seventeen', 'Eighteen', 'Nineteen'
];

const TENS = [
  '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'
];

function convertThreeDigitGroup(num: number): string {
  let str = '';
  const hundreds = Math.floor(num / 100);
  const remainder = num % 100;

  if (hundreds > 0) {
    str += `${ONES[hundreds]} Hundred`;
    if (remainder > 0) {
      str += ' and ';
    }
  }

  if (remainder > 0) {
    if (remainder < 20) {
      str += ONES[remainder];
    } else {
      const ten = Math.floor(remainder / 10);
      const unit = remainder % 10;
      str += TENS[ten];
      if (unit > 0) {
        str += `-${ONES[unit]}`;
      }
    }
  }

  return str;
}

export function numberToWordsNaira(amount: number): string {
  if (isNaN(amount) || amount === 0) {
    return 'Zero Naira Only';
  }

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);

  const integerPart = Math.floor(absAmount);
  const koboPart = Math.round((absAmount - integerPart) * 100);

  if (integerPart === 0 && koboPart === 0) {
    return 'Zero Naira Only';
  }

  const scales = [
    { value: 1_000_000_000_000, name: 'Trillion' },
    { value: 1_000_000_000, name: 'Billion' },
    { value: 1_000_000, name: 'Million' },
    { value: 1_000, name: 'Thousand' },
    { value: 1, name: '' },
  ];

  let remaining = integerPart;
  const parts: string[] = [];

  for (const scale of scales) {
    if (remaining >= scale.value) {
      const count = Math.floor(remaining / scale.value);
      remaining = remaining % scale.value;

      const groupWords = convertThreeDigitGroup(count);
      if (groupWords) {
        if (scale.name) {
          parts.push(`${groupWords} ${scale.name}`);
        } else {
          parts.push(groupWords);
        }
      }
    }
  }

  let nairaWords = parts.join(', ');
  if (isNegative) {
    nairaWords = `Minus ${nairaWords}`;
  }

  if (integerPart > 0) {
    nairaWords += ' Naira';
  }

  if (koboPart > 0) {
    const koboWords = convertThreeDigitGroup(koboPart);
    if (integerPart > 0) {
      nairaWords += ` and ${koboWords} Kobo Only`;
    } else {
      nairaWords = `${koboWords} Kobo Only`;
    }
  } else {
    nairaWords += ' Only';
  }

  return nairaWords;
}
