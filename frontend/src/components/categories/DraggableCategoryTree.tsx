import React, { useState } from 'react';
import { ChevronRight, Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import type { Category } from '@/types/products.types';

interface CategoryTreeProps {
 categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string, name: string) => void;
  onAddChild: (parent: Category) => void;
 onReorder: (sourceId: string, targetId: string, position: 'before' | 'after' | 'child') => void;
}

interface TreeNode extends Category {
  children: TreeNode[];
}

interface DragItem {
  id: string;
  type: string;
 originalParentId?: string;
}

function buildTree(categories: Category[]): TreeNode[] {
  const categoryMap = new Map<string, TreeNode>();
  const rootCategories: TreeNode[] = [];

  categories.forEach(category => {
    categoryMap.set(category._id, { ...category, children: [] });
  });

  categories.forEach(category => {
    if (category.parent && categoryMap.has(category.parent)) {
      categoryMap.get(category.parent)!.children.push(categoryMap.get(category._id)!);
    } else {
      rootCategories.push(categoryMap.get(category._id)!);
    }
  });

  return rootCategories;
}

const CategoryNode: React.FC<{
  node: TreeNode;
  onEdit: (category: Category) => void;
  onDelete: (id: string, name: string) => void;
  onAddChild: (parent: Category) => void;
  onReorder: (sourceId: string, targetId: string, position: 'before' | 'after' | 'child') => void;
  depth?: number;
}> = ({ node, onEdit, onDelete, onAddChild, onReorder, depth = 0 }) => {
  const [isOpen, setIsOpen] = useState(true);
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
    e.dataTransfer.setData('text/plain', node._id);
    e.dataTransfer.setData('category-type', 'category');
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setIsDraggingOver(true);
  };

  const handleDragLeave = () => {
    setIsDraggingOver(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, position: 'before' | 'after' | 'child') => {
    e.preventDefault();
    setIsDraggingOver(false);
    
    const draggedId = e.dataTransfer.getData('text/plain');
    const type = e.dataTransfer.getData('category-type');
    
    if (type === 'category' && draggedId !== node._id) {
      onReorder(draggedId, node._id, position);
    }
  };

  return (
    <div 
      className="ml-4"
      draggable
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={(e) => handleDrop(e, 'child')}
    >
      <div 
        className={`flex items-center justify-between p-2 rounded-lg hover:bg-gray-100 border-l-2 ${
          isDraggingOver ? 'border-blue-500 bg-blue-50' : 'border-transparent'
        }`}
      >
        <div className="flex items-center">
          <GripVertical className="w-4 h-4 text-gray-400 mr-2 cursor-move" />
          {node.children.length > 0 && (
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-1 rounded-full hover:bg-gray-200"
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
          )}
          <span className="ml-2">{node.icon} {node.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={() => onAddChild(node)} 
            className="p-1 text-gray-500 hover:text-blue-600"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(node)}
            className="p-1 text-gray-500 hover:text-blue-600"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={() => onDelete(node._id, node.name)} 
            className="p-1 text-gray-500 hover:text-red-600"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {isOpen && node.children.length > 0 && (
        <div 
          className="border-l-2 border-gray-20"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, 'child')}
        >
          {node.children.map(child => (
            <CategoryNode 
              key={child._id} 
              node={child} 
              onEdit={onEdit} 
              onDelete={onDelete} 
              onAddChild={onAddChild} 
              onReorder={onReorder}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const DraggableCategoryTree: React.FC<CategoryTreeProps> = ({ 
  categories, 
  onEdit, 
  onDelete, 
  onAddChild, 
  onReorder 
}) => {
  const tree = buildTree(categories);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {tree.map(node => (
        <CategoryNode 
          key={node._id} 
          node={node} 
          onEdit={onEdit} 
          onDelete={onDelete} 
          onAddChild={onAddChild} 
          onReorder={onReorder}
        />
      ))}
    </div>
  );
};

export default DraggableCategoryTree;