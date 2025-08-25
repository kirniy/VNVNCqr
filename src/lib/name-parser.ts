/**
 * Parse first name from various name formats
 * Handles: "Имя Фамилия", "Фамилия Имя", "Имя", multiple names separated by commas
 */
export function parseFirstName(names: string): string {
  if (!names || names.trim() === '') {
    return '';
  }

  // Split by comma to handle multiple names
  const namesList = names.split(',').map(n => n.trim()).filter(n => n);
  
  if (namesList.length === 0) {
    return '';
  }

  // Take the first name entry
  const firstNameEntry = namesList[0];
  
  // Split by space
  const parts = firstNameEntry.split(' ').filter(p => p);
  
  if (parts.length === 0) {
    return '';
  }
  
  // If only one part, return it
  if (parts.length === 1) {
    return parts[0];
  }
  
  // For two parts, we need to determine which is the first name
  // Common Russian surnames often end with: -ов, -ев, -ин, -ский, -цкий, -ова, -ева, -ина, -ская, -цкая
  const surnamePatterns = [
    /ов$/i, /ев$/i, /ин$/i, /ын$/i, /ский$/i, /цкий$/i, /ской$/i, /цкой$/i,
    /ова$/i, /ева$/i, /ина$/i, /ына$/i, /ская$/i, /цкая$/i,
    /ович$/i, /евич$/i, /овна$/i, /евна$/i, /ична$/i, /инична$/i
  ];
  
  // Check if first part looks like a surname
  const firstPartIsSurname = surnamePatterns.some(pattern => pattern.test(parts[0]));
  
  // If first part is surname, return second part, otherwise return first part
  return firstPartIsSurname && parts.length > 1 ? parts[1] : parts[0];
}

/**
 * Test cases for name parsing
 */
export function testNameParser() {
  const testCases = [
    { input: "Елизавета Андрианова", expected: "Елизавета" },
    { input: "Андрей Ширманов, Ширманов Андрей", expected: "Андрей" },
    { input: "Ковалев Максим, Максим Ковалев", expected: "Максим" },
    { input: "Василий, Василий Иванов, Иванов Василий", expected: "Василий" },
    { input: "Кирилл, Кирилл Лукьянов", expected: "Кирилл" },
    { input: "Inna, Инна Сухонина", expected: "Inna" },
    { input: "Малюкова Полина, Полина Малюкова", expected: "Полина" },
    { input: "Ирина, Ирина Рябова", expected: "Ирина" },
    { input: "Ахраменко Николай, Николай Ахраменко", expected: "Николай" },
    { input: "", expected: "" },
    { input: "Иван", expected: "Иван" }
  ];

  console.log('Testing name parser...');
  testCases.forEach(({ input, expected }) => {
    const result = parseFirstName(input);
    const passed = result === expected;
    console.log(`${passed ? '✅' : '❌'} "${input}" → "${result}" (expected: "${expected}")`);
  });
}