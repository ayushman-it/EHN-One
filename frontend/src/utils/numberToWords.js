/**
 * Converts a number to Indian Currency Words
 * Example: 1840 -> "INR One Thousand Eight Hundred Forty Only"
 * Example: 1020.50 -> "INR One Thousand Twenty and Fifty Paisa Only"
 */

const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function inWords(num) {
  if ((num = num.toString()).length > 9) return 'Overflow';
  const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || (b[n[1][0]] + ' ' + a[n[1][1]])) + 'Crore ' : '';
  str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || (b[n[2][0]] + ' ' + a[n[2][1]])) + 'Lakh ' : '';
  str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || (b[n[3][0]] + ' ' + a[n[3][1]])) + 'Thousand ' : '';
  str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || (b[n[4][0]] + ' ' + a[n[4][1]])) + 'Hundred ' : '';
  str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || (b[n[5][0]] + ' ' + a[n[5][1]])) : '';
  return str.trim();
}

export function numberToIndianWords(amount) {
  if (amount === undefined || amount === null || isNaN(amount) || amount === 0) {
    return 'INR Zero Only';
  }

  const parts = amount.toString().split('.');
  const rupees = parseInt(parts[0], 10);
  const paisa = parts[1] ? parseInt(parts[1].substring(0, 2), 10) : 0;

  let result = 'INR ';
  
  if (rupees > 0) {
    result += inWords(rupees);
  } else {
    result += 'Zero';
  }

  if (paisa > 0) {
    result += ' and ' + inWords(paisa) + ' Paisa';
  }

  result += ' Only';
  return result;
}

export default numberToIndianWords;
