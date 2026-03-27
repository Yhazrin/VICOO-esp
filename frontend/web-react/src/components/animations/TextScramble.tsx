import React, { useState, useEffect, useRef, useCallback, memo } from 'react';

interface TextScrambleProps {
  text: string;
  trigger?: 'onMount' | 'onHover';
  duration?: number;
  characters?: string;
  className?: string;
  as?: React.ElementType;
  reducedMotion?: boolean;
}

const DEFAULT_CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';

export const TextScramble = memo(function TextScramble({
  text,
  trigger = 'onMount',
  duration = 1200,
  characters = DEFAULT_CHARACTERS,
  className,
  as: Component = 'span',
  reducedMotion = false,
}: TextScrambleProps) {
  const [displayedText, setDisplayedText] = useState(
    reducedMotion || trigger !== 'onMount' ? text : ''
  );
  const frameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const hasTriggeredRef = useRef<boolean>(trigger === 'onMount' && !reducedMotion);

  const getRandomCharacter = useCallback(() => {
    return characters.charAt(Math.floor(Math.random() * characters.length));
  }, [characters]);

  const animate = useCallback(() => {
    const currentTime = performance.now();
    const elapsed = currentTime - startTimeRef.current;
    const progress = Math.min(elapsed / duration, 1);

    // Easing function for smoother animation (ease-out)
    const easedProgress = 1 - Math.pow(1 - progress, 3);

    // Calculate how many characters should be revealed
    const revealedCount = Math.floor(easedProgress * text.length);

    let newText = '';
    for (let i = 0; i < text.length; i++) {
      if (i < revealedCount) {
        // Character is revealed
        newText += text.charAt(i);
      } else if (i === revealedCount && progress < 1) {
        // Character is currently being scrambled
        newText += getRandomCharacter();
      } else if (progress >= 1) {
        // Animation complete, show full text
        newText += text.charAt(i);
      } else {
        // Character not yet reached - show random
        newText += getRandomCharacter();
      }
    }

    setDisplayedText(newText);

    if (progress < 1) {
      frameRef.current = requestAnimationFrame(animate);
    } else {
      setDisplayedText(text);
    }
  }, [text, duration, characters, getRandomCharacter]);

  const startAnimation = useCallback(() => {
    if (hasTriggeredRef.current) return;
    hasTriggeredRef.current = true;
    startTimeRef.current = performance.now();
    frameRef.current = requestAnimationFrame(animate);
  }, [animate]);

  const handleMouseEnter = useCallback(() => {
    if (trigger === 'onHover') {
      startAnimation();
    }
  }, [trigger, startAnimation]);

  useEffect(() => {
    if (reducedMotion) return;
    if (trigger === 'onMount' && !hasTriggeredRef.current) {
      hasTriggeredRef.current = true;
      startTimeRef.current = performance.now();
      frameRef.current = requestAnimationFrame(animate);
    }

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [trigger, animate, reducedMotion]);

  const Tag = Component as React.ElementType;

  return (
    <Tag
      className={className}
      aria-label={text}
      onMouseEnter={trigger === 'onHover' ? handleMouseEnter : undefined}
    >
      {displayedText}
      {/* Visually hidden span for screen readers */}
      <span className="sr-only">{text}</span>
    </Tag>
  );
});

export default TextScramble;
