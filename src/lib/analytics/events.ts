export type DiscoveryAnalyticsEvent =
  | {
      name: "public_cta_clicked";
      properties: {
        ctaId: string;
        destination: "/courses" | "/certifications" | "/register" | "/login" | "/contact";
        surface: "hero" | "section" | "course-detail" | "certification-detail";
      };
    }
  | {
      name: "course_viewed";
      properties: {
        slug: string;
        category: string;
        level: string;
      };
    }
  | {
      name: "catalog_filter_changed";
      properties: {
        hasQuery: boolean;
        category: string;
        level: string;
      };
    }
  | {
      name: "certification_track_viewed";
      properties: {
        slug: string;
        issuer: string;
      };
    }
  | {
      name: "contact_submitted";
      properties: {
        topic: string;
        deliveryMode: "resend" | "local-capture";
      };
    };

export interface AnalyticsAdapter {
  readonly enabled: boolean;
  track(event: DiscoveryAnalyticsEvent): void;
}

/**
 * Default no-op adapter. Third-party analytics remain disabled until
 * an approved provider, privacy policy, and consent mechanism are configured.
 */
export const noopAnalyticsAdapter: AnalyticsAdapter = {
  enabled: false,
  track() {
    // Intentionally a no-op while analytics collection is disabled.
  },
};

export function trackDiscoveryEvent(
  event: DiscoveryAnalyticsEvent,
  adapter: AnalyticsAdapter = noopAnalyticsAdapter
): boolean {
  if (!adapter.enabled) {
    return false;
  }
  adapter.track(event);
  return true;
}
