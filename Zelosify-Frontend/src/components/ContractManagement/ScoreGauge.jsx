"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ScoreGauge({ score = 0, size = "md", showLabel = true }) {
  // score is 0.0 to 1.0 or 0 to 100
  const normalizedScore = score > 1 ? score : Math.round(score * 100);
  
  // Dimensions
  const config = {
    sm: { size: 64, stroke: 6, fontSize: "text-sm", labelSize: "text-[10px]" },
    md: { size: 90, stroke: 8, fontSize: "text-xl", labelSize: "text-xs" },
    lg: { size: 120, stroke: 10, fontSize: "text-3xl", labelSize: "text-sm" },
  }[size] || { size: 90, stroke: 8, fontSize: "text-xl", labelSize: "text-xs" };

  const radius = (config.size - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Determine color scheme
  let color = "#10B981"; // Emerald
  let bgTint = "text-emerald-500/20";
  let strokeColor = "stroke-emerald-500";
  let textColor = "text-emerald-600 dark:text-emerald-400";
  let glowColor = "rgba(16, 185, 129, 0.25)";

  if (normalizedScore < 50) {
    color = "#EF4444"; // Rose
    bgTint = "text-rose-500/20";
    strokeColor = "stroke-rose-500";
    textColor = "text-rose-600 dark:text-rose-400";
    glowColor = "rgba(239, 68, 68, 0.25)";
  } else if (normalizedScore < 75) {
    color = "#F59E0B"; // Amber
    bgTint = "text-amber-500/20";
    strokeColor = "stroke-amber-500";
    textColor = "text-amber-600 dark:text-amber-400";
    glowColor = "rgba(245, 158, 11, 0.25)";
  }

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div
        className="relative flex items-center justify-center rounded-full p-1"
        style={{ filter: `drop-shadow(0 0 8px ${glowColor})` }}
      >
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          {/* Background Track */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke="currentColor"
            strokeWidth={config.stroke}
            fill="transparent"
            className={bgTint}
          />
          {/* Animated Value Arc */}
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke={color}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center Text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-black tracking-tight ${config.fontSize} ${textColor}`}>
            {normalizedScore}%
          </span>
          {showLabel && size !== "sm" && (
            <span className={`font-medium uppercase tracking-wider text-muted-foreground ${config.labelSize}`}>
              Score
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
