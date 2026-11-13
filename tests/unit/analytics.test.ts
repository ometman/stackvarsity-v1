import { describe, expect, it, vi } from "vitest";
import {
  noopAnalyticsAdapter,
  trackDiscoveryEvent,
  type AnalyticsAdapter,
} from "@/lib/analytics/events";

describe("Privacy-aware discovery analytics contract", () => {
  it("keeps collection disabled by default via noopAnalyticsAdapter", () => {
    const dispatched = trackDiscoveryEvent({
      name: "public_cta_clicked",
      properties: {
        ctaId: "hero-explore-courses",
        destination: "/courses",
        surface: "hero",
      },
    });
    expect(noopAnalyticsAdapter.enabled).toBe(false);
    expect(dispatched).toBe(false);
  });

  it("dispatches typed non-PII events when an enabled adapter is provided", () => {
    const trackMock = vi.fn();
    const enabledAdapter: AnalyticsAdapter = {
      enabled: true,
      track: trackMock,
    };

    const dispatched = trackDiscoveryEvent(
      {
        name: "contact_submitted",
        properties: {
          topic: "Course Information",
          deliveryMode: "local-capture",
        },
      },
      enabledAdapter
    );

    expect(dispatched).toBe(true);
    expect(trackMock).toHaveBeenCalledWith({
      name: "contact_submitted",
      properties: {
        topic: "Course Information",
        deliveryMode: "local-capture",
      },
    });
  });
});
