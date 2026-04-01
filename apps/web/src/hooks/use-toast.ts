import * as React from 'react';
import type { ToastProps } from '@/components/ui/toast';

const TOAST_LIMIT = 3;
const TOAST_REMOVE_DELAY = 4000;

type ToasterToast = ToastProps & {
  id: string;
  title?: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactElement;
};

type State = { toasts: ToasterToast[] };

let count = 0;
const genId = () => String(++count);

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(toast: ToasterToast) {
  memoryState = { toasts: [toast, ...memoryState.toasts].slice(0, TOAST_LIMIT) };
  listeners.forEach((l) => l(memoryState));
  setTimeout(() => {
    memoryState = { toasts: memoryState.toasts.filter((t) => t.id !== toast.id) };
    listeners.forEach((l) => l(memoryState));
  }, TOAST_REMOVE_DELAY);
}

export function toast(props: Omit<ToasterToast, 'id'>) {
  dispatch({ id: genId(), ...props });
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);
  React.useEffect(() => {
    listeners.push(setState);
    return () => { const i = listeners.indexOf(setState); if (i > -1) listeners.splice(i, 1); };
  }, []);
  return { ...state, toast };
}
