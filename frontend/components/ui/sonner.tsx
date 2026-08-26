"use client"

import { useTheme } from "next-themes"
import { Toaster as Sonner, type ToasterProps } from "sonner"
import { CircleCheckIcon, InfoIcon, TriangleAlertIcon, OctagonXIcon, Loader2Icon } from "lucide-react"

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system", resolvedTheme } = useTheme()

  return (
    <Sonner
      theme={(resolvedTheme || theme) as ToasterProps["theme"]}
      className="toaster group"
      icons={{
        success: (
          <CircleCheckIcon className="size-4 text-green-500!" />
        ),
        info: (
          <InfoIcon className="size-4 text-blue-500!" />
        ),
        warning: (
          <TriangleAlertIcon className="size-4 text-yellow-500!" />
        ),
        error: (
          <OctagonXIcon className="size-4 text-red-500!" />
        ),
        loading: (
          <Loader2Icon className="size-4 text-primary! animate-spin" />
        ),
      }}
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-card! group-[.toaster]:text-card-foreground! group-[.toaster]:border-none! group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-muted-foreground!",
          actionButton:
            "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
          cancelButton:
            "group-[.toast]:bg-muted! group-[.toast]:text-muted-foreground!",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
