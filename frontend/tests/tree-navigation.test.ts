import test from "node:test";
import assert from "node:assert/strict";

import {
  extendBreadcrumbs,
  normalizeAiExpandResult,
} from "../src/utils/tree-navigation.ts";

test("normalizeAiExpandResult keeps only backend-provided keys and icons", () => {
  const normalized = normalizeAiExpandResult({
    quick_option: { key: "coffee", label: "Coffee", icon: "coffee" },
    options: [
      { key: "coffee", label: "Coffee", icon: "coffee" },
      { key: "tea", label: "Tea", icon: "tea-bag" },
      { key: "water", label: "Water" },
      { label: "Juice", icon: "orange-slice" },
      { key: "tea", label: "Tea Again", icon: "tea-bag" },
    ],
  });

  assert.deepEqual(normalized.quickOption, {
    key: "coffee",
    label: "Coffee",
    icon: "coffee",
  });
  assert.deepEqual(normalized.options, [
    { key: "tea", label: "Tea", icon: "tea-bag" },
  ]);
});

test("extendBreadcrumbs preserves backend icons verbatim", () => {
  const breadcrumbs = extendBreadcrumbs([], {
    key: "need-help",
    label: "Help",
    icon: "layer:hand+heart",
  });

  assert.equal(breadcrumbs[0]?.icon, "layer:hand+heart");
  assert.equal(breadcrumbs[0]?.key, "need-help");
});
