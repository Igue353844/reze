import { useEffect, useCallback } from 'react';

type Direction = 'up' | 'down' | 'left' | 'right';

interface UseTVNavigationOptions {
  onSelect?: () => void;
  onBack?: () => void;
}

export function useTVNavigation(options: UseTVNavigationOptions = {}) {
  const { onSelect, onBack } = options;

  const getFocusableElements = useCallback((): HTMLElement[] => {
    const selectors = [
      'button:not([disabled])',
      'a[href]',
      'input:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[data-focusable="true"]'
    ].join(', ');
    
    return Array.from(document.querySelectorAll<HTMLElement>(selectors))
      .filter(el => {
        const style = window.getComputedStyle(el);
        return style.display !== 'none' && 
               style.visibility !== 'hidden' && 
               el.offsetParent !== null;
      });
  }, []);

  const getCurrentIndex = useCallback((elements: HTMLElement[]): number => {
    const activeElement = document.activeElement as HTMLElement;
    return elements.indexOf(activeElement);
  }, []);

  const navigateInDirection = useCallback((direction: Direction) => {
    const elements = getFocusableElements();
    if (elements.length === 0) return;

    const currentIndex = getCurrentIndex(elements);
    const currentElement = elements[currentIndex] || document.activeElement as HTMLElement;
    const currentRect = currentElement?.getBoundingClientRect();

    if (!currentRect) {
      elements[0]?.focus();
      return;
    }

    let bestCandidate: HTMLElement | null = null;
    let bestScore = Infinity;

    elements.forEach((el, index) => {
      if (index === currentIndex) return;
      
      const rect = el.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const currentCenterX = currentRect.left + currentRect.width / 2;
      const currentCenterY = currentRect.top + currentRect.height / 2;

      let isValidDirection = false;
      let distance = Infinity;

      switch (direction) {
        case 'up':
          isValidDirection = centerY < currentCenterY - 10;
          distance = Math.abs(centerX - currentCenterX) + (currentCenterY - centerY) * 0.5;
          break;
        case 'down':
          isValidDirection = centerY > currentCenterY + 10;
          distance = Math.abs(centerX - currentCenterX) + (centerY - currentCenterY) * 0.5;
          break;
        case 'left':
          isValidDirection = centerX < currentCenterX - 10;
          distance = Math.abs(centerY - currentCenterY) + (currentCenterX - centerX) * 0.5;
          break;
        case 'right':
          isValidDirection = centerX > currentCenterX + 10;
          distance = Math.abs(centerY - currentCenterY) + (centerX - currentCenterX) * 0.5;
          break;
      }

      if (isValidDirection && distance < bestScore) {
        bestScore = distance;
        bestCandidate = el;
      }
    });

    if (bestCandidate) {
      bestCandidate.focus();
      bestCandidate.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [getFocusableElements, getCurrentIndex]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowUp':
          e.preventDefault();
          navigateInDirection('up');
          break;
        case 'ArrowDown':
          e.preventDefault();
          navigateInDirection('down');
          break;
        case 'ArrowLeft':
          e.preventDefault();
          navigateInDirection('left');
          break;
        case 'ArrowRight':
          e.preventDefault();
          navigateInDirection('right');
          break;
        case 'Enter':
        case ' ':
          if (document.activeElement instanceof HTMLElement) {
            e.preventDefault();
            document.activeElement.click();
            onSelect?.();
          }
          break;
        case 'Escape':
        case 'Backspace':
          onBack?.();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigateInDirection, onSelect, onBack]);

  // Auto-focus first element on mount
  useEffect(() => {
    const elements = getFocusableElements();
    if (elements.length > 0 && !document.activeElement?.closest('[data-focusable]')) {
      setTimeout(() => elements[0]?.focus(), 100);
    }
  }, [getFocusableElements]);

  return { navigateInDirection, getFocusableElements };
}
