"use client";

import { ChevronDown } from "lucide-react";
import { useState } from "react";
import type { FaqCategory } from "@/config/company-content";

interface FaqAccordionProps {
  categories: readonly FaqCategory[];
}

export function FaqAccordion({ categories }: FaqAccordionProps) {
  const [openIds, setOpenIds] = useState<Record<string, boolean>>({});

  function toggleItem(id: string) {
    setOpenIds((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  }

  return (
    <div className="space-y-10">
      {categories.map((category) => (
        <section key={category.id} aria-labelledby={`faq-cat-${category.id}`}>
          <h2 id={`faq-cat-${category.id}`} className="text-xl font-semibold text-foreground">
            {category.title}
          </h2>
          <div className="mt-4 divide-y divide-border rounded-lg border border-border bg-card">
            {category.items.map((item) => {
              const isOpen = Boolean(openIds[item.id]);
              const panelId = `faq-panel-${item.id}`;
              const buttonId = `faq-button-${item.id}`;

              return (
                <div key={item.id}>
                  <h3>
                    <button
                      id={buttonId}
                      type="button"
                      aria-expanded={isOpen}
                      aria-controls={panelId}
                      onClick={() => toggleItem(item.id)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left text-sm font-medium text-foreground transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <span>{item.question}</span>
                      <ChevronDown
                        className={`h-4 w-4 shrink-0 text-muted-foreground transition-transform ${
                          isOpen ? "rotate-180" : ""
                        }`}
                        aria-hidden="true"
                      />
                    </button>
                  </h3>
                  <div
                    id={panelId}
                    role="region"
                    aria-labelledby={buttonId}
                    hidden={!isOpen}
                    className="px-5 pb-4 text-sm leading-6 text-muted-foreground"
                  >
                    {item.answer}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
