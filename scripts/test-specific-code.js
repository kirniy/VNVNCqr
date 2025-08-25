// Test the specific QR code from the image
const testCode = 'ANGAR-BNFBP5-FGZ2BAMMCU50LVE';

console.log('\n=== Testing QR Code: ' + testCode + ' ===\n');

// Test with current regex patterns
const oldFormatRegex = /^ANGAR-\d{4}-\d{4}$/;
const newFormatRegex = /^ANGAR-B[A-Z0-9]{5}-[A-Z0-9]+$/;

console.log('Testing against regex patterns:\n');
console.log('Old format regex: /^ANGAR-\\d{4}-\\d{4}$/');
console.log('Match result:', oldFormatRegex.test(testCode));

console.log('\nNew format regex: /^ANGAR-B[A-Z0-9]{5}-[A-Z0-9]+$/');
console.log('Match result:', newFormatRegex.test(testCode));

console.log('\nWould scanner accept this code?', 
  (oldFormatRegex.test(testCode) || newFormatRegex.test(testCode)) ? '✅ YES' : '❌ NO');

// Test URL extraction
console.log('\n\nTesting URL extraction:');
const testUrl = `https://angarqr.web.app/v/${testCode}`;
console.log('Full URL:', testUrl);

let extractedCode = testUrl;
if (testUrl.includes('/v/')) {
  const match = testUrl.match(/\/v\/([A-Z0-9-]+)/);
  extractedCode = match ? match[1] : testUrl;
}

console.log('Extracted code:', extractedCode);
console.log('Matches:', extractedCode === testCode ? '✅ Extraction works' : '❌ Extraction failed');

// Character analysis
console.log('\n\nCharacter analysis:');
const parts = testCode.split('-');
console.log('Parts:', parts);
console.log('Part 1:', parts[0], '- Should be "ANGAR":', parts[0] === 'ANGAR' ? '✅' : '❌');
console.log('Part 2:', parts[1], '- Length:', parts[1].length, '- Should start with B:', parts[1].startsWith('B') ? '✅' : '❌');
console.log('Part 3:', parts[2], '- Length:', parts[2].length);

// Check if lowercase letters might be the issue
console.log('\n\nChecking for lowercase letters:');
const hasLowercase = /[a-z]/.test(testCode);
console.log('Contains lowercase:', hasLowercase ? '❌ YES (This could be the problem!)' : '✅ NO');

if (hasLowercase) {
  const uppercaseCode = testCode.toUpperCase();
  console.log('\nTesting uppercase version:', uppercaseCode);
  console.log('Would uppercase version match?', newFormatRegex.test(uppercaseCode) ? '✅ YES' : '❌ NO');
}