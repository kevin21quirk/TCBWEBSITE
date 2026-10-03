"use client";

import { useEffect, useState } from "react";

const words = ["PERFECT", "TRUSTED", "LEADING"];
const IN_MS = 3200; // word fully visible time before blinds close
const OUT_MS = 550; // blinds close duration

export default function RotatingWord() {
  const [index, setIndex] = useState(0);
  const [phase, setPhase] = useState<"in" | "out">("in");

  useEffect(() => {
    const t = setTimeout(
      () => {
        if (phase === "in") {
          setPhase("out");
        } else {
          setIndex((i) => (i + 1) % words.length);
          setPhase("in");
        }
      },
      phase === "in" ? IN_MS : OUT_MS
    );
    return () => clearTimeout(t);
  }, [phase, index]);

  const word = words[index];

  return (
    <span className="inline-block whitespace-nowrap [perspective:700px]">
      {word.split("").map((ch, i) => (
        <span
          key={`${index}-${i}`}
          className={`inline-block text-brand-light ${
            phase === "in" ? "animate-blind-in" : "animate-blind-out"
          }`}
          style={{
            animationDelay: `${i * (phase === "in" ? 70 : 40)}ms`,
          }}
        >
          {ch}
        </span>
      ))}
    </span>
  );
}
