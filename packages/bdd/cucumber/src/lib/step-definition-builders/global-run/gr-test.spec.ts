import readdirp from 'readdirp';
test('recursive', async () => {
  for await (const entry of readdirp(
    'packages/bdd/cucumber/src/lib',
     {fileFilter: ['*.feature', '*.steps.ts']}
  )) {
    const { path, fullPath } = entry;

    if(path.endsWith('.steps.ts')){
        await import(fullPath)
    }
    console.log(`${JSON.stringify({ path })}`);
  }
});
