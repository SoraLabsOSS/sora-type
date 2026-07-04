"use client";

import {
  AnimatePresence,
  type HTMLMotionProps,
  motion,
  type PanInfo,
  useDragControls,
} from "motion/react";
import { Dialog as SheetPrimitive } from "radix-ui";
import {
  type ComponentProps,
  type ReactNode,
  useCallback,
  useEffect,
  useState,
} from "react";
import { useControlledState } from "@/hooks/use-controlled-state";
import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";
import { EASE_DRAWER } from "@/lib/ease";
import { getStrictContext } from "@/lib/get-strict-context";
import { cn } from "@/lib/utils";

const DRAWER_TRANSITION = { duration: 0.5, ease: EASE_DRAWER } as const;

interface BottomSheetContextType {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const [BottomSheetProvider, useBottomSheet] =
  getStrictContext<BottomSheetContextType>("BottomSheetContext");

type BottomSheetProps = ComponentProps<typeof SheetPrimitive.Root>;

function BottomSheet({
  open,
  defaultOpen,
  onOpenChange,
  ...props
}: BottomSheetProps) {
  const [isOpen, setIsOpen] = useControlledState({
    value: open,
    defaultValue: defaultOpen ?? false,
    onChange: onOpenChange,
  });

  return (
    <BottomSheetProvider value={{ open: isOpen, setOpen: setIsOpen }}>
      <SheetPrimitive.Root
        data-slot="bottom-sheet"
        onOpenChange={setIsOpen}
        open={isOpen}
        {...props}
      />
    </BottomSheetProvider>
  );
}

type BottomSheetTriggerProps = ComponentProps<typeof SheetPrimitive.Trigger>;

function BottomSheetTrigger(props: BottomSheetTriggerProps) {
  return <SheetPrimitive.Trigger data-slot="bottom-sheet-trigger" {...props} />;
}

type BottomSheetCloseProps = ComponentProps<typeof SheetPrimitive.Close>;

function BottomSheetClose(props: BottomSheetCloseProps) {
  return <SheetPrimitive.Close data-slot="bottom-sheet-close" {...props} />;
}

type BottomSheetOverlayProps = HTMLMotionProps<"div">;

function BottomSheetOverlay({ className, ...props }: BottomSheetOverlayProps) {
  return (
    <SheetPrimitive.Overlay asChild forceMount>
      <motion.div
        animate={{ opacity: 1 }}
        className={cn(
          "fixed inset-0 z-50 bg-background/40 backdrop-blur-sm",
          className
        )}
        data-slot="bottom-sheet-overlay"
        exit={{ opacity: 0 }}
        initial={{ opacity: 0 }}
        transition={DRAWER_TRANSITION}
        {...props}
      />
    </SheetPrimitive.Overlay>
  );
}

interface BottomSheetContentProps
  extends Omit<
    ComponentProps<typeof SheetPrimitive.Content>,
    "asChild" | "forceMount" | "children" | keyof HTMLMotionProps<"div">
  > {
  children?: ReactNode;
  className?: string;
  defaultSnap?: number;
  dismissThreshold?: number;
  handleClassName?: string;
  overlay?: boolean;
  overlayClassName?: string;
  showHandle?: boolean;
  snapPoints?: (number | "auto")[];
  style?: HTMLMotionProps<"div">["style"];
}

function BottomSheetContent({
  className,
  children,
  snapPoints = [0.5, 0.92],
  defaultSnap = 0,
  dismissThreshold = 120,
  overlay = true,
  overlayClassName,
  showHandle = true,
  handleClassName,
  style,
  ...props
}: BottomSheetContentProps) {
  const { open, setOpen } = useBottomSheet();
  const [snap, setSnap] = useState(defaultSnap);
  const dragControls = useDragControls();
  const reduceMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (open) {
      setSnap(defaultSnap);
    }
  }, [open, defaultSnap]);

  useEffect(() => {
    if (!open) {
      return;
    }
    const body = document.body;
    const scrollY = window.scrollY;
    const prev = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      overflow: body.style.overflow,
    };
    body.style.position = "fixed";
    body.style.top = `-${scrollY}px`;
    body.style.left = "0";
    body.style.right = "0";
    body.style.overflow = "hidden";
    return () => {
      body.style.position = prev.position;
      body.style.top = prev.top;
      body.style.left = prev.left;
      body.style.right = prev.right;
      body.style.overflow = prev.overflow;
      window.scrollTo(0, scrollY);
    };
  }, [open]);

  const onDragEnd = useCallback(
    (_: unknown, info: PanInfo) => {
      const velocity = info.velocity.y;
      const offset = info.offset.y;

      if (velocity > 600 || offset > dismissThreshold) {
        const smaller = snapPoints.map((_, i) => i).filter((i) => i < snap);
        if (
          smaller.length &&
          velocity < 800 &&
          offset < dismissThreshold * 1.6
        ) {
          setSnap(smaller.at(-1) as number);
        } else {
          setOpen(false);
        }
        return;
      }

      if (velocity < -500) {
        setSnap(Math.min(snapPoints.length - 1, snap + 1));
        return;
      }

      if (offset > 80 && snap > 0) {
        setSnap(snap - 1);
      } else if (offset < -80 && snap < snapPoints.length - 1) {
        setSnap(snap + 1);
      }
    },
    [dismissThreshold, setOpen, snap, snapPoints]
  );

  const snapValue = snapPoints[snap];
  const heightStyle =
    snapValue === "auto"
      ? { maxHeight: "92vh" }
      : { height: `${(snapValue ?? 1) * 100}vh` };

  return (
    <AnimatePresence>
      {open ? (
        <SheetPrimitive.Portal forceMount>
          {overlay ? <BottomSheetOverlay className={overlayClassName} /> : null}
          <SheetPrimitive.Content asChild forceMount>
            <motion.div
              animate={reduceMotion ? { y: 0, opacity: 1 } : { y: 0 }}
              className={cn(
                "fixed inset-x-4 bottom-0 z-50 mx-auto flex max-w-md flex-col overflow-hidden rounded-2xl bg-transparent pb-4 outline-none will-change-transform md:mx-auto md:w-full",
                className
              )}
              data-slot="bottom-sheet-content"
              drag="y"
              dragConstraints={{ top: 0, bottom: 0 }}
              dragControls={dragControls}
              dragElastic={{ top: 0.02, bottom: 0.4 }}
              dragListener={false}
              dragMomentum={false}
              exit={reduceMotion ? { y: 0, opacity: 0 } : { y: "100%" }}
              initial={reduceMotion ? { y: 0, opacity: 0 } : { y: "100%" }}
              onDragEnd={onDragEnd}
              style={{ ...heightStyle, ...style }}
              transition={
                reduceMotion
                  ? { duration: 0.18, ease: EASE_DRAWER }
                  : DRAWER_TRANSITION
              }
              {...props}
            >
              {showHandle ? (
                <BottomSheetHandle
                  className={handleClassName}
                  dragControls={dragControls}
                />
              ) : null}
              {children}
            </motion.div>
          </SheetPrimitive.Content>
        </SheetPrimitive.Portal>
      ) : null}
    </AnimatePresence>
  );
}

