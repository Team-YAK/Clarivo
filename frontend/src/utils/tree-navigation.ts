export interface BackendTreeOption {
  key?: string;
  label: string;
  icon?: string;
}

export interface BackendExpandResult {
  quick_option?: BackendTreeOption | null;
  options: BackendTreeOption[];
}

export interface DisplayOption {
  key: string;
  label: string;
  icon: string;
}

export const toDisplayOption = (
  option: BackendTreeOption | null | undefined,
): DisplayOption | null => {
  if (!option?.key || !option.label || !option.icon) {
    return null;
  }

  return {
    key: option.key,
    label: option.label,
    icon: option.icon,
  };
};

export function normalizeAiExpandResult(result: BackendExpandResult): {
  options: DisplayOption[];
  quickOption: DisplayOption | null;
} {
  const quickOption = toDisplayOption(result.quick_option);
  const seen = new Set<string>();
  const options: DisplayOption[] = [];

  for (const option of result.options) {
    const normalized = toDisplayOption(option);
    if (!normalized) {
      continue;
    }
    if (quickOption && normalized.key === quickOption.key) {
      continue;
    }
    if (seen.has(normalized.key)) {
      continue;
    }
    seen.add(normalized.key);
    options.push(normalized);
  }

  return { options, quickOption };
}

export const extendBreadcrumbs = (
  breadcrumbs: DisplayOption[],
  option: DisplayOption,
): DisplayOption[] => [...breadcrumbs, option];
