import * as React from "react"
import * as VisuallyHiddenPrimitive from "@radix-ui/react-visually-hidden"

import { cn } from "@/lib/utils"

function VisuallyHidden({
  className,
  ...props
}: React.ComponentPropsWithoutRef<typeof VisuallyHiddenPrimitive.Root>) {
  return (
    <VisuallyHiddenPrimitive.Root
      data-slot="visually-hidden"
      className={cn("sr-only", className)}
      {...props}
    />
  )
}

export { VisuallyHidden }
