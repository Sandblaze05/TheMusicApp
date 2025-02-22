import React, { useEffect, useRef, useState } from 'react';

const ScrollingText = ({ text, className }) => {
  const containerRef = useRef(null);
  const textRef = useRef(null);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [animationDuration, setAnimationDuration] = useState(0);

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current && textRef.current) {
        const isOverflowing = textRef.current.offsetWidth > containerRef.current.offsetWidth;
        setShouldScroll(isOverflowing);
        
        // Calculate animation duration based on text length (20px per second)
        if (isOverflowing) {
          const duration = textRef.current.offsetWidth / 20;
          setAnimationDuration(duration);
        }
      }
    };

    checkOverflow();
    // Recheck on window resize
    window.addEventListener('resize', checkOverflow);
    return () => window.removeEventListener('resize', checkOverflow);
  }, [text]);

  return (
    <div ref={containerRef} className="overflow-hidden whitespace-nowrap">
      <div
        ref={textRef}
        className={`inline-block whitespace-nowrap ${className} ${
          shouldScroll
            ? 'animate-marquee hover:animation-play-state-paused'
            : ''
        }`}
        style={
          shouldScroll
            ? {
                animationDuration: `${animationDuration}s`,
                animationTimingFunction: 'linear',
                animationIterationCount: 'infinite',
                animationName: 'marquee'
              }
            : {}
        }
      >
        {text}
        {shouldScroll && (
          <>
            <span className="mx-4">•</span>
            <span>{text}</span>
          </>
        )}
      </div>
    </div>
  );
};

const TrackInfo = ({ currentTrackInfo, currentTrack }) => {
  const trackName = currentTrackInfo?.name || currentTrack || "No Track Selected";
  const artists = currentTrackInfo?.artists?.primary?.map(artist => artist.name).join(", ") || "Unknown Artist";

  return (
    <div className="w-48">
      <ScrollingText
        text={trackName}
        className="text-white text-sm font-semibold"
      />
      <ScrollingText
        text={artists}
        className="text-gray-400 text-xs"
      />
    </div>
  );
};

// Add this to your global styles or as a style tag
const style = document.createElement('style');
style.textContent = `
  @keyframes marquee {
    0% {
      transform: translateX(0);
    }
    100% {
      transform: translateX(-50%);
    }
  }

  .animate-marquee {
    animation: marquee linear infinite;
  }

  .hover\:animation-play-state-paused:hover {
    animation-play-state: paused;
  }
`;
document.head.appendChild(style);

export default TrackInfo;