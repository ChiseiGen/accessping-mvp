"use client";

import { useId } from "react";
import { MoonIcon, SunIcon } from "lucide-react";

type ToggleThemeProps = {
  isDark: boolean;
  onThemeChange: (isDark: boolean) => void;
};

const SwitchToggleThemeDemo = ({ isDark, onThemeChange }: ToggleThemeProps) => {
  const id = useId();

  return (
    <button
      id={id}
      className="themeIconButton"
      aria-label={`Switch to ${isDark ? "light" : "dark"} mode`}
      type="button"
      onClick={() => onThemeChange(!isDark)}
    >
      <SunIcon className="themeGlyph sunGlyph" aria-hidden="true" />
      <MoonIcon className="themeGlyph moonGlyph" aria-hidden="true" />
    </button>
  );
};

export default SwitchToggleThemeDemo;
