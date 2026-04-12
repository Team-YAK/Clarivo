"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, CaretDown } from "@phosphor-icons/react";
import { fetchTreeRoot, fetchTreeChildren, TreeNode } from "@/utils/patientApi";
import { getIconComponent } from "@/utils/icon-map";
import { LiquidButton } from "@/components/ui/liquid-glass-button";

export interface StackAddEvent {
  key: string;
  label: string;
}

interface ButtonGridProps {
  onAddToStack: (item: StackAddEvent) => void;
}

// ── Lazy-loaded icon card ──────────────────────────────────
function LazyIconCard({
  node,
  onAdd,
  onDrillDown,
}: {
  node: TreeNode;
  onAdd: (node: TreeNode) => void;
  onDrillDown: (node: TreeNode) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "100px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const Icon = isVisible ? getIconComponent(node.key) : null;

  return (
    <div ref={ref} className="relative group">
      {isVisible && Icon ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.15 }}
        >
          <LiquidButton
            size="xxl"
            onClick={() => {
              if (node.isLeaf) {
                onAdd(node);
              } else {
                // Tap on non-leaf: add the general concept to stack
                onAdd(node);
              }
            }}
            className="!w-full !h-full !rounded-2xl !px-0 !py-0 flex-col !gap-1"
          >
            <div className="flex flex-col items-center justify-center w-full py-5 px-3 gap-2">
              <Icon size={36} weight="regular" className="text-on-surface drop-shadow-sm" />
              <span className="font-headline font-bold text-xs text-on-surface/80 text-center leading-tight line-clamp-2">
                {node.label}
              </span>
            </div>
          </LiquidButton>

          {/* "Go deeper" button for non-leaf nodes */}
          {!node.isLeaf && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDrillDown(node);
              }}
              className="absolute -bottom-1 left-1/2 -translate-x-1/2 translate-y-1/2 z-10 
                flex items-center justify-center w-7 h-7 rounded-full 
                bg-primary text-on-primary shadow-lg 
                opacity-0 group-hover:opacity-100 
                hover:scale-110 active:scale-95 
                transition-all duration-200"
              title={`Explore ${node.label} sub-options`}
            >
              <CaretDown size={16} weight="bold" />
            </button>
          )}
        </motion.div>
      ) : (
        /* Skeleton placeholder matching card size */
        <div className="w-full aspect-square rounded-2xl bg-surface-container-high/40 animate-pulse" />
      )}
    </div>
  );
}

// ── Main ButtonGrid ────────────────────────────────────────
export default function ButtonGrid({ onAddToStack }: ButtonGridProps) {
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<TreeNode[]>([]);
  const [gridKey, setGridKey] = useState(0);

  // Load root nodes on mount
  useEffect(() => {
    fetchTreeRoot().then(setNodes);
  }, []);

  const handleAdd = useCallback(
    (node: TreeNode) => {
      onAddToStack({ key: node.key, label: node.label });
    },
    [onAddToStack]
  );

  const handleDrillDown = useCallback(
    async (node: TreeNode) => {
      setBreadcrumb((prev) => [...prev, node]);
      setCurrentNode(node.key);
      const children = await fetchTreeChildren(node.key);
      setNodes(children);
      setGridKey((k) => k + 1);
    },
    []
  );

  const handleBack = useCallback(async () => {
    if (breadcrumb.length === 0) return;
    const newBreadcrumb = [...breadcrumb];
    newBreadcrumb.pop();
    setBreadcrumb(newBreadcrumb);

    if (newBreadcrumb.length === 0) {
      setCurrentNode(null);
      const root = await fetchTreeRoot();
      setNodes(root);
    } else {
      const parent = newBreadcrumb[newBreadcrumb.length - 1];
      setCurrentNode(parent.key);
      const children = await fetchTreeChildren(parent.key);
      setNodes(children);
    }
    setGridKey((k) => k + 1);
  }, [breadcrumb]);

  return (
    <section className="h-full flex-1 min-w-0 bg-transparent flex flex-col overflow-hidden relative">
      {/* Top Breadcrumb and Nav Controls */}
      <div className="flex items-center gap-4 px-2 pb-4 flex-shrink-0">
        <AnimatePresence>
          {breadcrumb.length > 0 && (
            <motion.button
              initial={{ opacity: 0, x: -20, width: 0 }}
              animate={{ opacity: 1, x: 0, width: "auto" }}
              exit={{ opacity: 0, x: -20, width: 0 }}
              onClick={handleBack}
              className="flex items-center justify-center p-3 bg-surface-container-high rounded-full hover:bg-surface-variant transition-colors shadow-sm shrink-0"
            >
              <ArrowLeft size={24} weight="bold" className="text-on-surface" />
            </motion.button>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-2 text-lg font-bold font-headline text-on-surface-variant overflow-x-auto no-scrollbar">
          <span
            className={
              breadcrumb.length === 0
                ? "text-primary shrink-0"
                : "shrink-0 cursor-pointer hover:text-primary transition-colors"
            }
            onClick={() => {
              if (breadcrumb.length > 0) {
                setBreadcrumb([]);
                setCurrentNode(null);
                fetchTreeRoot().then(setNodes);
                setGridKey((k) => k + 1);
              }
            }}
          >
            Needs
          </span>
          {breadcrumb.map((b, i) => (
            <React.Fragment key={b.key}>
              <span className="opacity-40 shrink-0">/</span>
              <span
                className={
                  i === breadcrumb.length - 1
                    ? "text-primary shrink-0"
                    : "shrink-0 cursor-pointer hover:text-primary transition-colors"
                }
                onClick={async () => {
                  if (i < breadcrumb.length - 1) {
                    const newBc = breadcrumb.slice(0, i + 1);
                    setBreadcrumb(newBc);
                    setCurrentNode(newBc[newBc.length - 1].key);
                    const children = await fetchTreeChildren(
                      newBc[newBc.length - 1].key
                    );
                    setNodes(children);
                    setGridKey((k) => k + 1);
                  }
                }}
              >
                {b.label}
              </span>
            </React.Fragment>
          ))}
        </div>
      </div>

      {/* Scrollable Grid */}
      <div className="flex-1 overflow-y-auto overscroll-contain pb-28 px-1 scroll-smooth" style={{ WebkitOverflowScrolling: "touch" }}>
        <AnimatePresence mode="wait">
          <motion.div
            key={gridKey}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-4 content-start"
          >
            {nodes.map((node) => (
              <LazyIconCard
                key={node.key}
                node={node}
                onAdd={handleAdd}
                onDrillDown={handleDrillDown}
              />
            ))}
            {nodes.length === 0 && (
              <div className="col-span-full flex items-center justify-center p-12 text-on-surface-variant/50 font-bold text-lg">
                No items in this category.
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
