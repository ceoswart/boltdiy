import React, { useState, useEffect, useRef } from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { Plus, Users, Save, Copy, Settings } from 'lucide-react';
import { columns, initialActions } from './data';
import { Column } from './components/Column';
import { Setup } from './components/Setup';
import { Login } from './components/Login';
import { useAuthStore } from './store/auth';
import { useActionPathStore } from './store/actionPath';
import { ActionPathManager } from './components/ActionPathManager';
import { AssigneeManager } from './components/AssigneeManager';
import { GanttChart } from './components/GanttChart';
import { PathSettings } from './components/PathSettings';
import { Navbar } from './components/Navbar';
import { CompanyManager } from './components/CompanyManager';
import type { SalesAction, AppConfig, ActionPath } from './types';

function App() {
  const user = useAuthStore(state => state.user);
  const companies = useAuthStore(state => state.companies);
  const logout = useAuthStore(state => state.logout);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [showActionPathModal, setShowActionPathModal] = useState(false);
  const [showAssigneeModal, setShowAssigneeModal] = useState(false);
  const [showPathSettings, setShowPathSettings] = useState(false);
  const [showCompanySettings, setShowCompanySettings] = useState(false);
  const [assigneePoolPosition, setAssigneePoolPosition] = useState({ x: 20, y: 20 });
  const [assigneePoolSize, setAssigneePoolSize] = useState({ width: 800, height: 600 });
  const [isDraggingPool, setIsDraggingPool] = useState(false);
  const [isResizingPool, setIsResizingPool] = useState(false);
  const [resizeDirection, setResizeDirection] = useState<'se' | 'e' | 's' | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const dragStartPos = useRef({ x: 0, y: 0 });
  const poolRef = useRef<HTMLDivElement>(null);
  
  const actionPathConfig = useActionPathStore(state => state.config);
  const updateActionPath = useActionPathStore(state => state.updateActionPath);
  const addActionPath = useActionPathStore(state => state.addActionPath);
  const [selectedActionPath, setSelectedActionPath] = useState<string | null>(null);
  const [actions, setActions] = useState<SalesAction[]>([]);
  const [defaultActions, setDefaultActions] = useState<SalesAction[]>([]);
  const initialActionsRef = useRef<string>('');
  const lastSavedPathRef = useRef<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDraggingPool) {
        setAssigneePoolPosition({
          x: e.clientX - dragStartPos.current.x,
          y: e.clientY - dragStartPos.current.y
        });
      } else if (isResizingPool && resizeDirection) {
        const rect = poolRef.current?.getBoundingClientRect();
        if (!rect) return;

        if (resizeDirection === 'se' || resizeDirection === 'e') {
          setAssigneePoolSize(prev => ({
            ...prev,
            width: Math.max(400, e.clientX - rect.left)
          }));
        }
        if (resizeDirection === 'se' || resizeDirection === 's') {
          setAssigneePoolSize(prev => ({
            ...prev,
            height: Math.max(300, e.clientY - rect.top)
          }));
        }
      }
    };

    const handleMouseUp = () => {
      setIsDraggingPool(false);
      setIsResizingPool(false);
      setResizeDirection(null);
    };

    if (isDraggingPool || isResizingPool) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingPool, isResizingPool, resizeDirection]);

  useEffect(() => {
    if (!user?.email) return;
    
    const userDomain = user.email.split('@')[1];
    
    if (selectedActionPath) {
      const currentPath = actionPathConfig.actionPaths.find(path => path.id === selectedActionPath);
      if (currentPath) {
        setActions(currentPath.actions.map(action => ({
          ...action,
          action_path_id: selectedActionPath
        })));
        initialActionsRef.current = JSON.stringify(currentPath.actions);
      } else {
        setActions([]);
        initialActionsRef.current = '';
      }
    } else {
      const newActions = defaultActions.length > 0 
        ? defaultActions 
        : initialActions.map(action => ({
            ...action,
            account: userDomain,
            action_path_id: null
          }));
      setActions(newActions);
      initialActionsRef.current = JSON.stringify(newActions.map(({ action_path_id, ...rest }) => rest));
    }
    setHasUnsavedChanges(false);
  }, [selectedActionPath, actionPathConfig.actionPaths, user?.email, defaultActions]);

  useEffect(() => {
    if (!actions.length) {
      setHasUnsavedChanges(false);
      return;
    }

    const currentActionsJson = JSON.stringify(
      actions.map(({ action_path_id, ...rest }) => rest)
    );
    
    setHasUnsavedChanges(
      selectedActionPath === lastSavedPathRef.current && 
      currentActionsJson !== initialActionsRef.current
    );
  }, [actions, selectedActionPath]);

  if (!user) {
    return <Login />;
  }

  const userDomain = user.email.split('@')[1];
  const currentActionPath = selectedActionPath 
    ? actionPathConfig.actionPaths.find(path => path.id === selectedActionPath)
    : null;

  const filteredActions = actions.filter(action => {
    const domainMatch = action.account === userDomain;
    if (!currentActionPath) return domainMatch;
    return domainMatch && (!action.action_path_id || action.action_path_id === currentActionPath.id);
  });

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeAction = actions.find(a => a.id === active.id);
    if (!activeAction) return;

    const overColumn = columns.find(c => c.id === over.id);
    if (overColumn) {
      if (activeAction.category === overColumn.id) return;

      setActions(current => {
        return current.map(action => {
          if (action.id === activeAction.id) {
            return {
              ...action,
              category: overColumn.id,
            };
          }
          return action;
        });
      });
      return;
    }

    const overAction = actions.find(a => a.id === over.id);
    if (!overAction || activeAction.category === overAction.category) return;

    setActions(current => {
      return current.map(action => {
        if (action.id === activeAction.id) {
          return {
            ...action,
            category: overAction.category,
          };
        }
        return action;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    
    if (!over) return;

    const activeAction = actions.find(a => a.id === active.id);
    const overAction = actions.find(a => a.id === over.id);

    if (!activeAction || !overAction) return;
    if (activeAction.category !== overAction.category) return;

    const oldIndex = actions.findIndex(a => a.id === active.id);
    const newIndex = actions.findIndex(a => a.id === over.id);

    setActions(arrayMove(actions, oldIndex, newIndex));
  };

  const handleAddAction = (action: SalesAction, category: SalesAction['category']) => {
    const newAction = {
      ...action,
      id: crypto.randomUUID(),
      category,
      targetDate: new Date().toISOString().split('T')[0],
      assignedTo: '',
      account: userDomain,
      action_path_id: selectedActionPath
    };
    setActions(current => [...current, newAction]);
  };

  const handleAssigneeChange = (actionId: string, assigneeEmail: string) => {
    setActions(current =>
      current.map(action =>
        action.id === actionId
          ? { ...action, assignedTo: assigneeEmail }
          : action
      )
    );
  };

  const handleDeleteAction = (actionId: string) => {
    setActions(current => current.filter(action => action.id !== actionId));
  };

  const handleTagsChange = (actionId: string, tags: string[]) => {
    setActions(current =>
      current.map(action =>
        action.id === actionId
          ? { ...action, tags }
          : action
      )
    );
  };

  const handleDateChange = (actionId: string, date: string) => {
    setActions(current =>
      current.map(action =>
        action.id === actionId
          ? { ...action, targetDate: date }
          : action
      )
    );
  };

  const handleSave = async () => {
    try {
      if (selectedActionPath) {
        if (!currentActionPath) return;
        
        const updatedPath = {
          ...currentActionPath,
          actions: actions.map(action => ({
            ...action,
            action_path_id: selectedActionPath
          }))
        };
        
        await updateActionPath(selectedActionPath, updatedPath);
      } else {
        setDefaultActions(actions);
      }
      
      initialActionsRef.current = JSON.stringify(
        actions.map(({ action_path_id, ...rest }) => rest)
      );
      lastSavedPathRef.current = selectedActionPath;
      setHasUnsavedChanges(false);
    } catch (error) {
      console.error('Failed to save actions:', error);
    }
  };

  const handleSaveAsNew = () => {
    if (!currentActionPath) return;
    
    const newPath: ActionPath = {
      id: Date.now().toString(),
      name: `${currentActionPath.name} (Copy)`,
      dealSize: currentActionPath.dealSize,
      territories: currentActionPath.territories,
      products: currentActionPath.products,
      salesCycleDays: currentActionPath.salesCycleDays,
      estimatedValue: currentActionPath.estimatedValue,
      confidenceFactor: currentActionPath.confidenceFactor,
      actions: actions.map(action => ({
        ...action,
        id: crypto.randomUUID(),
        action_path_id: null
      }))
    };
    
    addActionPath(newPath);
    setSelectedActionPath(newPath.id);
    setHasUnsavedChanges(false);
  };

  const handlePathSettingsSave = async (updatedPath: Partial<ActionPath>) => {
    if (!currentActionPath || !selectedActionPath) return;
    
    try {
      await updateActionPath(selectedActionPath, {
        ...currentActionPath,
        ...updatedPath
      });
      setShowPathSettings(false);
    } catch (error) {
      console.error('Failed to update path settings:', error);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar
        userEmail={user.email}
        company={companies.find(c => c.id === user.companyId)!}
        selectedPath={currentActionPath}
        hasUnsavedChanges={hasUnsavedChanges}
        onManageAssignees={() => setShowAssigneeModal(true)}
        onPathChange={(pathId) => {
          if (hasUnsavedChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to switch paths?')) {
              setSelectedActionPath(pathId);
              setHasUnsavedChanges(false);
            }
          } else {
            setSelectedActionPath(pathId);
          }
        }}
        onNewPath={() => setShowActionPathModal(true)}
        onSave={handleSave}
        onSaveAsNew={handleSaveAsNew}
        onPathSettings={() => setShowPathSettings(true)}
        onSignOut={() => {
          if (hasUnsavedChanges) {
            if (window.confirm('You have unsaved changes. Are you sure you want to sign out?')) {
              logout();
            }
          } else {
            logout();
          }
        }}
        actionPaths={actionPathConfig.actionPaths}
      />

      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          <DndContext
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragStart={handleDragStart}
            onDragOver={handleDragOver}
            onDragEnd={handleDragEnd}
          >
            <div className="flex gap-6 overflow-x-auto pb-4">
              {columns.map(column => (
                <Column
                  key={column.id}
                  column={column}
                  actions={filteredActions.filter(action => action.category === column.id)}
                  activeId={activeId}
                  onAddAction={handleAddAction}
                  onAssigneeChange={handleAssigneeChange}
                  onDeleteAction={handleDeleteAction}
                  onTagsChange={handleTagsChange}
                  onDateChange={handleDateChange}
                />
              ))}
            </div>
          </DndContext>

          <div className="mt-8">
            <GanttChart 
              actions={filteredActions} 
              actionPath={currentActionPath}
            />
          </div>
        </div>

        {user.isAdmin && <Setup config={{ companyDomain: userDomain, users: [] }} onSave={() => {}} />}
        
        {showActionPathModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-40">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <ActionPathManager onClose={() => setShowActionPathModal(false)} />
            </div>
          </div>
        )}

        {showAssigneeModal && (
          <div 
            className="fixed inset-0 z-40"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowAssigneeModal(false);
              }
            }}
          >
            <div 
              ref={poolRef}
              className="absolute bg-white rounded-lg shadow-xl overflow-hidden"
              style={{
                left: `${assigneePoolPosition.x}px`,
                top: `${assigneePoolPosition.y}px`,
                width: `${assigneePoolSize.width}px`,
                height: `${assigneePoolSize.height}px`
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-8 bg-gray-100 cursor-move"
                onMouseDown={(e) => {
                  e.preventDefault();
                  setIsDraggingPool(true);
                  dragStartPos.current = {
                    x: e.clientX - assigneePoolPosition.x,
                    y: e.clientY - assigneePoolPosition.y
                  };
                }}
              />

              <div
                className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
                onMouseDown={() => {
                  setIsResizingPool(true);
                  setResizeDirection('se');
                }}
              />
              <div
                className="absolute bottom-0 left-4 right-4 h-2 cursor-s-resize"
                onMouseDown={() => {
                  setIsResizingPool(true);
                  setResizeDirection('s');
                }}
              />
              <div
                className="absolute top-4 right-0 w-2 bottom-4 cursor-e-resize"
                onMouseDown={() => {
                  setIsResizingPool(true);
                  setResizeDirection('e');
                }}
              />

              <AssigneeManager onClose={() => setShowAssigneeModal(false)} />
            </div>
          </div>
        )}

        {showPathSettings && currentActionPath && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <PathSettings
                path={currentActionPath}
                onSave={handlePathSettingsSave}
                onClose={() => setShowPathSettings(false)}
              />
            </div>
          </div>
        )}

        {showCompanySettings && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <CompanyManager onClose={() => setShowCompanySettings(false)} />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;