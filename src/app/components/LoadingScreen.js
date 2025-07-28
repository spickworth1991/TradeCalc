"use client";
import { useEffect, useState } from "react";

export default function LoadingScreen({
  done = false,
  text = "Loading...",
  bgImage = "/nfl-loading-bg.webp",
  factsArray = [
    "Jerry Rice holds the record for most career touchdowns.",
    "Tom Brady has won 7 Super Bowl titles.",
    "The NFL was founded in 1920 as the APFA.",
    "The 1972 Dolphins had the only perfect season.",
    "The Chiefs have appeared in 6 Super Bowls.",
    "The longest NFL field goal is 66 yards (Justin Tucker).",
    "The NFL draft was first held in 1936.",
    "The Steelers and Patriots both have 6 Super Bowl wins.",
  ],
}) {
  const [progress, setProgress] = useState(0);
  const [factIndex, setFactIndex] = useState(0);

  const estimatedTime = 15000; // ~15 seconds for 95%

  useEffect(() => {
    const intervalTime = estimatedTime / 95;
    let interval;
    let factInterval;

    if (!done) {
      interval = setInterval(() => {
        setProgress((prev) => Math.min(prev + 1, 95));
      }, intervalTime);
    } else {
      setProgress(100);
    }

    factInterval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % factsArray.length);
    }, 3000);

    return () => {
      clearInterval(interval);
      clearInterval(factInterval);
    };
  }, [done]);

  return (
    <div
      className="fixed inset-0 bg-black text-white flex flex-col items-center justify-center z-50 bg-cover bg-center"
      style={{ backgroundImage: `url(${bgImage})` }}
    >
      <div className="bg-black bg-opacity-60 p-6 rounded-lg text-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-4">{text}</h2>
        <p className="text-sm text-gray-300 italic mb-4">{factsArray[factIndex]}</p>

        <div className="relative w-full max-w-md h-16 bg-green-800 border-4 border-white rounded-lg overflow-hidden mx-auto">
          {/* Yard markers */}
          <div className="absolute inset-0 flex justify-between items-center text-white text-[10px] font-bold opacity-30 px-1">
            {[...Array(11)].map((_, i) => (
              <div key={i} className="flex flex-col items-center w-[10%]">
                <div className="w-px h-full bg-white opacity-50" />
                <span>{i * 10}</span>
              </div>
            ))}
          </div>

          {/* Progress overlay */}
          <div
            className="absolute top-0 bottom-0 left-0 transition-all duration-200 ease-out"
            style={{ width: `${progress}%` }}
          />

          {/* Running player icon */}
          <img
            src="/runner.webp"
            alt="Running player"
            className="absolute bottom-0 w-10 h-10 transition-all duration-200"
            style={{ left: `calc(${progress}% - 20px)` }}
          />
        </div>

        <p className="text-xs text-gray-400 mt-2">
          {progress < 100 ? `${Math.round(progress)}%` : "✅ Complete"}
        </p>
      </div>
    </div>
  );
}
