"use client"

import * as React from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Book } from "lucide-react"
import { cn } from "@/lib/utils"

export const navItems = [
  {
    title: "Home",
    href: "/dashboard",
    icon: Home,
  },
  {
    title: "Books",
    href: "/books",
    icon: Book,
  },
]

interface SidebarContentProps {
  onItemClick?: () => void
  collapsed?: boolean
}

export function SidebarContent({ onItemClick, collapsed }: SidebarContentProps) {
  const pathname = usePathname()

  return (
    <nav className={cn("flex flex-col gap-1 p-4", collapsed && "items-center px-2")}>
      {navItems.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          onClick={onItemClick}
          title={collapsed ? item.title : undefined}
          className={cn(
            "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted hover:text-foreground",
            pathname === item.href
              ? "bg-muted text-foreground font-semibold"
              : "text-muted-foreground",
            collapsed && "justify-center px-2"
          )}
        >
          <item.icon className={cn("h-4 w-4", collapsed && "h-5 w-5")} />
          {!collapsed && <span>{item.title}</span>}
        </Link>
      ))}
    </nav>
  )
}
