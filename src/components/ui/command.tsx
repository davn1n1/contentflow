"use client";

import * as React from "react";
import {
  Command as CmdkCommand,
  CommandInput as CmdkInput,
  CommandList as CmdkList,
  CommandEmpty as CmdkEmpty,
  CommandItem as CmdkItem,
  CommandLoading as CmdkLoading,
} from "cmdk";
import { Search, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

const Command = React.forwardRef<
  React.ComponentRef<typeof CmdkCommand>,
  React.ComponentPropsWithoutRef<typeof CmdkCommand>
>(({ className, ...props }, ref) => (
  <CmdkCommand
    ref={ref}
    className={cn(
      "flex h-full w-full flex-col overflow-hidden rounded-xl bg-popover text-popover-foreground",
      className
    )}
    {...props}
  />
));
Command.displayName = "Command";

const CommandInput = React.forwardRef<
  React.ComponentRef<typeof CmdkInput>,
  React.ComponentPropsWithoutRef<typeof CmdkInput> & { loading?: boolean }
>(({ className, loading, ...props }, ref) => (
  <div className="flex items-center gap-2 border-b border-border px-3 py-2.5">
    <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
    <CmdkInput
      ref={ref}
      className={cn(
        "flex h-7 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
    {loading && <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-muted-foreground" />}
  </div>
));
CommandInput.displayName = "CommandInput";

const CommandList = React.forwardRef<
  React.ComponentRef<typeof CmdkList>,
  React.ComponentPropsWithoutRef<typeof CmdkList>
>(({ className, ...props }, ref) => (
  <CmdkList
    ref={ref}
    className={cn("max-h-72 overflow-y-auto overflow-x-hidden", className)}
    {...props}
  />
));
CommandList.displayName = "CommandList";

const CommandEmpty = React.forwardRef<
  React.ComponentRef<typeof CmdkEmpty>,
  React.ComponentPropsWithoutRef<typeof CmdkEmpty>
>((props, ref) => (
  <CmdkEmpty ref={ref} className="py-4 text-center text-xs text-muted-foreground" {...props} />
));
CommandEmpty.displayName = "CommandEmpty";

const CommandItem = React.forwardRef<
  React.ComponentRef<typeof CmdkItem>,
  React.ComponentPropsWithoutRef<typeof CmdkItem>
>(({ className, ...props }, ref) => (
  <CmdkItem
    ref={ref}
    className={cn(
      "relative flex cursor-pointer select-none items-center gap-3 px-3 py-2.5 text-sm outline-none",
      "data-[selected=true]:bg-muted/60",
      "data-[disabled=true]:pointer-events-none data-[disabled=true]:opacity-50",
      className
    )}
    {...props}
  />
));
CommandItem.displayName = "CommandItem";

const CommandLoading = CmdkLoading;

export { Command, CommandInput, CommandList, CommandEmpty, CommandItem, CommandLoading };
