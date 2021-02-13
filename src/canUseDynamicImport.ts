/* istanbul ignore file */
let result: boolean;
function canUseDynamicImport(): boolean {
  if (result === undefined) {
    try {
      new Function('id', 'return import(id);');
      result = true;
    } catch (e) {
      result = false;
    }
  }
  return result;
}

export { canUseDynamicImport };
