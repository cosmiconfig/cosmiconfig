/* istanbul ignore next */
function canUseDynamicImport(): boolean {
  try {
    new Function('id', 'return import(id);');
    return true;
  } catch (e) {
    return false;
  }
}

export { canUseDynamicImport };