interface BottomSheetHandleProps extends ComponentProps<"div"> {
  dragControls: ReturnType<typeof useDragControls>;
}

function BottomSheetHandle({
  className,
  dragControls,
  ...props
}: BottomSheetHandleProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 cursor-grab touch-none flex-col items-center px-4 pt-3 pb-2 active:cursor-grabbing",
        className
      )}
      data-slot="bottom-sheet-handle"
      onPointerDown={(event) => dragControls.start(event)}
      {...props}
    >
      <div className="h-1.5 w-10 rounded-full bg-muted-foreground/40" />
    </div>
  );
}

type BottomSheetTitleProps = ComponentProps<typeof SheetPrimitive.Title>;

function BottomSheetTitle({ className, ...props }: BottomSheetTitleProps) {
  return (
    <SheetPrimitive.Title
      className={cn("sr-only", className)}
      data-slot="bottom-sheet-title"
      {...props}
    />
  );
}

type BottomSheetDescriptionProps = ComponentProps<
  typeof SheetPrimitive.Description
>;

function BottomSheetDescription({
  className,
  ...props
}: BottomSheetDescriptionProps) {
  return (
    <SheetPrimitive.Description
      className={cn("sr-only", className)}
      data-slot="bottom-sheet-description"
      {...props}
    />
  );
}

type BottomSheetPanelProps = ComponentProps<"div">;

function BottomSheetPanel({ className, ...props }: BottomSheetPanelProps) {
  return (
    <div
      className={cn(
        "relative z-[2] min-h-0 grow space-y-2 overflow-y-auto overscroll-contain rounded-2xl bg-muted p-2",
        className
      )}
      data-slot="bottom-sheet-panel"
      {...props}
    />
  );
}

type BottomSheetListProps = ComponentProps<"ul">;

function BottomSheetList({ className, ...props }: BottomSheetListProps) {
  return (
    <ul
      className={cn("grid w-full space-y-1.5 text-sm", className)}
      data-slot="bottom-sheet-list"
      {...props}
    />
  );
}

interface BottomSheetRowProps
  extends Omit<ComponentProps<"button">, "children" | "value"> {
  children?: ReactNode;
  label: ReactNode;
  labelClassName?: string;
  lineClassName?: string;
  value?: ReactNode;
  valueClassName?: string;
}

function BottomSheetRow({
  className,
  label,
  value,
  children,
  labelClassName,
  valueClassName,
  lineClassName,
  type = "button",
  ...props
}: BottomSheetRowProps) {
  return (
    <li data-slot="bottom-sheet-row-item">
      <button
        className={cn(
          "relative w-full rounded-lg px-2.5 py-1.5 text-left transition-colors hover:bg-foreground/5",
          className
        )}
        data-slot="bottom-sheet-row"
        type={type}
        {...props}
      >
        {children ?? (
          <div className="flex flex-1 items-center justify-between gap-2 text-sm">
            <div
              className={cn(
                "flex items-center justify-center gap-2 font-medium uppercase tracking-wide",
                labelClassName
              )}
            >
              {label}
            </div>
            <span
              className={cn(
                "relative h-px flex-1 rounded-2xl bg-current/20",
                lineClassName
              )}
            />
            <span
              className={cn("font-sans text-foreground/50", valueClassName)}
            >
              {value}
            </span>
          </div>
        )}
      </button>
    </li>
  );
}

export {
  BottomSheet,
  BottomSheetClose,
  BottomSheetContent,
  type BottomSheetContentProps,
  BottomSheetDescription,
  BottomSheetHandle,
  BottomSheetList,
  BottomSheetOverlay,
  BottomSheetPanel,
  type BottomSheetProps,
  BottomSheetRow,
  type BottomSheetRowProps,
  BottomSheetTitle,
  BottomSheetTrigger,
  useBottomSheet,
};
