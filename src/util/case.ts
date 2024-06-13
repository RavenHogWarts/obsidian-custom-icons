export function convertCamelCaseToKebabCase(name: string): string {
  // AArrowDown -> a-arrow-down
  return name
    .replace(/^([A-Z])/, (match, p1) => p1.toLowerCase())
    .replace(/([A-Z])/g, (match, p1) => `-${p1.toLowerCase()}`);
}

export function convertKebabCaseToCamelCase(name: string): string {
  // a-arrow-down -> AArrowDown
  return name
    .split('-') // 将字符串按破折号分割成数组
    .map((word, index) => 
      index === 0 ? word.charAt(0).toUpperCase() + word.slice(1) // 首单词首字母大写
      : word.charAt(0).toUpperCase() + word.slice(1) // 其他单词首字母大写
    )
    .join('');
}