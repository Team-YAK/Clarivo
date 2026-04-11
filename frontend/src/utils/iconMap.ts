import * as Icons from '@phosphor-icons/react';

export const getIconComponent = (iconName: string) => {
  // @ts-expect-error - mapping from dynamic string
  const Icon = Icons[iconName];
  if (!Icon) {
    console.warn(`Icon ${iconName} not found in Phosphor Icons, falling back to Question mark.`);
    return Icons.Question;
  }
  return Icon;
};
