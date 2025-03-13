import React, { useState } from 'react';
import { Plus, X, Edit2, Copy, Save, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useActionPathStore } from '../store/actionPath';
import { useAuthStore } from '../store/auth';
import { supabase } from '../lib/supabase';
import { ActionEditor } from './ActionEditor';
import { ActionCard } from './ActionCard';
import type { ActionPath, DealSize, SalesAction, Territory, Product } from '../types';
import { columns } from '../data';

interface ActionPathManagerProps {
  onClose?: () => void;
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
          Add {type === 'territory' ? 'Territory' : 'Product'}
        </button>
      </div>

      {isAdding && (
        <div className="p-3 bg-gray-50 rounded-md space-y-3">
          <input
            type="text"
            value={newItem.name || ''}
            onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
            placeholder={type === 'territory' ? 'Territory name' : 'Product name'}
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

export function ActionPathManager({ onClose }: ActionPathManagerProps) {
  const user = useAuthStore(state => state.user);
  const config = useActionPathStore(state => state.config);
  const addActionPath = useActionPathStore(state => state.addActionPath);
  const updateActionPath = useActionPathStore(state => state.updateActionPath);
  const removeActionPath = useActionPathStore(state => state.removeActionPath);
  const addTerritory = useActionPathStore(state => state.addTerritory);
  const updateTerritory = useActionPathStore(state => state.updateTerritory);
  const removeTerritory = useActionPathStore(state => state.removeTerritory);
  const addProduct = useActionPathStore(state => state.addProduct);
  const updateProduct = useActionPathStore(state => state.updateProduct);
  const removeProduct = useActionPathStore(state => state.removeProduct);

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingPath, setEditingPath] = useState<Partial<ActionPath>>({
    name: '',
    dealSize: 'SMALL',
    territories: [],
    products: [],
    salesCycleDays: 30,
    estimatedValue: 10000,
    confidenceFactor: 50
  });

  const handleSave = async () => {
    if (!editingPath.name || !user?.companyId) return;
    setIsSaving(true);
    setError(null);

    try {
      const pathData = {
        name: editingPath.name,
        dealSize: editingPath.dealSize,
        salesCycleDays: editingPath.salesCycleDays,
        estimatedValue: editingPath.estimatedValue,
        confidenceFactor: editingPath.confidenceFactor,
        territories: editingPath.territories || [],
        products: editingPath.products || [],
        actions: [],
        companyId: user.companyId
      };

      if (editingPath.id) {
        await updateActionPath(editingPath.id, pathData);
      } else {
        addActionPath({
          ...pathData,
          id: crypto.randomUUID()
        } as ActionPath);
      }

      setIsEditing(false);
      setEditingPath({
        name: '',
        dealSize: 'SMALL',
        territories: [],
        products: [],
        salesCycleDays: 30,
        estimatedValue: 10000,
        confidenceFactor: 50
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save action path');
    } finally {
      setIsSaving(false);
    }
  };

  const handleClone = (path: ActionPath) => {
    setEditingPath({
      ...path,
      id: undefined,
      name: `${path.name} (Copy)`,
    });
    setIsEditing(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  if (!user?.companyId) {
    return (
      <div className="p-6 text-center text-red-600">
        Company context not found
      </div>
    );
  }

  return (
    <div className="bg-white p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Action Paths</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            <Plus size={20} />
            Add Action Path
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-md">
          {error}
        </div>
      )}

      {isEditing && (
        <div className="mb-8 bg-gray-50 p-6 rounded-lg">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">
              {editingPath.id ? 'Edit Action Path' : 'New Action Path'}
            </h3>
            <button
              onClick={() => setIsEditing(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Path Name
              </label>
              <input
                type="text"
                value={editingPath.name}
                onChange={(e) => setEditingPath({ ...editingPath, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                placeholder="Enterprise Sales Process"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Deal Size
              </label>
              <select
                value={editingPath.dealSize}
                onChange={(e) => setEditingPath({ ...editingPath, dealSize: e.target.value as DealSize })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {config.dealSizes.map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estimated Sales Cycle (Days)
              </label>
              <input
                type="number"
                min={1}
                max={365}
                value={editingPath.salesCycleDays}
                onChange={(e) => setEditingPath({ 
                  ...editingPath, 
                  salesCycleDays: Math.max(1, Math.min(365, parseInt(e.target.value) || 30))
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                  min={0}
                  step={1000}
                  value={editingPath.estimatedValue}
                  onChange={(e) => setEditingPath({ 
                    ...editingPath, 
                    estimatedValue: Math.max(0, parseInt(e.target.value) || 0)
                  })}
                  className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-md"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confidence Factor (%)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={editingPath.confidenceFactor}
                  onChange={(e) => setEditingPath({ 
                    ...editingPath, 
                    confidenceFactor: Math.max(0, Math.min(100, parseInt(e.target.value) || 50))
                  })}
                  className="w-full pr-8 pl-3 py-2 border border-gray-300 rounded-md"
                />
                <span className="absolute right-3 top-2 text-gray-500">%</span>
              </div>
            </div>

            <div>
              <EditableList<Territory>
                items={config.territories}
                selectedIds={editingPath.territories || []}
                onSelect={(ids) => setEditingPath({ ...editingPath, territories: ids })}
                onAdd={(territory) => addTerritory({ 
                  id: crypto.randomUUID(),
                  ...territory
                })}
                onEdit={updateTerritory}
                onDelete={removeTerritory}
                type="territory"
                companyId={user.companyId}
              />
            </div>

            <div>
              <EditableList<Product>
                items={config.products}
                selectedIds={editingPath.products || []}
                onSelect={(ids) => setEditingPath({ ...editingPath, products: ids })}
                onAdd={(product) => addProduct({ 
                  id: crypto.randomUUID(),
                  ...product
                })}
                onEdit={updateProduct}
                onDelete={removeProduct}
                type="product"
                companyId={user.companyId}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => {
                setEditingPath({
                  name: '',
                  dealSize: 'SMALL',
                  territories: [],
                  products: [],
                  salesCycleDays: 30,
                  estimatedValue: 10000,
                  confidenceFactor: 50
                });
                setIsEditing(false);
              }}
              className="px-4 py-2 text-gray-700 hover:text-gray-900"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={16} />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {config.actionPaths.map(path => (
          <div
            key={path.id}
            className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
          >
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-medium text-gray-900">{path.name}</h3>
                <p className="text-sm text-gray-500">Deal Size: {path.dealSize}</p>
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-600">
                    Sales Cycle: {path.salesCycleDays} days
                  </p>
                  <p className="text-sm text-gray-600">
                    Est. Value: {formatCurrency(path.estimatedValue)}
                  </p>
                  <p className="text-sm text-gray-600">
                    Confidence: {path.confidenceFactor}%
                  </p>
                  <p className="text-xs text-gray-500">
                    {path.territories.length} territories, {path.products.length} products
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleClone(path)}
                  className="text-blue-500 hover:text-blue-600"
                  title="Clone path"
                >
                  <Copy size={16} />
                </button>
                <button
                  onClick={() => {
                    setEditingPath(path);
                    setIsEditing(true);
                  }}
                  className="text-blue-500 hover:text-blue-600"
                  title="Edit path"
                >
                  <Edit2 size={16} />
                </button>
                <button
                  onClick={() => removeActionPath(path.id)}
                  className="text-red-500 hover:text-red-600"
                  title="Delete path"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}