import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { ActionCard } from './ActionCard';
import { ActionSearch } from './ActionSearch';
import type { Column as ColumnType, SalesAction } from '../types';

interface ColumnProps {
  column: ColumnType;
  actions: SalesAction[];
  activeId: string | null;
  onAddAction: (action: SalesAction, category: ColumnType['id']) => void;
  onAssigneeChange: (actionId: string, assigneeEmail: string) => void;
  onDeleteAction: (actionId: string) => void;
  onTagsChange: (actionId: string, tags: string[]) => void;
  onDateChange: (actionId: string, date: string) => void;
}

export function Column({ 
  column, 
  actions, 
  activeId, 
  onAddAction, 
  onAssigneeChange,
  onDeleteAction,
  onTagsChange,
  onDateChange
}: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
  });

  return (
    <div 
      className={`flex flex-col bg-gray-50 rounded-lg p-4 min-w-[300px] ${
        isOver ? 'ring-2 ring-blue-400 ring-inset' : ''
      }`}
    >
      <div className="mb-4">
        <h2 
          className="text-lg font-semibold text-gray-900 pb-2 mb-2"
          style={{ borderBottom: `3px solid ${column.color}` }}
        >
          {column.title}
        </h2>
        <p className="text-sm text-gray-600">{column.description}</p>
      </div>
      
      <div ref={setNodeRef} className="flex-1">
        <SortableContext
          items={actions.map(a => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {actions.map((action) => (
            <ActionCard 
              key={action.id} 
              action={action}
              isActive={action.id === activeId}
              columnColor={column.color}
              onAssigneeChange={onAssigneeChange}
              onDelete={onDeleteAction}
              onTagsChange={onTagsChange}
              onDateChange={onDateChange}
            />
          ))}
        </SortableContext>
        
        <ActionSearch 
          onSelect={onAddAction}
          category={column.id}
          existingActions={actions}
        />
      </div>
    </div>
  );
}