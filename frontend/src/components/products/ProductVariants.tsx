import { useState } from 'react';
import { Plus, Trash2, Layers } from 'lucide-react';

interface Variant {
  name: string;
  sku: string;
  price: number;
  stock: number;
}

interface ProductVariantsProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
}

export default function ProductVariants({ variants, onChange }: ProductVariantsProps) {
  const addVariant = () => {
    onChange([...variants, { name: '', sku: '', price: 0, stock: 0 }]);
  };

  const removeVariant = (index: number) => {
    onChange(variants.filter((_, i) => i !== index));
  };

  const updateVariant = (index: number, field: keyof Variant, value: any) => {
    const newVariants = [...variants];
    newVariants[index] = { ...newVariants[index], [field]: value };
    onChange(newVariants);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold flex items-center gap-2">
          <Layers className="w-5 h-5" />
          Product Variants
        </h3>
        <button
          type="button"
          onClick={addVariant}
          className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-sm"
        >
          <Plus className="w-4 h-4" />
          Add Variant
        </button>
      </div>

      {variants.length === 0 ? (
        <p className="text-sm text-gray-500 italic">No variants. Click "Add Variant" to create variations.</p>
      ) : (
        <div className="space-y-3">
          {variants.map((variant, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-3">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium text-gray-700">Variant {index + 1}</p>
                <button
                  type="button"
                  onClick={() => removeVariant(index)}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">Name (e.g., Size S, Color Red)</label>
                  <input
                    type="text"
                    value={variant.name}
                    onChange={(e) => updateVariant(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="Small / Red / etc"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">SKU</label>
                  <input
                    type="text"
                    value={variant.sku}
                    onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                    className="w-full px-3 py-2 border rounded text-sm"
                    placeholder="SKU-S"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Price</label>
                  <input
                    type="number"
                    value={variant.price}
                    onChange={(e) => updateVariant(index, 'price', parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded text-sm"
                    step="0.01"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">Stock</label>
                  <input
                    type="number"
                    value={variant.stock}
                    onChange={(e) => updateVariant(index, 'stock', parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-2 border rounded text-sm"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

