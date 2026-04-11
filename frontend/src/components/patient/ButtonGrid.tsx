"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SquaresFour, Keyboard, ArrowLeft } from '@phosphor-icons/react';
import { fetchTreeRoot, fetchTreeChildren, TreeNode } from '@/utils/patientApi';
import { getIconComponent } from '@/utils/iconMap';
import SentenceOutput from './SentenceOutput';

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.9 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 300, damping: 20 } }
};

export default function ButtonGrid() {
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [nodes, setNodes] = useState<TreeNode[]>([]);
  const [breadcrumb, setBreadcrumb] = useState<TreeNode[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamedPath, setStreamedPath] = useState<string[]>([]);
  
  // Load root nodes on mount
  useEffect(() => {
    fetchTreeRoot().then(setNodes);
  }, []);

  const handleNodeClick = async (node: TreeNode) => {
    if (node.isLeaf) {
      setStreamedPath([...breadcrumb.map(b => b.label), node.label]);
      setIsStreaming(true);
    } else {
      setBreadcrumb([...breadcrumb, node]);
      setCurrentNode(node.key);
      const children = await fetchTreeChildren(node.key);
      setNodes(children);
    }
  };

  const handleBack = async () => {
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
  };

  return (
    <section className="h-full flex-1 min-w-0 bg-transparent flex flex-col p-8 overflow-y-auto no-scrollbar relative pt-0">
      
      {/* Top Breadcrumb and Nav Controls */}
      <div className="flex items-center justify-between mb-8 flex-shrink-0 pt-4">
        <div className="flex items-center gap-4">
          <AnimatePresence>
            {breadcrumb.length > 0 && (
              <motion.button 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, width: 0, overflow: 'hidden' }}
                onClick={handleBack}
                className="flex items-center justify-center p-4 bg-surface-container-high rounded-full hover:bg-surface-variant transition-colors shadow-sm"
              >
                <ArrowLeft size={28} weight="bold" className="text-on-surface" />
              </motion.button>
            )}
          </AnimatePresence>
          
          <div className="flex items-center gap-2 text-xl font-bold font-headline text-on-surface-variant">
            <span className={breadcrumb.length === 0 ? "text-primary" : ""}>Needs</span>
            {breadcrumb.map((b, i) => (
              <React.Fragment key={b.key}>
                <span className="opacity-50">/</span>
                <span className={i === breadcrumb.length - 1 ? "text-primary" : ""}>{b.label}</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        <div className="flex bg-surface-container p-2 rounded-full shadow-inner border border-outline-variant/10">
          <button className="flex items-center justify-center p-3 px-6 bg-primary text-on-primary rounded-full shadow-md font-bold text-sm tracking-wide gap-2">
            <SquaresFour size={20} weight="fill" /> Core
          </button>
          <button className="flex items-center justify-center p-3 px-6 text-on-surface-variant hover:text-on-surface hover:bg-surface-variant/50 rounded-full font-bold text-sm tracking-wide transition-all gap-2">
            <Keyboard size={20} weight="fill" /> Type
          </button>
        </div>
      </div>

      {/* Dynamic Grid */}
      <motion.div 
        key={currentNode || 'root'}
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 gap-6 flex-1 min-h-[400px] pb-8 content-start"
      >
        {nodes.map(node => {
          const Icon = getIconComponent(node.iconName);
          return (
            <motion.button 
              key={node.key}
              variants={itemVariants} 
              whileHover={{ scale: 1.03, y: -4 }} 
              whileTap={{ scale: 0.97 }} 
              onClick={() => handleNodeClick(node)}
              className={`group flex flex-col items-center justify-center p-8 rounded-[2rem] ${node.colorClass} transition-shadow shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:shadow-[0_20px_40px_rgb(0,0,0,0.2)] border-b-[8px] border-black/20 aspect-video md:aspect-auto`}
            >
              <Icon size={72} weight="fill" className="text-white drop-shadow-md group-hover:scale-110 transition-transform mb-4" />
              <span className="text-white font-headline font-black text-2xl tracking-wide opacity-95 drop-shadow-sm text-center px-4 leading-tight">{node.label}</span>
            </motion.button>
          )
        })}
        {nodes.length === 0 && (
          <div className="col-span-full flex items-center justify-center p-12 text-on-surface-variant font-bold">
            No items available in this category.
          </div>
        )}
      </motion.div>

      {/* Sentence Streaming Overlay superimposed over the grid */}
      <AnimatePresence>
        {isStreaming && (
          <SentenceOutput 
            path={streamedPath} 
            onClose={() => setIsStreaming(false)} 
            onSpeak={() => console.log('Playing synthesized audio...')} 
          />
        )}
      </AnimatePresence>
      
    </section>
  );
}
