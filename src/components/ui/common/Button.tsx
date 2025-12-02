// src/components/ui/common/Button.tsx
import React from "react";
import clsx from "clsx";
import type { ButtonProps } from "@/types/TButton";

const Button: React.FC<ButtonProps> = ({
  children,
  color = "primary",
  className,
  onClick,
  type = "button",
  disabled = false,
  costume = false,
}) => {
  const baseClass =
    "font-medium px-6 py-3 rounded-3xl transition duration-200 cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed";

  const colorClass = {
    primary: "bg-[var(--primary-color)] text-black",
    primaryLine:
      "bg-transparent border border-[var(--primary-color)] text-[var(--primary-color)] hover:bg-[var(--primary-color)] hover:text-white",
    secondary: "bg-[var(--secondary-color)] text-black hover:bg-gray-300",
    secondaryLine:
      "bg-transparent border border-[var(--secondary-color)] text-[var(--secondary-color)] hover:bg-[var(--secondary-color)] hover:text-white",
    white: "bg-white text-black hover:bg-gray-100",
  } as const;

  const palette =
    colorClass[(color as keyof typeof colorClass)] ?? colorClass.primary;

  const mergedClass = costume
    ? clsx(baseClass, className)
    : clsx(baseClass, palette, className);

  return (
    <button type={type} onClick={onClick} disabled={disabled} className={mergedClass}>
      {children}
    </button>
  );
};

export default Button;
