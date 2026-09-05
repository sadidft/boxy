import { createContext, useContext } from 'react';
import type { Card } from '@/data/types';

/** Actions provided by the app shell to pages (fill dialog, "new card" binding for global shortcuts). */
export interface ShellActions {
  openFill: (card: Card) => void;
  openFillById: (boxId: string, cardId: string) => void;
  setNewCard: (fn: (() => void) | null) => void;
  newCard: () => void;
}

export const ShellContext = createContext<ShellActions>({
  openFill: () => undefined,
  openFillById: () => undefined,
  setNewCard: () => undefined,
  newCard: () => undefined,
});

export const useShell = () => useContext(ShellContext);
