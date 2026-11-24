"use client";

import React from "react";
import { motion } from "framer-motion";

export default function ScoreGauge({ score = 0, size = "md", showLabel = true }) {
  const normalizedScore = score > 1 ? score : Math.round(score * 100);

  const config = {
    sm: { size: 68, stroke: 6, fontSize: "text-sm", labelSize: "text-[9px]" },
    md: { size: 96, stroke: 7, fontSize: "text-2xl", labelSize: "text-[10px]" },
    lg: { size: 128, stroke: 9, fontSize: "text-3xl", labelSize: "text-xs" },
  }[size] || { size: 96, stroke: 7, fontSize: "text-2xl", labelSize: "text-[10px]" };

  const radius = (config.size - config.stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  // Zelosify Brand Palette
  let strokeColor = "#00d294"; // Zelosify Emerald
  let glowColor = "rgba(0, 210, 148, 0.4)";
  let textColor = "text-[#00d294]";
  let trackColor = "rgba(0, 210, 148, 0.12)";

  if (normalizedScore < 50) {
    strokeColor = "#fb2c36"; // Zelosify Red
    glowColor = "rgba(251, 44, 54, 0.4)";
    textColor = "text-[#fb2c36]";
    trackColor = "rgba(251, 44, 54, 0.12)";
  } else if (normalizedScore < 75) {
    strokeColor = "#f99c00"; // Zelosify Amber
    glowColor = "rgba(249, 156, 0, 0.4)";
    textColor = "text-[#f99c00]";
    trackColor = "rgba(249, 156, 0, 0.12)";
  }

  return (
    <div className="flex flex-col items-center justify-center relative select-none">
      <div
        className="relative flex items-center justify-center rounded-full p-1"
        style={{ filter: `drop-shadow(0 0 12px ${glowColor})` }}
      >
        <svg
          width={config.size}
          height={config.size}
          className="transform -rotate-90"
        >
          {/* Subtle Outer Ring Guide */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius + 3}
            stroke="rgba(255, 255, 255, 0.05)"
            strokeWidth={1}
            strokeDasharray="2 3"
            fill="transparent"
          />

          {/* Background Track */}
          <circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke={trackColor}
            strokeWidth={config.stroke}
            fill="transparent"
          />

          {/* Animated Glowing Value Arc */}
          <motion.circle
            cx={config.size / 2}
            cy={config.size / 2}
            r={radius}
            stroke={strokeColor}
            strokeWidth={config.stroke}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>

        {/* Center High-Contrast Value */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className={`font-mono font-black tracking-tight tabular-nums ${config.fontSize} ${textColor}`}>
            {normalizedScore}%
          </span>
          {showLabel && size !== "sm" && (
            <span className={`font-semibold uppercase tracking-[0.15em] text-zinc-400 ${config.labelSize}`}>
              Match
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
