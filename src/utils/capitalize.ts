/**
 * Kapitalisasi huruf pertama dari string
 * @param text - string yang ingin diubah
 * @returns string dengan huruf pertama kapital
 */
export function capitalizeFirstLetter(text: string): string {
  if (!text) return ''
  return text.charAt(0).toUpperCase() + text.slice(1)
}
