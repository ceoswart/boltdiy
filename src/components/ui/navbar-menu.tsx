import React, { useState, createContext, useContext, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { cn } from "../../lib/utils";

const MenuContext = createContext<{
  open: boolean;
  setOpen: (open: boolean) => void;
}>({
  open: false,
  setOpen: () => {},
});

export function Menu({
  children,
  setActive,
}: {
  children: React.ReactNode;
  setActive: (item: string | null) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <MenuContext.Provider value={{ open, setOpen }}>
      <div className="relative">
        <motion.nav
          initial={false}
          animate={open ? "open" : "closed"}
          className="flex items-center justify-center bg-white border rounded-full"
        >
          {children}
        </motion.nav>
      </div>
    </MenuContext.Provider>
  );
}

export function MenuItem({
  setActive,
  active,
  item,
  children,
}: {
  setActive: (item: string | null) => void;
  active: string | null;
  item: string;
  children: React.ReactNode;
}) {
  const { open, setOpen } = useContext(MenuContext);
  const ref = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  useEffect(() => {
    if (active !== item) {
      setIsHovered(false);
      setIsClicked(false);
    }
  }, [active, item]);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsClicked(false);
        setActive(null);
      }
    };

    if (isClicked) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isClicked, setActive]);

  return (
    <div
      ref={ref}
      onMouseEnter={() => {
        if (!isClicked) {
          setActive(item);
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => {
        if (!isClicked) {
          setActive(null);
          setIsHovered(false);
        }
      }}
      className="relative"
    >
      <motion.button
        className={cn(
          "relative px-4 py-2 text-sm hover:text-neutral-800 transition-colors",
          (active === item || isClicked) ? "text-neutral-800" : "text-neutral-500"
        )}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => {
          setIsClicked(!isClicked);
          setActive(isClicked ? null : item);
          setIsHovered(false);
        }}
      >
        <span className="relative z-10">{item}</span>
      </motion.button>

      {(isHovered || isClicked) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full pt-4 left-1/2 transform -translate-x-1/2"
        >
          <div className="w-auto bg-white rounded-lg shadow-lg border p-6">
            {children}
          </div>
        </motion.div>
      )}
    </div>
  );
}

export function HoveredLink({ children, ...props }: any) {
  return (
    <a
      {...props}
      className="text-neutral-500 hover:text-neutral-800 transition-colors"
    >
      {children}
    </a>
  );
}

export function ProductItem({
  title,
  description,
  href,
  src,
}: {
  title: string;
  description: string;
  href: string;
  src: string;
}) {
  return (
    <a href={href} className="flex items-start gap-4 group">
      <div className="relative w-32 h-32 overflow-hidden rounded-lg">
        <img
          src={src}
          alt={title}
          className="object-cover w-full h-full transition-transform group-hover:scale-105"
        />
      </div>
      <div>
        <h3 className="font-medium text-neutral-800 group-hover:text-blue-600">
          {title}
        </h3>
        <p className="text-sm text-neutral-500">{description}</p>
      </div>
    </a>
  );
}