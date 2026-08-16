// 角丸・薄い影のカード。hoverableを指定するとホバー時に浮き上がる。

import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
};

export function Card({ hoverable = false, className = "", ...rest }: Props) {
  const hoverClasses = hoverable
    ? "transition hover:-translate-y-0.5 hover:shadow-md"
    : "";

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white p-6 shadow-sm ${hoverClasses} ${className}`}
      {...rest}
    />
  );
}
