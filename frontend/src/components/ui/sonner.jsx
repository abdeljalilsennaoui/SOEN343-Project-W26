import React from "react"
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
} from "lucide-react"
import { useTheme } from "next-themes"
import { Toaster as Sonner } from "sonner"

const Toaster = (props) => {
  const { theme = "system" } = useTheme()

  return React.createElement(Sonner, {
    theme: theme,
    className: "toaster group",
    icons: {
      success: React.createElement(CircleCheckIcon, { className: "size-4" }),
      info: React.createElement(InfoIcon, { className: "size-4" }),
      warning: React.createElement(TriangleAlertIcon, { className: "size-4" }),
      error: React.createElement(OctagonXIcon, { className: "size-4" }),
      loading: React.createElement(Loader2Icon, { className: "size-4 animate-spin" }),
    },
    style: {
      "--normal-bg": "var(--popover)",
      "--normal-text": "var(--popover-foreground)",
      "--normal-border": "var(--border)",
      "--border-radius": "var(--radius)",
    },
    ...props,
  });
}

export { Toaster }
