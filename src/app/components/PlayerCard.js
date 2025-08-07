import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toSlug } from "@/utils/slugify";

export default function PlayerCard({ player, onAdd, onRemove, displayValue }) {
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(displayValue(player));
  const slug = toSlug(player.name || "");

  useEffect(() => {
    const currentValue = displayValue(player);
    if (currentValue !== prevValue.current) {
      setFlash(true);
      prevValue.current = currentValue;
      setTimeout(() => setFlash(false), 500);
    }
  }, [player, displayValue]);

  const avatarSrc = `/avatars/${slug}.webp`;
  const [imgSrc, setImgSrc] = useState(avatarSrc);

  return (
    <div className="bg-gray-900 text-white border border-gray-700 rounded-lg p-3 relative hover:shadow-lg transition group">
      <div
        onClick={() => onAdd?.(player)}
        className="cursor-pointer hover:text-black rounded p-1 transition"
      >
        <Image
          src={imgSrc}
          alt={player.name}
          width={60}
          height={60}
          unoptimized
          className="w-10 h-10 rounded-full object-cover border"
          loading="lazy"
          onError={() => setImgSrc("/avatars/default.webp")}
        />
        <p className="font-semibold mt-1">{player.name}</p>
        <p className="text-xs text-gray-400">
          {player.pos} – {player.team}
        </p>
        <p
          className={`text-right font-semibold mt-1 ${
            flash ? "text-green-400 scale-105" : "text-blue-400"
          } transition-all duration-300`}
        >
          {displayValue(player)}
        </p>
      </div>
      {onRemove && (
        <button
          onClick={() => onRemove(player)}
          className="absolute top-1 right-1 text-red-400 hover:text-red-600 text-sm font-bold"
        >
          ❌
        </button>
      )}
    </div>
  );
}
