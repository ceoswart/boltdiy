import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AssigneeState, Assignee } from '../types';

export const useAssigneeStore = create<AssigneeState>()(
  persist(
    (set) => ({
      assignees: [],

      addAssignee: (assignee) => set((state) => {
        // Check if assignee with same email already exists in the same company
        const exists = state.assignees.some(a => 
          a.email === assignee.email && 
          a.companyId === assignee.companyId
        );
        if (exists) return state;

        return {
          assignees: [
            ...state.assignees,
            { 
              ...assignee,
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
          ]
        };
      }),

      updateAssignee: (id, assignee) => set((state) => ({
        assignees: state.assignees.map(a => 
          a.id === id ? { ...a, ...assignee } : a
        )
      })),

      removeAssignee: (id) => set((state) => ({
        assignees: state.assignees.filter(a => a.id !== id)
      })),

      importFromCSV: (csvContent: string, companyId: string) => set((state) => {
        const lines = csvContent.split('\n');
        const headers = lines[0].toLowerCase().split(',').map(h => h.trim());
        
        const newAssignees = lines.slice(1)
          .filter(line => line.trim())
          .map(line => {
            const values = line.split(',').map(v => v.trim());
            return {
              firstName: values[headers.indexOf('first name')] || '',
              lastName: values[headers.indexOf('last name')] || '',
              email: values[headers.indexOf('email')] || '',
              imageUrl: values[headers.indexOf('image url')] || undefined,
              companyId
            };
          })
          .filter(assignee => assignee.firstName && assignee.lastName && assignee.email)
          .filter(assignee => !state.assignees.some(a => 
            a.email === assignee.email && 
            a.companyId === companyId
          ));

        return {
          assignees: [
            ...state.assignees,
            ...newAssignees.map(assignee => ({
              ...assignee,
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }))
          ]
        };
      }),

      getAssigneesByCompany: (companyId: string) => {
        return useAssigneeStore.getState().assignees.filter(a => a.companyId === companyId);
      }
    }),
    {
      name: 'assignee-storage',
      version: 1,
    }
  )
);