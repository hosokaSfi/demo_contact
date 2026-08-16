// 角丸・薄い影のカード。hoverableを指定するとホバー時に浮き上がる。padding未指定時はp-6。

import type { HTMLAttributes } from "react";

type Props = HTMLAttributes<HTMLDivElement> & {
  hoverable?: boolean;
  padding?: string;
};

export function Card({
  hoverable = false,
  padding = "p-6",
  className = "",
  ...rest
}: Props) {
  const hoverClasses = hoverable
    ? "transition hover:-translate-y-0.5 hover:shadow-md"
    : "";

  return (
    <div
      className={`rounded-xl border border-gray-200 bg-white shadow-sm ${padding} ${hoverClasses} ${className}`}
      {...rest}
    />
  );
}
