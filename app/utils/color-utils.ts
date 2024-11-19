// 预定义的颜色池
const COLOR_PAIRS = [
  { bg: 'bg-blue-100', text: 'text-blue-800' },
  { bg: 'bg-green-100', text: 'text-green-800' },
  { bg: 'bg-purple-100', text: 'text-purple-800' },
  { bg: 'bg-pink-100', text: 'text-pink-800' },
  { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  { bg: 'bg-indigo-100', text: 'text-indigo-800' },
  { bg: 'bg-red-100', text: 'text-red-800' },
  { bg: 'bg-orange-100', text: 'text-orange-800' },
  { bg: 'bg-teal-100', text: 'text-teal-800' },
  { bg: 'bg-cyan-100', text: 'text-cyan-800' },
];

// 根据字符串生成固定的颜色索引
export function getColorForString(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % COLOR_PAIRS.length;
  return `${COLOR_PAIRS[index].bg} ${COLOR_PAIRS[index].text}`;
}

// 获取随机颜色
export function getRandomColor(): string {
  const index = Math.floor(Math.random() * COLOR_PAIRS.length);
  return `${COLOR_PAIRS[index].bg} ${COLOR_PAIRS[index].text}`;
} 