export function generateUniqueId(prefixstr: string): string {
  return prefixstr + '-' + Math.random().toString(36).slice(2, 9);
}