// Test the name parser with examples from the CSV
const { parseFirstName } = require('../src/lib/name-parser.ts');

const testCases = [
  { input: "Елизавета Андрианова", expected: "Елизавета" },
  { input: "Андрей Ширманов, Ширманов Андрей", expected: "Андрей" },
  { input: "Ковалев Максим, Максим Ковалев", expected: "Максим" },
  { input: "Даниил Гуринов", expected: "Даниил" },
  { input: "Анастасия Липина, Анастасия липина, Липина Анастасия", expected: "Анастасия" },
  { input: "Василий, Василий Иванов, Иванов Василий", expected: "Василий" },
  { input: "Виктория Королева", expected: "Виктория" },
  { input: "Егор Негруб", expected: "Егор" },
  { input: "Кирилл, Кирилл Лукьянов", expected: "Кирилл" },
  { input: "Inna, Инна Сухонина", expected: "Inna" },
  { input: "Артем Харитонов", expected: "Артем" },
  { input: "Кирилл Татаринов", expected: "Кирилл" },
  { input: "Наталья Корнева", expected: "Наталья" },
  { input: "Дарья Глущенко", expected: "Дарья" },
  { input: "Денис Петренко, Денис Петьренко", expected: "Денис" },
  { input: "Кристина Приезжих, Приезжих Кристина", expected: "Кристина" },
  { input: "Ахраменко Николай, Николай Ахраменко", expected: "Николай" },
  { input: "Малюкова Полина, Полина Малюкова", expected: "Полина" },
  { input: "Ирина, Ирина Рябова", expected: "Ирина" }
];

console.log('Testing name parser with CSV examples...\n');

testCases.forEach(({ input, expected }) => {
  const result = parseFirstName(input);
  const passed = result === expected;
  console.log(`${passed ? '✅' : '❌'} "${input}"`);
  console.log(`   → Got: "${result}", Expected: "${expected}"\n`);
});

console.log('\nTesting CSV parsing simulation...');
const csvData = `Email,Количество и билеты,Имена
andri.liz@yandex.ru,"Появлений: 15, Билетов: 16",Елизавета Андрианова
9210910612@mail.ru,"Появлений: 11, Билетов: 12","Андрей Ширманов, Ширманов Андрей"
lutoevaanastasia@gmail.com,"Появлений: 10, Билетов: 10","Анастасия Липина, Анастасия липина, Липина Анастасия"`;

const lines = csvData.split('\n');
const headers = lines[0].split(',');

console.log('\nParsed results:');
for (let i = 1; i < lines.length; i++) {
  const values = lines[i].match(/(".*?"|[^,]+)/g).map(v => v.replace(/^"|"$/g, '').trim());
  const email = values[0];
  const names = values[2];
  const firstName = parseFirstName(names);
  
  console.log(`Email: ${email} → First name: ${firstName}`);
}