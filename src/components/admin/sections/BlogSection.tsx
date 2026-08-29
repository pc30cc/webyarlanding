import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, ArrowRight, Search } from "lucide-react";
import {
  adminListPosts,
  adminGetPost,
  adminSavePost,
  adminDeletePost,
  listCategories,
  type PostDto,
  type PostInput,
} from "@/lib/blog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogAction, AlertDialogCancel } from "@/components/ui/alert-dialog";

const emptyPost: PostInput = {
  id: undefined,
  slug: "",
  title: "",
  excerpt: "",
  content: "",
  coverImage: "",
  status: "draft",
  author: "",
  tags: [],
  categoryId: null,
  indexable: true,
  seoTitle: "",
  seoDescription: "",
  canonicalUrl: "",
  robots: "index,follow",
  focusKeyword: "",
};

type View = { mode: "list" } | { mode: "edit"; id: string | null };

export default function BlogSection() {
  const listFn = useServerFn(adminListPosts);
  const getFn = useServerFn(adminGetPost);
  const saveFn = useServerFn(adminSavePost);
  const deleteFn = useServerFn(adminDeletePost);
  const categoriesFn = useServerFn(listCategories);
  const qc = useQueryClient();

  const [view, setView] = useState<View>({ mode: "list" });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [toDelete, setToDelete] = useState<PostDto | null>(null);

  const { data: posts, isLoading } = useQuery({
    queryKey: ["admin-posts", search, statusFilter],
    queryFn: () => {
      const params: { search?: string; status?: string } = {};
      if (search) params.search = search;
      if (statusFilter !== "all") params.status = statusFilter;
      return listFn({ data: params });
    },
  });

  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => categoriesFn() });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("مقاله حذف شد");
      qc.invalidateQueries({ queryKey: ["admin-posts"] });
      setToDelete(null);
    },
    onError: () => toast.error("خطا در حذف مقاله"),
  });

  if (view.mode === "edit") {
    return (
      <PostEditor
        id={view.id}
        categories={categories ?? []}
        getFn={getFn}
        saveFn={saveFn}
        onBack={() => setView({ mode: "list" })}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin-posts"] });
          setView({ mode: "list" });
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">مقالات</h1>
          <p className="text-sm text-muted-foreground">مدیریت مقالات وبلاگ</p>
        </div>
        <Button className="gap-2" onClick={() => setView({ mode: "edit", id: null })}>
          <Plus className="h-4 w-4" /> مقاله جدید
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[220px] flex-1">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="جستجو در عنوان مقالات..." className="pr-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="وضعیت" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">همه وضعیت‌ها</SelectItem>
            <SelectItem value="published">منتشرشده</SelectItem>
            <SelectItem value="draft">پیش‌نویس</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      ) : !posts || posts.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">مقاله‌ای یافت نشد</p>
      ) : (
        <div className="flex flex-col gap-3">
          {posts.map((post) => (
            <div key={post.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex min-w-0 items-center gap-3">
                {post.coverImage && (
                  <img src={post.coverImage} alt={post.title} className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                )}
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="truncate font-semibold text-foreground">{post.title}</h3>
                    <Badge variant={post.status === "published" ? "default" : "secondary"}>
                      {post.status === "published" ? "منتشرشده" : "پیش‌نویس"}
                    </Badge>
                  </div>
                  <p dir="ltr" className="truncate text-xs text-muted-foreground">/{post.slug}</p>
                  {post.categoryName && <p className="text-xs text-muted-foreground">دسته: {post.categoryName}</p>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="gap-1" onClick={() => setView({ mode: "edit", id: post.id })}>
                  <Pencil className="h-3.5 w-3.5" /> ویرایش
                </Button>
                <Button size="sm" variant="destructive" className="gap-1" onClick={() => setToDelete(post)}>
                  <Trash2 className="h-3.5 w-3.5" /> حذف
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف مقاله</AlertDialogTitle>
            <AlertDialogDescription>آیا از حذف «{toDelete?.title}» مطمئن هستید؟ این عمل غیرقابل بازگشت است.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction onClick={() => toDelete && deleteMutation.mutate(toDelete.id)}>حذف</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function PostEditor({
  id,
  categories,
  getFn,
  saveFn,
  onBack,
  onSaved,
}: {
  id: string | null;
  categories: { id: string; name: string }[];
  getFn: ReturnType<typeof useServerFn<typeof adminGetPost>>;
  saveFn: ReturnType<typeof useServerFn<typeof adminSavePost>>;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PostInput>(emptyPost);
  const [tagsText, setTagsText] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-post", id],
    queryFn: () => (id ? getFn({ data: { id } }) : Promise.resolve(null)),
    enabled: !!id,
  });

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        slug: data.slug,
        title: data.title,
        excerpt: data.excerpt,
        content: data.content,
        coverImage: data.coverImage,
        status: data.status as "draft" | "published",
        author: data.author,
        tags: data.tags,
        categoryId: data.categoryId,
        indexable: data.indexable,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        canonicalUrl: data.canonicalUrl,
        robots: data.robots,
        focusKeyword: data.focusKeyword,
      });
      setTagsText(data.tags.join("، "));
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          ...form,
          tags: tagsText
            .split(/[،,]/)
            .map((t) => t.trim())
            .filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("مقاله ذخیره شد");
      onSaved();
    },
    onError: () => toast.error("خطا در ذخیره مقاله"),
  });

  if (id && isLoading) {
    return (
      <div className="flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{id ? "ویرایش مقاله" : "مقاله جدید"}</h1>
          <p className="text-sm text-muted-foreground">اطلاعات محتوایی و سئوی مقاله را وارد کنید</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <Label>عنوان</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>اسلاگ (اختیاری)</Label>
              <Input dir="ltr" value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>خلاصه</Label>
              <Textarea rows={3} value={form.excerpt} onChange={(e) => setForm((f) => ({ ...f, excerpt: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>محتوا (Markdown)</Label>
              <Textarea dir="ltr" rows={16} className="font-mono text-sm" value={form.content} onChange={(e) => setForm((f) => ({ ...f, content: e.target.value }))} />
            </div>
          </section>

          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">سئو</h2>
            <div className="flex flex-col gap-1.5">
              <Label>عنوان سئو</Label>
              <Input value={form.seoTitle} onChange={(e) => setForm((f) => ({ ...f, seoTitle: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>توضیحات سئو</Label>
              <Textarea value={form.seoDescription} onChange={(e) => setForm((f) => ({ ...f, seoDescription: e.target.value }))} />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <Label>آدرس کانونیکال</Label>
                <Input dir="ltr" value={form.canonicalUrl} onChange={(e) => setForm((f) => ({ ...f, canonicalUrl: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>Robots</Label>
                <Input dir="ltr" value={form.robots} onChange={(e) => setForm((f) => ({ ...f, robots: e.target.value }))} />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label>کلمه کلیدی هدف</Label>
                <Input value={form.focusKeyword} onChange={(e) => setForm((f) => ({ ...f, focusKeyword: e.target.value }))} />
              </div>
              <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                <Label className="cursor-pointer">قابل ایندکس</Label>
                <Switch checked={form.indexable} onCheckedChange={(v) => setForm((f) => ({ ...f, indexable: v }))} />
              </div>
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <Label>وضعیت</Label>
              <Select value={form.status} onValueChange={(v) => setForm((f) => ({ ...f, status: v as "draft" | "published" }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">پیش‌نویس</SelectItem>
                  <SelectItem value="published">منتشرشده</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>دسته‌بندی</Label>
              <Select value={form.categoryId ?? "none"} onValueChange={(v) => setForm((f) => ({ ...f, categoryId: v === "none" ? null : v }))}>
                <SelectTrigger><SelectValue placeholder="انتخاب دسته‌بندی" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون دسته‌بندی</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>برچسب‌ها (با ویرگول جدا کنید)</Label>
              <Input value={tagsText} onChange={(e) => setTagsText(e.target.value)} placeholder="مثال: هوش مصنوعی، سئو" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>نویسنده</Label>
              <Input value={form.author} onChange={(e) => setForm((f) => ({ ...f, author: e.target.value }))} />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>تصویر شاخص</Label>
              <Input dir="ltr" value={form.coverImage} onChange={(e) => setForm((f) => ({ ...f, coverImage: e.target.value }))} />
              {form.coverImage && <img src={form.coverImage} alt="" className="mt-2 h-32 w-full rounded-lg object-cover" />}
            </div>
          </section>

          <Button disabled={!form.title || saveMutation.isPending} onClick={() => saveMutation.mutate()} className="w-full gap-2">
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره مقاله
          </Button>
        </div>
      </div>
    </div>
  );
}
