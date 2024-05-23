import { useCallback, useRef, MouseEvent } from 'react';

type EventHandler<T = any> = (event: MouseEvent, ...params: T[]) => void;

interface IOptions {
  timeout?: number;
}

export const useDoubleClick = <T = any>(
  doubleClick: EventHandler<T>,
  click?: EventHandler<T>,
  options: IOptions = {},
) => {
  options = {
    timeout: 200,
    ...options,
  };

  const clickTimeout = useRef<NodeJS.Timeout | null>();

  const clearClickTimeout = () => {
    if (clickTimeout.current) {
      clearTimeout(clickTimeout.current);
      clickTimeout.current = null;
    }
  };

  return useCallback(
    (event: MouseEvent, ...params: T[]) => {
      clearClickTimeout();
      if (click && event.detail === 1) {
        clickTimeout.current = setTimeout(() => {
          click(event, ...params);
        }, options.timeout);
      }
      if (event.detail % 2 === 0) {
        doubleClick(event, ...params);
      }
    },
    [click, doubleClick, options.timeout],
  );
};
