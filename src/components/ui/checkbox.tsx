"use client"

import * as React from "react"
import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

export interface CheckboxProps extends React.InputHTMLAttributes<HTMLInputElement> {
  checked?: boolean
  onCheckedChange?: (checked: boolean) => void
}

const Checkbox = React.forwardRef<HTMLInputElement, CheckboxProps>(
  ({ className, checked, onCheckedChange, ...props }, ref) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      onCheckedChange?.(e.target.checked)
    }

    const handleToggle = (e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      if (props.disabled) return
      onCheckedChange?.(!checked)
    }

    return (
      <div 
        onClick={handleToggle}
        className={cn(
          "peer h-4 w-4 shrink-0 rounded-sm border border-zinc-900 ring-offset-background focus-within:ring-2 focus-within:ring-zinc-900 focus-within:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all",
          checked ? "bg-zinc-900 text-white" : "bg-white text-transparent",
          className
        )}
      >
        <input
          type="checkbox"
          className="sr-only"
          ref={ref}
          checked={checked}
          onChange={handleChange}
          {...props}
        />
        {checked && <Check className="h-3 w-3 text-white stroke-3" />}
      </div>
    )
  }
)
Checkbox.displayName = "Checkbox"

export { Checkbox }
