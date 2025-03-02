import React, { useRef, useState, useEffect } from "react";
import { motion, useTransform, useSpring } from "framer-motion";

const SeekableProgressBar = ({
  progress,
  onSeek,
  currentTime = 0,
  duration = 0,
}) => {
  const [isSeeking, setIsSeeking] = useState(false);
  const [hoverPosition, setHoverPosition] = useState(null);
  const progressBarRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const formatDuration = (s) => {
    const minutes = Math.floor(s / 60);
    const seconds = (s % 60).toFixed(0);
    return `${minutes}:${seconds.padStart(2, "0")}`;
  };

  // Update container width when mounted and on window resize
  useEffect(() => {
    const updateWidth = () => {
      if (progressBarRef.current) {
        setContainerWidth(progressBarRef.current.offsetWidth);
      }
    };

    updateWidth();
    window.addEventListener("resize", updateWidth);
    return () => window.removeEventListener("resize", updateWidth);
  }, []);

  // Create a spring animation for the progress value
  const smoothProgress = useSpring(progress, { damping: 20, stiffness: 100 });

  // Transform the progress percentage to x position
  const timePositionX = useTransform(
    smoothProgress,
    [0, 100],
    [0, containerWidth]
  );

  const handleSeek = (e) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const newProgress = Math.min(
      Math.max((offsetX / rect.width) * 100, 0),
      100
    );

    onSeek(newProgress);
  };

  const handleTouchSeek = (e) => {
    if (!progressBarRef.current) return;

    const rect = progressBarRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const offsetX = touch.clientX - rect.left;
    const newProgress = Math.min(
      Math.max((offsetX / rect.width) * 100, 0),
      100
    );

    onSeek(newProgress);
  };

  const handleMouseMove = (e) => {
    if (!progressBarRef.current) return;

    if (isSeeking) {
      handleSeek(e);
    }

    // Calculate hover position for the duration indicator
    const rect = progressBarRef.current.getBoundingClientRect();
    const offsetX = e.clientX - rect.left;
    const percent = Math.min(Math.max(offsetX / rect.width, 0), 1);

    setHoverPosition({
      x: offsetX,
      percent: percent,
      time: percent * duration,
    });
  };

  const handleMouseLeave = () => {
    setIsSeeking(false);
    setHoverPosition(null);
  };

  return (
    <div
      ref={progressBarRef}
      className="absolute bottom-0 left-1 w-[calc(100%-7px)] h-2 md:h-1 hover:h-3 bg-gray-700 rounded-2xl overflow-visible 
                transition-all duration-500 ease-in-out cursor-pointer touch-none"
      onMouseDown={(e) => {
        setIsSeeking(true);
        handleSeek(e);
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={() => setIsSeeking(false)}
      onMouseLeave={handleMouseLeave}
      onTouchStart={(e) => {
        setIsSeeking(true);
        handleTouchSeek(e);
      }}
      onTouchMove={(e) => {
        if (isSeeking) {
          e.preventDefault();
          handleTouchSeek(e);
        }
      }}
      onTouchEnd={() => setIsSeeking(false)}
      onTouchCancel={() => setIsSeeking(false)}
    >
      {/* Progress fill */}
      <motion.div
        className="h-full bg-blue-400 transition-all relative"
        style={{ width: `${progress}%` }}
      />

      {/* Current time indicator when playing */}
      {!hoverPosition && progress > 0 && (
        <motion.div
          className="absolute right-0 top-0 transform -translate-y-6 bg-transparent text-white text-[10px] md:text-xs py-1 px-2 rounded-md shadow-md"
          style={{ left: '93%' }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          {formatDuration(currentTime)}
        </motion.div>
      )}

      {/* Hover position indicator and time */}
      {hoverPosition && (
        <>
          {/* Vertical hover indicator inside the progress bar */}
          <motion.div
            className="absolute top-0 bottom-0 w-0.5 bg-white/50 pointer-events-none"
            style={{ left: `${hoverPosition.percent * 100}%` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          />

          {/* Time indicator outside the progress bar */}
          <motion.div
            className="absolute top-[-20px] transform -translate-x-1/2 
                 bg-black/80 text-white text-[10px] md:text-xs py-1 px-2 
                 rounded-md shadow-md pointer-events-none whitespace-nowrap z-100"
            style={{
              left: `${hoverPosition.percent * 100}%`,
              minWidth: "35px",
              maxWidth: "50px",
              whiteSpace: "nowrap",
              transform: `translateX(${
                hoverPosition.percent < 0.05
                  ? "25%"
                  : hoverPosition.percent > 0.95
                  ? "-75%"
                  : "-50%"
              })`,
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.1 }}
          >
            {formatDuration(hoverPosition.time)}
          </motion.div>
        </>
      )}
    </div>
  );
};

export default SeekableProgressBar;
