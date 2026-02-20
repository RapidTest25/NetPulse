"use client";

import { useState, useEffect } from "react";

const defaultWords = [
  "Professional",
  "High Converting",
  "Responsive",
  "SEO-Ready",
  "Siap Pakai",
];

export default function TypingText({ words }: { words?: string[] }) {
  const w = words && words.length > 0 ? words : defaultWords;
  const [wordIndex, setWordIndex] = useState(0);
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const currentWord = w[wordIndex];
    let timeout: ReturnType<typeof setTimeout>;

    if (!isDeleting) {
      if (text.length < currentWord.length) {
        timeout = setTimeout(() => {
          setText(currentWord.slice(0, text.length + 1));
        }, 100);
      } else {
        timeout = setTimeout(() => setIsDeleting(true), 1800);
      }
    } else {
      if (text.length > 0) {
        timeout = setTimeout(() => {
          setText(currentWord.slice(0, text.length - 1));
        }, 50);
      } else {
        setIsDeleting(false);
        setWordIndex((prev) => (prev + 1) % w.length);
      }
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, wordIndex, w]);

  return (
    <span className="text-gradient-orange">
      {text}
      <span className="animate-blink">|</span>
    </span>
  );
}
