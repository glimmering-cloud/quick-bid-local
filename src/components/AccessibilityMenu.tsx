import { useState, useEffect } from "react";
import { Accessibility, ZoomIn, ZoomOut, Contrast, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const FONT_SIZES = [100, 112, 125, 150] as const;

export function AccessibilityMenu() {
  const [highContrast, setHighContrast] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("qs-high-contrast") === "true";
    }
    return false;
  });

  const [fontSizeIndex, setFontSizeIndex] = useState(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("qs-font-size-index");
      return saved ? Number(saved) : 0;
    }
    return 0;
  });

  const [reducedMotion, setReducedMotion] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("qs-reduced-motion") === "true";
    }
    return false;
  });

  useEffect(() => {
    document.documentElement.classList.toggle("high-contrast", highContrast);
    localStorage.setItem("qs-high-contrast", String(highContrast));
  }, [highContrast]);

  useEffect(() => {
    const size = FONT_SIZES[fontSizeIndex];
    document.documentElement.style.fontSize = `${size}%`;
    localStorage.setItem("qs-font-size-index", String(fontSizeIndex));
  }, [fontSizeIndex]);

  useEffect(() => {
    document.documentElement.classList.toggle("reduce-motion", reducedMotion);
    localStorage.setItem("qs-reduced-motion", String(reducedMotion));
  }, [reducedMotion]);

  const reset = () => {
    setHighContrast(false);
    setFontSizeIndex(0);
    setReducedMotion(false);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          aria-label="Accessibility options"
          className="relative"
        >
          <Accessibility className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <Accessibility className="h-4 w-4" />
          Accessibility
        </DropdownMenuLabel>
        <DropdownMenuSeparator />

        <DropdownMenuItem onClick={() => setHighContrast(!highContrast)}>
          <Contrast className="mr-2 h-4 w-4" />
          High Contrast
          <span className="ml-auto text-xs text-muted-foreground">
            {highContrast ? "ON" : "OFF"}
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setFontSizeIndex(Math.min(fontSizeIndex + 1, FONT_SIZES.length - 1))}
          disabled={fontSizeIndex >= FONT_SIZES.length - 1}
        >
          <ZoomIn className="mr-2 h-4 w-4" />
          Increase Text
          <span className="ml-auto text-xs text-muted-foreground">
            {FONT_SIZES[fontSizeIndex]}%
          </span>
        </DropdownMenuItem>

        <DropdownMenuItem
          onClick={() => setFontSizeIndex(Math.max(fontSizeIndex - 1, 0))}
          disabled={fontSizeIndex <= 0}
        >
          <ZoomOut className="mr-2 h-4 w-4" />
          Decrease Text
        </DropdownMenuItem>

        <DropdownMenuItem onClick={() => setReducedMotion(!reducedMotion)}>
          Reduced Motion
          <span className="ml-auto text-xs text-muted-foreground">
            {reducedMotion ? "ON" : "OFF"}
          </span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={reset}>
          <RotateCcw className="mr-2 h-4 w-4" />
          Reset All
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
