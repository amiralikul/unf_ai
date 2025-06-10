import { useRef, useEffect } from "react";

export function useAutoScroll(dependency) {
  const scrollAreaRef = useRef(null);
  const scrollTargetRef = useRef(null);

  const scrollToBottom = () => {
    scrollTargetRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [dependency]);

  return {
    scrollAreaRef,
    scrollTargetRef,
    scrollToBottom
  };
}
