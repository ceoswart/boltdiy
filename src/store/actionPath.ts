import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ActionPathState, ActionPath, Territory, Product, SalesAction } from '../types';
import { defaultActionPathConfig, initialActions } from '../data';

export const useActionPathStore = create<ActionPathState>()(
  persist(
    (set, get) => ({
      config: defaultActionPathConfig,
      defaultPath: {
        id: 'default',
        name: 'Default Action Path',
        dealSize: 'ENTERPRISE',
        territories: [],
        products: [],
        salesCycleDays: 30,
        estimatedValue: 10000,
        confidenceFactor: 50,
        actions: initialActions.map(action => ({
          ...action,
          isDefault: true,
          companyId: 'c81d4e2e-bcf2-11e6-869b-7df92533d2db'
        })),
        companyId: 'c81d4e2e-bcf2-11e6-869b-7df92533d2db',
        isDefault: true
      },

      addTerritory: (territory) => set((state) => ({
        config: {
          ...state.config,
          territories: [...state.config.territories, territory]
        }
      })),

      updateTerritory: (id, territory) => set((state) => ({
        config: {
          ...state.config,
          territories: state.config.territories.map(t => 
            t.id === id ? { ...t, ...territory } : t
          )
        }
      })),

      removeTerritory: (id) => set((state) => ({
        config: {
          ...state.config,
          territories: state.config.territories.filter(t => t.id !== id),
          actionPaths: state.config.actionPaths.map(path => ({
            ...path,
            territories: path.territories.filter(t => t !== id)
          }))
        }
      })),

      addProduct: (product) => set((state) => ({
        config: {
          ...state.config,
          products: [...state.config.products, product]
        }
      })),

      updateProduct: (id, product) => set((state) => ({
        config: {
          ...state.config,
          products: state.config.products.map(p => 
            p.id === id ? { ...p, ...product } : p
          )
        }
      })),

      removeProduct: (id) => set((state) => ({
        config: {
          ...state.config,
          products: state.config.products.filter(p => p.id !== id),
          actionPaths: state.config.actionPaths.map(path => ({
            ...path,
            products: path.products.filter(p => p !== id)
          }))
        }
      })),

      addActionPath: (path) => set((state) => ({
        config: {
          ...state.config,
          actionPaths: [...state.config.actionPaths, path]
        }
      })),

      updateActionPath: async (id, path) => {
        if (id === 'default') {
          set((state) => ({
            defaultPath: {
              ...state.defaultPath!,
              ...path
            }
          }));
          return;
        }

        set((state) => ({
          config: {
            ...state.config,
            actionPaths: state.config.actionPaths.map(p => 
              p.id === id ? { ...p, ...path } : p
            )
          }
        }));
      },

      removeActionPath: async (id) => {
        if (id === 'default') {
          throw new Error('Cannot remove default action path');
        }

        set((state) => ({
          config: {
            ...state.config,
            actionPaths: state.config.actionPaths.filter(p => p.id !== id)
          }
        }));
      },

      updateDefaultActionPath: (actions) => set((state) => ({
        defaultPath: state.defaultPath ? {
          ...state.defaultPath,
          actions: actions.map(action => ({
            ...action,
            isDefault: true,
            companyId: 'c81d4e2e-bcf2-11e6-869b-7df92533d2db'
          }))
        } : null
      })),

      getActionPathsByCompany: (companyId) => {
        const state = get();
        const paths = state.config.actionPaths.filter(p => p.companyId === companyId);
        
        if (companyId === 'c81d4e2e-bcf2-11e6-869b-7df92533d2db' && state.defaultPath) {
          return [state.defaultPath, ...paths];
        }
        
        return paths;
      }
    }),
    {
      name: 'action-path-storage',
      version: 1,
    }
  )
);