import * as React from "react";
import { cn } from "@/lib/utils";

function CompactCard({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compact-card"
      className={cn(
        "bg-card text-card-foreground flex flex-col gap-6 rounded-xl border shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function CompactCardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compact-card-header"
      className={cn(
        "@container/compact-card-header grid auto-rows-min grid-rows-[auto_auto] items-start gap-1.5 px-6 has-data-[slot=compact-card-action]:grid-cols-[1fr_auto] [.border-b]:pb-6",
        className,
      )}
      {...props}
    />
  );
}

function CompactCardTitle({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compact-card-title"
      className={cn("leading-none font-semibold", className)}
      {...props}
    />
  );
}

function CompactCardDescription({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compact-card-description"
      className={cn("text-muted-foreground text-sm", className)}
      {...props}
    />
  );
}

function CompactCardAction({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compact-card-action"
      className={cn(
        "col-start-2 row-span-2 row-start-1 self-start justify-self-end",
        className,
      )}
      {...props}
    />
  );
}

function CompactCardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compact-card-content"
      className={cn("", className)}
      {...props}
    />
  );
}

function CompactCardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="compact-card-footer"
      className={cn("flex items-center px-6 [.border-t]:pt-6", className)}
      {...props}
    />
  );
}

export {
  CompactCard,
  CompactCardHeader,
  CompactCardFooter,
  CompactCardTitle,
  CompactCardAction,
  CompactCardDescription,
  CompactCardContent,
}; 