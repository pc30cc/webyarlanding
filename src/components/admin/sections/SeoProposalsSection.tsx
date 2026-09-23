import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles, Check, X, ChevronDown, ChevronUp } from "lucide-react";
import {
  listSeoProposals,
  runSeoReviewNow,
  decideSeoProposal,
  approveAllSeoProposals,
} from "@/lib/seoproposals.functions";
import type { SeoProposal } from "@/lib/seoproposals.server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

function errMsg(e: unknown): string {
  return e instanceof Error ? e.message : "خطای نامشخص";
}

const STATUS_FA: Record<string, string> = {
  pending: "در انتظار تأیید",
  applied: "اعمال شد",
  rejected: "رد شد",
  failed: "ناموفق",
  approved: "تأییدشده",
};

function preview(json: string): string {
  if (!json) return "";
  try {
    const value = JSON.parse(json) as unknown;
    if (value === null) return "";
    if (typeof value === "string") return value;
    return Object.entries(value as Record<string, unknown>)
      .filter(([k]) => k !== "postId" && k !== "id")
      .map(([k, v]) => `${k}: ${String(v ?? "").slice(0, 1200)}`)
      .join("\n\n");
  } catch {
    return json.slice(0, 1200);
  }
}

function ProposalCard({
  item,
  onDecide,
  busy,
}: {
  item: SeoProposal;
  onDecide: (id: string, approve: boolean) => void;
  busy: boolean;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-lg border p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="secondary">{item.kind}</Badge>
            <Badge variant={item.status === "pending" ? "default" : "outline"}>
              {STATUS_FA[item.status] ?? item.status}
            </Badge>
            <span className="text-xs text-muted-foreground">{item.target}</span>
          </div>
          <p className="font-medium">{item.title}</p>
          <p className="whitespace-pre-line text-sm text-muted-foreground">{item.detail}</p>
          {item.error ? <p className="text-sm text-destructive">{item.error}</p> : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setOpen((v) => !v)}>
            {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            پیش‌نمایش
          </Button>
          {item.status === "pending" ? (
            <>
              <Button size="sm" disabled={busy} onClick={() => onDecide(item.id, true)}>
                <Check className="size-4" />
                تأیید و اعمال
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy}
                onClick={() => onDecide(item.id, false)}
              >
                <X className="size-4" />
                رد
              </Button>
            </>
          ) : null}
        </div>
      </div>
      {open ? (
        <div className="mt-3 grid gap-3 md:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">وضعیت فعلی</p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
              {preview(item.before) || "—"}
            </pre>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">پیشنهاد هوش مصنوعی</p>
            <pre className="max-h-64 overflow-auto whitespace-pre-wrap rounded-md bg-muted p-3 text-xs">
              {preview(item.after) || "—"}
            </pre>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function SeoProposalsSection() {
  const queryClient = useQueryClient();
  const listFn = useServerFn(listSeoProposals);
  const reviewFn = useServerFn(runSeoReviewNow);
  const decideFn = useServerFn(decideSeoProposal);
  const approveAllFn = useServerFn(approveAllSeoProposals);

  const { data: items, isLoading } = useQuery({
    queryKey: ["seo-proposals"],
    queryFn: () => listFn(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["seo-proposals"] });

  const review = useMutation({
    mutationFn: () => reviewFn(),
    onSuccess: (r) => {
      toast.success(
        r.created.length > 0
          ? `${r.created.length} پیشنهاد تازه ساخته شد`
          : "پیشنهاد تازه‌ای پیدا نشد",
      );
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const decide = useMutation({
    mutationFn: (v: { id: string; approve: boolean }) => decideFn({ data: v }),
    onSuccess: (r) => {
      if (r.ok) toast.success(r.status === "applied" ? "روی سایت اعمال شد" : "پیشنهاد رد شد");
      else toast.error(r.error ?? "اعمال نشد");
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const approveAll = useMutation({
    mutationFn: () => approveAllFn(),
    onSuccess: (r) => {
      toast.success(`${r.applied} مورد اعمال شد${r.failed ? ` — ${r.failed} مورد ناموفق` : ""}`);
      refresh();
    },
    onError: (e) => toast.error(errMsg(e)),
  });

  const pending = (items ?? []).filter((i) => i.status === "pending");
  const others = (items ?? []).filter((i) => i.status !== "pending");
  const busy = decide.isPending || approveAll.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-5" />
          پیشنهادهای هوشمند سئو و محتوا
        </CardTitle>
        <CardDescription>
          هوش مصنوعی هر شب سایت را بررسی می‌کند و پیشنهادهایش را اینجا می‌گذارد. هیچ تغییری بدون
          تأیید شما روی سایت اعمال نمی‌شود.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Button onClick={() => review.mutate()} disabled={review.isPending}>
            {review.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Sparkles className="size-4" />
            )}
            بررسی همین حالا
          </Button>
          <Button
            variant="outline"
            onClick={() => approveAll.mutate()}
            disabled={busy || pending.length === 0}
          >
            <Check className="size-4" />
            تأیید همه ({pending.length})
          </Button>
        </div>

        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> در حال بارگذاری…
          </div>
        ) : null}

        {pending.length === 0 && !isLoading ? (
          <p className="text-sm text-muted-foreground">پیشنهادی در انتظار تأیید نیست.</p>
        ) : null}

        <div className="space-y-3">
          {pending.map((item) => (
            <ProposalCard
              key={item.id}
              item={item}
              busy={busy}
              onDecide={(id, approve) => decide.mutate({ id, approve })}
            />
          ))}
        </div>

        {others.length > 0 ? (
          <div className="space-y-3 pt-4">
            <p className="text-sm font-medium">تاریخچه</p>
            {others.slice(0, 30).map((item) => (
              <ProposalCard
                key={item.id}
                item={item}
                busy={busy}
                onDecide={(id, approve) => decide.mutate({ id, approve })}
              />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
