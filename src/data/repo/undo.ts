import { peekDoc } from '../ydoc';
import { flushProjections } from '../store';
import type { BoxId } from '../types';

/** Session undo/redo per box, backed by Y.UndoManager (only local origins are tracked). */
export function canUndo(boxId: BoxId): boolean {
  return (peekDoc(boxId)?.undo.undoStack.length ?? 0) > 0;
}

export function canRedo(boxId: BoxId): boolean {
  return (peekDoc(boxId)?.undo.redoStack.length ?? 0) > 0;
}

export async function undo(boxId: BoxId): Promise<boolean> {
  const entry = peekDoc(boxId);
  if (!entry || entry.undo.undoStack.length === 0) return false;
  entry.undo.undo();
  await flushProjections(boxId);
  return true;
}

export async function redo(boxId: BoxId): Promise<boolean> {
  const entry = peekDoc(boxId);
  if (!entry || entry.undo.redoStack.length === 0) return false;
  entry.undo.redo();
  await flushProjections(boxId);
  return true;
}

/** Subscribe to stack changes so toolbar buttons can enable/disable. */
export function onUndoChange(boxId: BoxId, cb: () => void): () => void {
  const entry = peekDoc(boxId);
  if (!entry) return () => undefined;
  entry.undo.on('stack-item-added', cb);
  entry.undo.on('stack-item-popped', cb);
  entry.undo.on('stack-cleared', cb);
  return () => {
    entry.undo.off('stack-item-added', cb);
    entry.undo.off('stack-item-popped', cb);
    entry.undo.off('stack-cleared', cb);
  };
}
