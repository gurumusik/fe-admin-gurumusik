export const isFormData = (b: unknown): b is FormData =>
  typeof FormData !== 'undefined' && b instanceof FormData;