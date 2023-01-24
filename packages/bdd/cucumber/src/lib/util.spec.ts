import path = require('path');

test('some test', () => {
  console.log(path.isAbsolute('C:/'));
  console.log(path.normalize('a'));
  console.log(process.cwd());
  console.log(path.relative(process.cwd(), 'a'));
  const regex = /[.]|[..]\//;
  console.log(regex.test('./a'));
});
