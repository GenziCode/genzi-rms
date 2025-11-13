import { useState } from 'react';
import { ChevronRight, ChevronDown, FolderOpen, Folder, Edit, Trash2, Plus } from 'lucide-react';
import type { Category } from '@/types/products.types';

interface CategoryTreeProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string, name: string) => void;
  onAddChild: (parent: Category) => void;
}

interface CategoryNode extends Category {
  children: CategoryNode[];
  level: number;
}

function buildTree(categories: Category[]): CategoryNode[] {
  const categoryMap = new Map<string, CategoryNode>();
  const rootCategories: CategoryNode[] = [];

  // First pass: create nodes
  categories.forEach((cat) => {
    categoryMap.set(cat._id, { ...cat, children: [], level: 0 });
  });

  // Second pass: build tree
  categories.forEach((cat) => {
    const node = categoryMap.get(cat._id)!;
    if (cat.parent) {
      const parentNode = categoryMap.get(cat.parent);
      if (parentNode) {
        node.level = parentNode.level + 1;
        parentNode.children.push(node);
      } else {
        rootCategories.push(node);
      }
    } else {
      rootCategories.push(node);
    }
  });

  // Sort by sortOrder
  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder);
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(rootCategories);

  return rootCategories;
}

function CategoryTreeNode({
  node,
  onEdit,
  onDelete,
  onAddChild,
}: {
  node: CategoryNode;
  onEdit: (category: Category) => void;
  onDelete: (id: string, name: string) => void;
  onAddChild: (parent: Category) => void;
}) {
  const [isExpanded, setIsExpanded] = useState(true);
  const hasChildren = node.children.length > 0;

  return (
    <div className={`ml-${node.level * 6}`}>
      <div
        className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group transition"
        style={{ paddingLeft: `${node.level * 24 + 12}px` }}
      >
        <div className="flex items-center flex-1">
          {hasChildren ? (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="mr-2 p-1 hover:bg-gray-200 rounded"
            >
              {isExpanded ? (
                <ChevronDown className="w-4 h-4 text-gray-600" />
              ) : (
                <ChevronRight className="w-4 h-4 text-gray-600" />
              )}
            </button>
          ) : (
            <div className="w-6 mr-2" />
          )}

          <div
            className="w-8 h-8 rounded flex items-center justify-center mr-3 text-lg"
            style={{ backgroundColor: node.color ? node.color + '30' : '#E5E7EB' }}
          >
            {node.icon || (hasChildren ? <Folder className="w-4 h-4" /> : <FolderOpen className="w-4 h-4" />)}
          </div>

          <div className="flex-1">
            <div className="flex items-center space-x-2">
              <span className="font-medium text-gray-900">{node.name}</span>
              <span className="text-xs text-gray-500">
                ({node.children.length} sub)
              </span>
            </div>
            {node.description && (
              <p className="text-sm text-gray-500 mt-1">{node.description}</p>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition">
          <button
            onClick={() => onAddChild(node)}
            className="p-2 text-green-600 hover:bg-green-50 rounded transition"
            title="Add sub-category"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => onEdit(node)}
            className="p-2 text-blue-600 hover:bg-blue-50 rounded transition"
            title="Edit"
          >
            <Edit className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(node._id, node.name)}
            className="p-2 text-red-600 hover:bg-red-50 rounded transition"
            title="Delete"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div>
          {node.children.map((child) => (
            <CategoryTreeNode
              key={child._id}
              node={child}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function CategoryTree({ categories, onEdit, onDelete, onAddChild }: CategoryTreeProps) {
  const tree = buildTree(categories);

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900">Category Hierarchy</h3>
        <p className="text-sm text-gray-600 mt-1">
          {categories.length} total categories
        </p>
      </div>
      <div className="p-2">
        {tree.map((node) => (
          <CategoryTreeNode
            key={node._id}
            node={node}
            onEdit={onEdit}
            onDelete={onDelete}
            onAddChild={onAddChild}
          />
        ))}
      </div>
    </div>
  );
}

export default CategoryTree;

