import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { TagState } from '../types';

export const useTagStore = create<TagState>()(
  persist(
    (set) => ({
      tags: [],

      addTag: (tag) => set((state) => {
        // Validate tag data
        if (!tag.name || !tag.color) {
          console.warn('Invalid tag data:', tag);
          return state;
        }

        // Check for duplicate names
        if (state.tags.some(t => t.name.toLowerCase() === tag.name.toLowerCase())) {
          console.warn('Tag with this name already exists');
          return state;
        }

        return {
          tags: [
            ...state.tags,
            { 
              ...tag,
              id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            }
          ]
        };
      }),

      updateTag: (id, tag) => set((state) => {
        // Validate tag data
        if (tag.name && state.tags.some(t => 
          t.id !== id && t.name.toLowerCase() === tag.name.toLowerCase()
        )) {
          console.warn('Tag with this name already exists');
          return state;
        }

        return {
          tags: state.tags.map(t => 
            t.id === id ? { ...t, ...tag } : t
          )
        };
      }),

      removeTag: (id) => set((state) => ({
        tags: state.tags.filter(t => t.id !== id)
      }))
    }),
    {
      name: 'tag-storage',
      version: 1,
      onRehydrateStorage: () => {
        console.log('Tag store hydrated');
      }
    }
  )
);