import { useRef, useEffect, useState, useCallback } from 'react';

interface UseSwipeTabsOptions {
  tabs: string[];
  activeTab: string;
  onTabChange: (newTab: string) => void;
  enabled?: boolean;
  minSwipeDistance?: number;
  maxVerticalRatio?: number;
}

export function useSwipeTabs({
  tabs,
  activeTab,
  onTabChange,
  enabled = true,
  minSwipeDistance = 50,
  maxVerticalRatio = 0.65,
}: UseSwipeTabsOptions) {
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const isSwipingRef = useRef(false);
  const [swipeFeedback, setSwipeFeedback] = useState<{
    direction: 'left' | 'right';
    targetTab: string;
  } | null>(null);

  // Clear feedback after brief transition
  useEffect(() => {
    if (swipeFeedback) {
      const timer = setTimeout(() => {
        setSwipeFeedback(null);
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [swipeFeedback]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!enabled) return;

      const target = e.target as HTMLElement | null;
      // Do not trigger swipe on inputs, textareas, buttons, horizontal sliders/carousels, or interactive controls
      if (target) {
        const interactiveTag = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'].includes(target.tagName);
        const insideScrollable = target.closest(
          '[data-no-swipe], .overflow-x-auto, input, textarea, select, button, [role="slider"], [role="dialog"]'
        );
        if (interactiveTag || insideScrollable) {
          touchStartRef.current = null;
          return;
        }
      }

      if (e.touches && e.touches.length === 1) {
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          time: Date.now(),
        };
        isSwipingRef.current = false;
      }
    },
    [enabled]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!enabled || !touchStartRef.current) return;
      if (!e.touches || e.touches.length !== 1) return;

      const currentX = e.touches[0].clientX;
      const currentY = e.touches[0].clientY;
      const diffX = currentX - touchStartRef.current.x;
      const diffY = currentY - touchStartRef.current.y;

      // If predominantly horizontal and exceeds threshold, mark as swiping
      if (Math.abs(diffX) > 20 && Math.abs(diffY) / Math.abs(diffX) < maxVerticalRatio) {
        isSwipingRef.current = true;
      }
    },
    [enabled, maxVerticalRatio]
  );

  const onTouchEnd = useCallback(
    (e: React.TouchEvent | TouchEvent) => {
      if (!enabled || !touchStartRef.current) {
        touchStartRef.current = null;
        isSwipingRef.current = false;
        return;
      }

      const touch = (e.changedTouches && e.changedTouches[0]) || null;
      if (!touch) {
        touchStartRef.current = null;
        return;
      }

      const diffX = touch.clientX - touchStartRef.current.x;
      const diffY = touch.clientY - touchStartRef.current.y;
      const duration = Date.now() - touchStartRef.current.time;

      const isHorizontal = Math.abs(diffX) >= minSwipeDistance && Math.abs(diffY) / Math.abs(diffX) < maxVerticalRatio;
      const isQuickFlick = duration < 500 && Math.abs(diffX) >= minSwipeDistance;

      if (isHorizontal && isQuickFlick) {
        const currentIndex = tabs.indexOf(activeTab);
        if (currentIndex !== -1) {
          if (diffX < 0 && currentIndex < tabs.length - 1) {
            // Swiped Left -> Go to Next Tab
            const nextTab = tabs[currentIndex + 1];
            setSwipeFeedback({ direction: 'left', targetTab: nextTab });
            onTabChange(nextTab);
          } else if (diffX > 0 && currentIndex > 0) {
            // Swiped Right -> Go to Previous Tab
            const prevTab = tabs[currentIndex - 1];
            setSwipeFeedback({ direction: 'right', targetTab: prevTab });
            onTabChange(prevTab);
          }
        }
      }

      touchStartRef.current = null;
      isSwipingRef.current = false;
    },
    [activeTab, enabled, maxVerticalRatio, minSwipeDistance, onTabChange, tabs]
  );

  return {
    touchHandlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
    },
    swipeFeedback,
  };
}
