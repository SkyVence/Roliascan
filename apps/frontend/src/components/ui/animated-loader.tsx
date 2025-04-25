"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Loader2, RefreshCw, RotateCw, Loader } from "lucide-react"
import { cn } from "@/lib/utils"
import { Slider } from "@/components/ui/slider"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type LoaderType = "spinner" | "circular" | "refresh" | "rotate" | "dots"
type LoaderSize = "sm" | "md" | "lg" | "xl"
type LoaderColor = "default" | "primary" | "secondary" | "success" | "warning" | "danger"

const sizeMap = {
  sm: "w-4 h-4",
  md: "w-6 h-6",
  lg: "w-8 h-8",
  xl: "w-12 h-12",
}

const colorMap = {
  default: "text-muted-foreground",
  primary: "text-primary",
  secondary: "text-secondary",
  success: "text-green-500",
  warning: "text-amber-500",
  danger: "text-destructive",
}

export function AnimatedLoader({
  type = "spinner",
  size = "md",
  color = "primary",
  speed = 1,
  className,
}: {
  type?: LoaderType
  size?: LoaderSize
  color?: LoaderColor
  speed?: number
  className?: string
}) {
  const iconClass = cn(sizeMap[size], colorMap[color], className)
  const duration = 1 / speed

  const renderLoader = () => {
    switch (type) {
      case "spinner":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
          >
            <Loader2 className={iconClass} />
          </motion.div>
        )
      case "circular":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
          >
            <Loader className={iconClass} />
          </motion.div>
        )
      case "refresh":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
          >
            <RefreshCw className={iconClass} />
          </motion.div>
        )
      case "rotate":
        return (
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration, ease: "linear", repeat: Number.POSITIVE_INFINITY }}
          >
            <RotateCw className={iconClass} />
          </motion.div>
        )
      case "dots":
        return (
          <div className="flex space-x-1 items-center justify-center">
            {[0, 1, 2].map((i) => (
              <motion.div
                key={i}
                className={cn(
                  "rounded-full bg-current",
                  size === "sm" && "w-1 h-1",
                  size === "md" && "w-1.5 h-1.5",
                  size === "lg" && "w-2 h-2",
                  size === "xl" && "w-3 h-3",
                  colorMap[color],
                )}
                animate={{ scale: [0.5, 1, 0.5] }}
                transition={{
                  duration: duration * 1.5,
                  ease: "easeInOut",
                  repeat: Number.POSITIVE_INFINITY,
                  delay: i * 0.15,
                }}
              />
            ))}
          </div>
        )
      default:
        return <Loader2 className={iconClass} />
    }
  }

  return <div className="flex items-center justify-center">{renderLoader()}</div>
}

export default function LoaderDemo() {
  const [type, setType] = useState<LoaderType>("spinner")
  const [size, setSize] = useState<LoaderSize>("md")
  const [color, setColor] = useState<LoaderColor>("primary")
  const [speed, setSpeed] = useState(1)

  return (
    <div className="w-full max-w-md mx-auto p-6 space-y-8">
      <div className="flex flex-col items-center justify-center h-32 border rounded-lg">
        <AnimatedLoader type={type} size={size} color={color} speed={speed} />
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Loader Type</label>
          <div className="grid grid-cols-5 gap-2">
            {(["spinner", "circular", "refresh", "rotate", "dots"] as LoaderType[]).map((t) => (
              <Button
                key={t}
                variant={type === t ? "default" : "outline"}
                size="sm"
                onClick={() => setType(t)}
                className="capitalize"
              >
                {t}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Size</label>
          <div className="grid grid-cols-4 gap-2">
            {(["sm", "md", "lg", "xl"] as LoaderSize[]).map((s) => (
              <Button
                key={s}
                variant={size === s ? "default" : "outline"}
                size="sm"
                onClick={() => setSize(s)}
                className="uppercase"
              >
                {s}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Color</label>
          <Select value={color} onValueChange={(value) => setColor(value as LoaderColor)}>
            <SelectTrigger>
              <SelectValue placeholder="Select color" />
            </SelectTrigger>
            <SelectContent>
              {(["default", "primary", "secondary", "success", "warning", "danger"] as LoaderColor[]).map((c) => (
                <SelectItem key={c} value={c} className="capitalize">
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Animation Speed</label>
            <span className="text-sm text-muted-foreground">{speed.toFixed(1)}x</span>
          </div>
          <Slider value={[speed]} min={0.1} max={3} step={0.1} onValueChange={(values) => setSpeed(values[0])} />
        </div>
      </div>
    </div>
  )
}
