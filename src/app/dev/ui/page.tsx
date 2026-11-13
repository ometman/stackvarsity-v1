import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, Mail, Search, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export const metadata: Metadata = {
  title: "UI Component Showcase (Dev Only) | Stack Varsity",
  robots: { index: false, follow: false },
};

export default function DevUiShowcasePage() {
  if (process.env.NODE_ENV !== "development") {
    notFound();
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-12">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">Dev Only</Badge>
          <Badge variant="outline">shadcn/ui + Tailwind v4</Badge>
        </div>
        <h1 className="text-3xl font-semibold tracking-tight">UI Foundation Showcase</h1>
        <p className="text-muted-foreground">
          Temporary development verification route for Stack Varsity V1 base UI primitives and
          Lucide icons.
        </p>
      </header>

      <Separator />

      <section aria-labelledby="buttons-heading" className="space-y-4">
        <h2 id="buttons-heading" className="text-xl font-medium">
          Buttons &amp; Icons
        </h2>
        <div className="flex flex-wrap items-center gap-3">
          <Button>
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Primary Action
          </Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline" size="icon" aria-label="Search components">
            <Search className="size-4" aria-hidden="true" />
          </Button>
        </div>
      </section>

      <Separator />

      <section aria-labelledby="card-form-heading" className="space-y-4">
        <h2 id="card-form-heading" className="text-xl font-medium">
          Card, Form Controls &amp; Badges
        </h2>
        <Card className="max-w-md">
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle>Learner Sign-In Preview</CardTitle>
              <Badge>
                <ShieldCheck className="size-3.5" aria-hidden="true" />
                Accessible
              </Badge>
            </div>
            <CardDescription>
              Demonstrates Card, Label, Input, Button, and icon accessibility conventions.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="dev-email">Email address</Label>
              <Input
                id="dev-email"
                type="email"
                placeholder="learner@mystackvarsity.com"
                autoComplete="email"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-end gap-2">
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button type="button">
              <Mail className="size-4" aria-hidden="true" />
              Continue
            </Button>
          </CardFooter>
        </Card>
      </section>
    </main>
  );
}
