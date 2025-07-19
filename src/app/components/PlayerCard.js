import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { toSlug } from "@/utils/slugify";

export default function PlayerCard({ player, onAdd, onRemove }) {
  const [flash, setFlash] = useState(false);
  const prevValue = useRef(player.value);
  const slug = toSlug(player.name || "");

  useEffect(() => {
    if (player.value !== prevValue.current) {
      setFlash(true);
      prevValue.current = player.value;
      setTimeout(() => setFlash(false), 500);
    }
  }, [player.value]);

  const avatarSrc = `/avatars/${slug}.webp`;

  return (
    <div className="bg-white border rounded-lg p-3 relative hover:shadow-md transition group">
      <div
        onClick={() => onAdd?.(player)}
        className="cursor-pointer hover:bg-blue-50 rounded p-1"
      >
        <Image
          src={avatarSrc}
          alt={player.name}
          width={60}
          height={60}
          className="w-10 h-10 rounded-full object-cover"
          loading="lazy"
          onError={(e) => {
            e.currentTarget.src = "/avatars/default.webp";
          }}
        />
        <p className="font-medium">{player.name}</p>
        <p className="text-xs text-gray-500">
          {player.pos} – {player.team}
        </p>
        <p
          className={`text-right font-semibold ${
            flash ? "text-green-600 scale-105" : "text-blue-700"
          } transition-all duration-300`}
        >
          {player.value}
        </p>
      </div>
      {onRemove && (
        <button
          onClick={() => onRemove(player)}
          className="absolute top-1 right-1 text-red-600 text-sm font-bold hover:text-red-800"
        >
          ✖
        </button>
      )}
    </div>
  );
}
