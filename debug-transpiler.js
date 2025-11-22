// Debug script to test the transpiler
const { VB6UnifiedASTTranspiler } = require('./src/compiler/VB6UnifiedASTTranspiler.ts');

const code = `
Sub HelloWorld()
    MsgBox "Hello, World!"
End Sub
`;

const transpiler = new VB6UnifiedASTTranspiler();
const result = transpiler.transpile(code, 'Test');

console.log('Success:', result.success);
console.log('Errors:', result.errors);
console.log('Warnings:', result.warnings);
console.log('Metrics:', result.metrics);
console.log('\nGenerated JavaScript:');
console.log(result.javascript);

if (result.ast) {
  console.log('\nAST:');
  console.log(JSON.stringify(result.ast, null, 2));
}
