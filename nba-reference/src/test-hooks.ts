export function testFunction(x: number, y: string): boolean {
  return x > 0 && y.length > 0;
}

const _result = testFunction(1, 'test');
console.log('Test result:', _result);
