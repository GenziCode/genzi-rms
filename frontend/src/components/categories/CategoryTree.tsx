import { useState } from 'react';
import { ChevronRight, Plus, Edit, Trash2, AlertCircle } from 'lucide-react';
import type { Category } from '@/types/products.types';

interface CategoryTreeProps {
  categories: Category[];
  onEdit: (category: Category) => void;
  onDelete: (id: string, name: string) => void;
  onAddChild: (parent: Category) => void;
}

interface TreeNode extends Category {
  children: TreeNode[];
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

function CategoryNode({ node, onEdit, onDelete, onAddChild }: { node: TreeNode; onEdit: (category: Category) => void; onDelete: (id: string, name: string) => void; onAddChild: (parent: Category) => void; }) {
  const [isOpen, setIsOpen] = useState(true);
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleAddChild = () => {
    setLoadingAction('addChild');
    setError(null);
    try {
      onAddChild(node);
    } catch (err) {
      setError('Failed to add child category');
      console.error('Error adding child category:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleEdit = () => {
    setLoadingAction('edit');
    setError(null);
    try {
      onEdit(node);
    } catch (err) {
      setError('Failed to edit category');
      console.error('Error editing category:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleDelete = () => {
    setLoadingAction('delete');
    setError(null);
    try {
      onDelete(node._id, node.name);
    } catch (err) {
      setError('Failed to delete category');
      console.error('Error deleting category:', err);
    } finally {
      setLoadingAction(null);
    }
  };

  return (
    <div className="ml-4">
      <div className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-100">
        <div className="flex items-center">
          {node.children.length > 0 && (
            <button 
              onClick={() => setIsOpen(!isOpen)} 
              className="p-1 rounded-full hover:bg-gray-200 disabled:opacity-50"
              disabled={loadingAction !== null}
            >
              <ChevronRight className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
            </button>
          )}
          <span className="ml-2">{node.icon} {node.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <button 
            onClick={handleAddChild} 
            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
            disabled={loadingAction !== null}
          >
            <Plus className="w-4 h-4" />
          </button>
          <button 
            onClick={handleEdit} 
            className="p-1 text-gray-500 hover:text-blue-600 disabled:opacity-50"
            disabled={loadingAction !== null}
          >
            <Edit className="w-4 h-4" />
          </button>
          <button 
            onClick={handleDelete} 
            className="p-1 text-gray-500 hover:text-red-600 disabled:opacity-50"
            disabled={loadingAction !== null}
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
      {error && (
        <div className="flex items-center text-red-600 text-sm mt-1 ml-6">
          <AlertCircle className="w-4 h-4 mr-1" />
          {error}
        </div>
      )}
      {isOpen && node.children.length > 0 && (
        <div className="border-l-2 border-gray-200">
          {node.children.map(child => (
            <CategoryNode key={child._id} node={child} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoryTree({ categories, onEdit, onDelete, onAddChild }: CategoryTreeProps) {
  const tree = buildTree(categories);

  return (
    <div className="bg-white rounded-lg shadow p-4">
      {tree.map(node => (
        <CategoryNode key={node._id} node={node} onEdit={onEdit} onDelete={onDelete} onAddChild={onAddChild} />
      ))}
    </div>
  );
}
