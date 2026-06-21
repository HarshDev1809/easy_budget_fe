import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { Book, Category } from "./types"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRenewCycle(book: Book): string {
  const cycle = book.renewCycle;
  if (!cycle) return "Renews: Monthly"; // Default fallback
  
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  switch (cycle) {
    case "daily":
      return "Renews: Daily";
    case "weekly": {
      const day = book.renewDayOfWeek !== undefined && book.renewDayOfWeek >= 0 && book.renewDayOfWeek <= 6 
        ? daysOfWeek[book.renewDayOfWeek] 
        : "Monday";
      return `Renews: Weekly on ${day}s`;
    }
    case "bi-weekly": {
      const day = book.renewDayOfWeek !== undefined && book.renewDayOfWeek >= 0 && book.renewDayOfWeek <= 6 
        ? daysOfWeek[book.renewDayOfWeek] 
        : "Monday";
      return `Renews: Bi-weekly on ${day}s`;
    }
    case "monthly": {
      const day = book.renewDayOfMonth !== undefined ? book.renewDayOfMonth : 1;
      const suffix = (d: number) => {
        if (d > 3 && d < 21) return "th";
        switch (d % 10) {
          case 1:  return "st";
          case 2:  return "nd";
          case 3:  return "rd";
          default: return "th";
        }
      };
      return `Renews: Monthly on the ${day}${suffix(day)}`;
    }
    case "custom": {
      const cron = book.renewCron || book.customCron;
      if (!cron) return "Renews: Custom";
      const parsed = parseCronString(cron);
      if (!parsed) return `Renews: Custom (${cron})`;
      const timeStr = parsed.customTime;
      if (parsed.customType === "month") {
        const days = parsed.customDaysOfMonth.split(",").map(d => {
          const num = Number(d.trim());
          if (isNaN(num)) return d;
          const suffix = (n: number) => {
            if (n > 3 && n < 21) return "th";
            switch (n % 10) {
              case 1:  return "st";
              case 2:  return "nd";
              case 3:  return "rd";
              default: return "th";
            }
          };
          return `${num}${suffix(num)}`;
        }).join(", ");
        return `Renews: Custom (Monthly on the ${days} at ${timeStr})`;
      } else {
        const daysOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const days = parsed.customDaysOfWeek.map(d => daysOfWeekNames[d]).join(", ");
        return `Renews: Custom (Weekly on ${days} at ${timeStr})`;
      }
    }
    default: {
      const fallback = cycle as string;
      return `Renews: ${fallback.charAt(0).toUpperCase() + fallback.slice(1)}`;
    }
  }
}

export function formatNextRenewal(nextRenewAt?: string): string {
  if (!nextRenewAt) return "";
  try {
    const date = new Date(nextRenewAt);
    if (isNaN(date.getTime())) return "";
    return "Next Renewal: " + new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export function formatCategoryRenewCycle(category: Category): string {
  const cycle = category.renewCycle;
  if (!cycle) return "Renews Monthly on the 1st"; // Default fallback
  
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  
  switch (cycle) {
    case "daily":
      return "Renews daily";
    case "weekly": {
      const day = category.renewDayOfWeek !== undefined && category.renewDayOfWeek >= 0 && category.renewDayOfWeek <= 6 
        ? daysOfWeek[category.renewDayOfWeek] 
        : "Monday";
      return `Renews every ${day}`;
    }
    case "bi-weekly": {
      const day = category.renewDayOfWeek !== undefined && category.renewDayOfWeek >= 0 && category.renewDayOfWeek <= 6 
        ? daysOfWeek[category.renewDayOfWeek] 
        : "Monday";
      return `Renews bi-weekly on ${day}s`;
    }
    case "monthly": {
      const day = category.renewDayOfMonth !== undefined ? category.renewDayOfMonth : 1;
      const suffix = (d: number) => {
        if (d > 3 && d < 21) return "th";
        switch (d % 10) {
          case 1:  return "st";
          case 2:  return "nd";
          case 3:  return "rd";
          default: return "th";
        }
      };
      return `Renews Monthly on the ${day}${suffix(day)}`;
    }
    case "custom": {
      const cron = category.renewCron || category.customCron;
      if (!cron) return "Renews custom schedule";
      const parsed = parseCronString(cron);
      if (!parsed) return "Renews custom schedule";
      
      const timeStr = parsed.customTime;
      if (parsed.customType === "month") {
        const days = parsed.customDaysOfMonth.split(",").map(d => {
          const num = Number(d.trim());
          if (isNaN(num)) return d;
          const suffix = (n: number) => {
            if (n > 3 && n < 21) return "th";
            switch (n % 10) {
              case 1:  return "st";
              case 2:  return "nd";
              case 3:  return "rd";
              default: return "th";
            }
          };
          return `${num}${suffix(num)}`;
        }).join(", ");
        return `Renews custom (Monthly on the ${days} at ${timeStr})`;
      } else {
        const daysOfWeekNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
        const days = parsed.customDaysOfWeek.map(d => daysOfWeekNames[d]).join(", ");
        return `Renews custom (Weekly on ${days} at ${timeStr})`;
      }
    }
    default: {
      const fallback = cycle as string;
      return `Renews ${fallback.charAt(0).toUpperCase() + fallback.slice(1)}`;
    }
  }
}

export function formatCategoryNextReset(nextRenewAt?: string): string {
  if (!nextRenewAt) return "";
  try {
    const date = new Date(nextRenewAt);
    if (isNaN(date.getTime())) return "";
    return "Next Reset: " + new Intl.DateTimeFormat("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    }).format(date);
  } catch {
    return "";
  }
}

export function parseCronString(cron?: string) {
  if (!cron) return null;
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return null;
  
  const [minuteStr, hourStr, domStr, , dowStr] = parts;
  const minute = parseInt(minuteStr, 10);
  const hour = parseInt(hourStr, 10);
  if (isNaN(minute) || isNaN(hour)) return null;
  
  const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
  
  if (domStr !== "*" && dowStr === "*") {
    return {
      customType: "month" as const,
      customTime: time,
      customDaysOfMonth: domStr,
      customDaysOfWeek: [] as number[],
    };
  } else if (dowStr !== "*" && domStr === "*") {
    const days = dowStr.split(",").map(Number).filter(d => !isNaN(d) && d >= 0 && d <= 6);
    return {
      customType: "week" as const,
      customTime: time,
      customDaysOfMonth: "",
      customDaysOfWeek: days,
    };
  }
  
  return null;
}
