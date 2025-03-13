import React, { useState } from 'react';
import { X, Save, Plus, Edit2, Trash2 } from 'lucide-react';
import type { ActionPath, Territory, Product } from '../types';
import { useActionPathStore } from '../store/actionPath';
import { useAuthStore } from '../store/auth';

interface PathSettingsProps {
  path: ActionPath;
  onSave: (path: Partial<ActionPath>) => void;
  onClose: () => void;
}

interface EditableListProps<T extends Territory | Product> {
  items: T[];
  selectedIds: string[];
  onSelect: (ids: string[]) => void;
  onAdd: (item: Omit<T, 'id'>) => void;
  onEdit: (id: string, item: Partial<T>) => void;
  onDelete: (id: string) => void;
  type: 'territory' | 'product';
  companyId: string;
}

function EditableList<T extends Territory | Product>({ 
  items, 
  selectedIds, 
  onSelect, 
  onAdd, 
  onEdit, 
  onDelete,
  type,
  companyId
}: EditableListProps<T>) {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<Partial<T>>({});

  // Filter items by company
  const companyItems = items.filter(item => !item.companyId || item.companyId === companyId);

  const handleAdd = () => {
    if (type === 'territory' && !newItem.name) return;
    if (type === 'product' && (!newItem.name || !newItem.description)) return;

    onAdd({
      ...newItem,
      companyId
    } as Omit<T, 'id'>);
    setNewItem({});
    setIsAdding(false);
  };

  const handleEdit = (id: string) => {
    if (type === 'territory' && !newItem.name) return;
    if (type === 'product' && (!newItem.name || !newItem.description)) return;

    onEdit(id, {
      ...newItem,
      companyId
    });
    setNewItem({});
    setEditingId(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium text-gray-700">
          {type === 'territory' ? 'Territories' : 'Products/Solutions'}
        </h3>
        <button
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
        >
          <Plus size={16} />
          Add {type === 'territory' ? 'Territory' : 'Item'}
        </button>
      </div>

      {isAdding && (
        <div className="p-3 bg-gray-50 rounded-md space-y-3">
          <input
            type="text"
            value={newItem.name || ''}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder={type === 'territory' ? 'Territory name' : 'Name'}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          {type === 'territory' && (
            <input
              type="text"
              value={(newItem as Partial<Territory>).regions?.join(', ') || ''}
              onChange={(e) => setNewItem({ 
                ...newItem, 
                regions: e.target.value.split(',').map(r => r.trim()) 
              })}
              placeholder="Regions (comma-separated)"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          )}
          {type === 'product' && (
            <input
              type="text"
              value={(newItem as Partial<Product>).description || ''}
              onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
              placeholder="Description"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          )}
          <div className="flex justify-end gap-2">
            <button
              onClick={() => {
                setNewItem({});
                setIsAdding(false);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              className="px-3 py-1 text-sm bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              Add
            </button>
          </div>
        </div>
      )}

      <div className="space-y-2 max-h-48 overflow-y-auto border border-gray-200 rounded-md p-3">
        {companyItems.map(item => (
          <div key={item.id} className="flex items-start gap-2">
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={(e) => {
                const ids = e.target.checked
                  ? [...selectedIds, item.id]
                  : selectedIds.filter(id => id !== item.id);
                onSelect(ids);
              }}
              className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            {editingId === item.id ? (
              <div className="flex-1 space-y-2">
                <input
                  type="text"
                  value={newItem.name || item.name}
                  onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                  className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                />
                {type === 'territory' && (
                  <input
                    type="text"
                    value={
                      (newItem as Partial<Territory>).regions?.join(', ') || 
                      (item as Territory).regions.join(', ')
                    }
                    onChange={(e) => setNewItem({ 
                      ...newItem, 
                      regions: e.target.value.split(',').map(r => r.trim()) 
                    })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                )}
                {type === 'product' && (
                  <input
                    type="text"
                    value={
                      (newItem as Partial<Product>).description || 
                      (item as Product).description
                    }
                    onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                    className="w-full px-2 py-1 border border-gray-300 rounded-md text-sm"
                  />
                )}
                <div className="flex justify-end gap-2">
                  <button
                    onClick={() => {
                      setNewItem({});
                      setEditingId(null);
                    }}
                    className="px-2 py-1 text-xs text-gray-600 hover:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleEdit(item.id)}
                    className="px-2 py-1 text-xs bg-blue-500 text-white rounded-md hover:bg-blue-600"
                  >
                    Save
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="font-medium text-sm">{item.name}</div>
                    {type === 'territory' && (
                      <div className="text-xs text-gray-500">
                        {(item as Territory).regions.join(', ')}
                      </div>
                    )}
                    {type === 'product' && (
                      <div className="text-xs text-gray-500">
                        {(item as Product).description}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => {
                        setNewItem({
                          name: item.name,
                          ...(type === 'territory' 
                            ? { regions: (item as Territory).regions }
                            : { description: (item as Product).description }
                          )
                        });
                        setEditingId(item.id);
                      }}
                      className="p-1 text-gray-400 hover:text-blue-600"
                    >
                      <Edit2 size={14} />
                    </button>
                    {item.companyId === companyId && (
                      <button
                        onClick={() => onDelete(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export function PathSettings({ path, onSave, onClose }: PathSettingsProps) {
  const user = useAuthStore(state => state.user);
  const {
    config: { territories, products },
    addTerritory,
    removeTerritory,
    addProduct,
    removeProduct
  } = useActionPathStore();

  const [formData, setFormData] = useState({
    name: path.name,
    dealSize: path.dealSize,
    territories: path.territories,
    products: path.products,
    salesCycleDays: path.salesCycleDays ?? 30,
    estimatedValue: path.estimatedValue ?? 10000,
    confidenceFactor: path.confidenceFactor ?? 50,
    companyId: user?.companyId || path.companyId
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  if (!user?.companyId) {
    return (
      <div className="p-6 text-center text-red-600">
        Company context not found
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 sticky top-0 bg-white pb-4 border-b">
        <h2 className="text-xl font-semibold text-gray-900">
          Path Settings: {path.name}
        </h2>
        <button 
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-1 hover:bg-gray-100 rounded-full"
        >
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Path Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Deal Size
            </label>
            <select
              value={formData.dealSize}
              onChange={(e) => setFormData({ ...formData, dealSize: e.target.value as ActionPath['dealSize'] })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="SMALL">Small</option>
              <option value="MEDIUM">Medium</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Sales Cycle (Days)
            </label>
            <input
              type="number"
              min="1"
              max="365"
              value={formData.salesCycleDays}
              onChange={(e) => setFormData({ 
                ...formData, 
                salesCycleDays: Math.max(1, Math.min(365, parseInt(e.target.value) || 30))
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estimated Deal Value
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2 text-gray-500">$</span>
              <input
                type="number"
                min="0"
                step="1000"
                value={formData.estimatedValue}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  estimatedValue: Math.max(0, parseInt(e.target.value) || 0)
                })}
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Confidence Factor
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                max="100"
                value={formData.confidenceFactor}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  confidenceFactor: Math.max(0, Math.min(100, parseInt(e.target.value) || 50))
                })}
                className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <span className="absolute right-3 top-2 text-gray-500">%</span>
            </div>
          </div>

          <div className="col-span-2">
            <EditableList<Territory>
              items={territories}
              selectedIds={formData.territories}
              onSelect={(ids) => setFormData({ ...formData, territories: ids })}
              onAdd={(territory) => addTerritory({ 
                id: crypto.randomUUID(),
                ...territory
              })}
              onEdit={(id, territory) => {
                const updatedTerritories = territories.map(t =>
                  t.id === id ? { ...t, ...territory } : t
                );
                useActionPathStore.setState(state => ({
                  config: {
                    ...state.config,
                    territories: updatedTerritories
                  }
                }));
              }}
              onDelete={removeTerritory}
              type="territory"
              companyId={user.companyId}
            />
          </div>

          <div className="col-span-2">
            <EditableList<Product>
              items={products}
              selectedIds={formData.products}
              onSelect={(ids) => setFormData({ ...formData, products: ids })}
              onAdd={(product) => addProduct({ 
                id: crypto.randomUUID(),
                ...product
              })}
              onEdit={(id, product) => {
                const updatedProducts = products.map(p =>
                  p.id === id ? { ...p, ...product } : p
                );
                useActionPathStore.setState(state => ({
                  config: {
                    ...state.config,
                    products: updatedProducts
                  }
                }));
              }}
              onDelete={removeProduct}
              type="product"
              companyId={user.companyId}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t mt-8">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-900 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Save size={16} />
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
}