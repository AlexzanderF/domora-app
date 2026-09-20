"use client";

import { useEffect } from "react";
import { useDemo } from "@/features/requests/demo-provider";
import { categories, isCategoryId } from "@/features/services/catalog";

interface BrowserModelContext {
  registerTool(tool: {
    name: string;
    description: string;
    inputSchema: object;
    annotations: { readOnlyHint: boolean };
    execute: (input: { category: number }) => {
      opened: boolean;
      category: string;
    };
  }): void | Promise<void>;
  unregisterTool?: (name: string) => void;
}

// Progressive enhancement for browsers exposing the prototype's WebMCP API.
export function BrowserBookingTool() {
  const { openBooking } = useDemo();
  useEffect(() => {
    const context = (
      document as Document & { modelContext?: BrowserModelContext }
    ).modelContext;
    if (!context) return;
    const name = "start_domora_request";
    try {
      void Promise.resolve(
        context.registerTool({
          name,
          description: "Отваря формата за нова демо заявка; не изпраща заявка.",
          inputSchema: {
            type: "object",
            properties: {
              category: { type: "integer", minimum: 0, maximum: 5 },
            },
            required: ["category"],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: false },
          execute: (input) => {
            if (!isCategoryId(input.category))
              throw new Error("Невалидна категория");
            openBooking({ category: input.category });
            return { opened: true, category: categories[input.category].name };
          },
        }),
      ).catch(() => {
        /* Unsupported experimental APIs must not block booking. */
      });
    } catch {
      /* Browsers without compatible WebMCP still support the regular form. */
    }
    return () => {
      context.unregisterTool?.(name);
    };
  }, [openBooking]);
  return null;
}
