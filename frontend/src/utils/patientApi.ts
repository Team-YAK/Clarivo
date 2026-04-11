export interface TreeNode {
  key: string;
  label: string;
  iconName: string;
  isLeaf: boolean;
  colorClass: string;
}

const TREE_DATA: Record<string, TreeNode[]> = {
  root: [
    { key: 'physical', label: 'Physical Needs', iconName: 'PersonArmsSpread', isLeaf: false, colorClass: 'bg-teal-800' },
    { key: 'emotional', label: 'Emotions', iconName: 'Smiley', isLeaf: false, colorClass: 'bg-red-600' },
    { key: 'environment', label: 'Environment', iconName: 'House', isLeaf: false, colorClass: 'bg-indigo-900' },
    { key: 'food', label: 'Food', iconName: 'ForkKnife', isLeaf: false, colorClass: 'bg-amber-500' },
    { key: 'drink', label: 'Drink', iconName: 'Drop', isLeaf: false, colorClass: 'bg-sky-500' },
    { key: 'sleep', label: 'Sleep', iconName: 'Moon', isLeaf: true, colorClass: 'bg-purple-800' },
    { key: 'social', label: 'Social', iconName: 'Users', isLeaf: false, colorClass: 'bg-pink-500' },
    { key: 'watch', label: 'Watch / Entertainment', iconName: 'Eye', isLeaf: false, colorClass: 'bg-slate-600' },
    { key: 'toilet', label: 'Toilet', iconName: 'Toilet', isLeaf: true, colorClass: 'bg-slate-400' },
  ],
  physical: [
    { key: 'pain', label: 'Pain', iconName: 'Activity', isLeaf: false, colorClass: 'bg-red-600' },
    { key: 'hot', label: 'Too Hot', iconName: 'Sun', isLeaf: true, colorClass: 'bg-orange-500' },
    { key: 'cold', label: 'Too Cold', iconName: 'Snowflake', isLeaf: true, colorClass: 'bg-blue-300' },
  ],
  pain: [
    { key: 'headache', label: 'Headache', iconName: 'Brain', isLeaf: true, colorClass: 'bg-red-700' },
    { key: 'stomach', label: 'Stomach Ache', iconName: 'Bandaid', isLeaf: true, colorClass: 'bg-amber-600' },
  ]
};

export const fetchTreeRoot = async (): Promise<TreeNode[]> => {
  return Promise.resolve(TREE_DATA.root);
};

export const fetchTreeChildren = async (parentKey: string): Promise<TreeNode[]> => {
  return Promise.resolve(TREE_DATA[parentKey] || []);
};

export const fetchPredictions = async () => Promise.resolve([]);
export const fetchShortcuts = async () => Promise.resolve([]);
export const fetchIcons = async () => Promise.resolve([]);

export async function* generateIntentStream(path: string[]): AsyncGenerator<string> {
  const sentence = `I feel ${path[path.length - 1]}.`;
  const words = sentence.split(' ');
  for (const word of words) {
    await new Promise(resolve => setTimeout(resolve, 300));
    yield word + ' ';
  }
}
