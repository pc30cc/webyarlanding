import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Pencil, ArrowRight, Eye, EyeOff, GripVertical } from "lucide-react";
import {
  adminListCatalogCategories,
  adminSaveCatalogCategory,
  adminDeleteCatalogCategory,
  adminListCatalogItems,
  adminGetCatalogItem,
  adminSaveCatalogItem,
  adminDeleteCatalogItem,
  type CatalogType,
  type CatalogItemDto,
} from "@/lib/catalog.functions";
import { ICON_NAMES, getIcon } from "@/lib/icon-registry";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

const emptyCategory = { id: undefined as string | undefined, name: "", sortOrder: 0 };

type View = { mode: "list" } | { mode: "edit"; id: string | null };

export default function CatalogSection() {
  const [type, setType] = useState<CatalogType>("product");
  const [view, setView] = useState<View>({ mode: "list" });

  const categoriesListFn = useServerFn(adminListCatalogCategories);
  const categorySaveFn = useServerFn(adminSaveCatalogCategory);
  const categoryDeleteFn = useServerFn(adminDeleteCatalogCategory);
  const itemsListFn = useServerFn(adminListCatalogItems);
  const itemGetFn = useServerFn(adminGetCatalogItem);
  const itemSaveFn = useServerFn(adminSaveCatalogItem);
  const itemDeleteFn = useServerFn(adminDeleteCatalogItem);
  const qc = useQueryClient();

  const { data: categories, isLoading: categoriesLoading } = useQuery({
    queryKey: ["admin-catalog-categories", type],
    queryFn: () => categoriesListFn({ data: { type } }),
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["admin-catalog-items", type],
    queryFn: () => itemsListFn({ data: { type } }),
  });

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [catForm, setCatForm] = useState(emptyCategory);
  const [catToDelete, setCatToDelete] = useState<{ id: string; name: string } | null>(null);
  const [itemToDelete, setItemToDelete] = useState<CatalogItemDto | null>(null);

  const saveCategoryMutation = useMutation({
    mutationFn: () => categorySaveFn({ data: { ...catForm, type } }),
    onSuccess: () => {
      toast.success("دسته‌بندی ذخیره شد");
      qc.invalidateQueries({ queryKey: ["admin-catalog-categories", type] });
      setCatDialogOpen(false);
    },
    onError: () => toast.error("خطا در ذخیره دسته‌بندی"),
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: (id: string) => categoryDeleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("دسته‌بندی حذف شد");
      qc.invalidateQueries({ queryKey: ["admin-catalog-categories", type] });
      qc.invalidateQueries({ queryKey: ["admin-catalog-items", type] });
      setCatToDelete(null);
    },
    onError: () => toast.error("خطا در حذف دسته‌بندی"),
  });

  const deleteItemMutation = useMutation({
    mutationFn: (id: string) => itemDeleteFn({ data: { id } }),
    onSuccess: () => {
      toast.success("آیتم حذف شد");
      qc.invalidateQueries({ queryKey: ["admin-catalog-items", type] });
      setItemToDelete(null);
    },
    onError: () => toast.error("خطا در حذف آیتم"),
  });

  const togglePublishedMutation = useMutation({
    mutationFn: (item: CatalogItemDto) =>
      itemSaveFn({
        data: {
          id: item.id,
          type: item.type,
          categoryId: item.categoryId,
          slug: item.slug,
          icon: item.icon,
          title: item.title,
          shortDesc: item.shortDesc,
          description: item.description,
          bullets: item.bullets,
          sortOrder: item.sortOrder,
          published: !item.published,
        },
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-catalog-items", type] }),
    onError: () => toast.error("خطا در تغییر وضعیت"),
  });

  if (view.mode === "edit") {
    return (
      <ItemEditor
        id={view.id}
        type={type}
        categories={categories ?? []}
        getFn={itemGetFn}
        saveFn={itemSaveFn}
        onBack={() => setView({ mode: "list" })}
        onSaved={() => {
          qc.invalidateQueries({ queryKey: ["admin-catalog-items", type] });
          setView({ mode: "list" });
        }}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-foreground">محصولات و راه‌کارها</h1>
          <p className="text-sm text-muted-foreground">
            محتوای صفحات /products و /solutions و مگامنوی سربرگ سایت از همین‌جا مدیریت می‌شود
          </p>
        </div>
        <Tabs value={type} onValueChange={(v) => setType(v as CatalogType)}>
          <TabsList>
            <TabsTrigger value="product">محصولات</TabsTrigger>
            <TabsTrigger value="solution">راه‌کارها</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-foreground">دسته‌بندی‌ها</h2>
          <Button
            size="sm"
            variant="outline"
            className="gap-1.5"
            onClick={() => {
              setCatForm(emptyCategory);
              setCatDialogOpen(true);
            }}
          >
            <Plus className="h-3.5 w-3.5" /> دسته‌بندی جدید
          </Button>
        </div>
        {categoriesLoading ? (
          <Skeleton className="h-16 w-full" />
        ) : !categories || categories.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            هنوز دسته‌بندی‌ای ثبت نشده — اول یک دسته‌بندی بسازید، بعد آیتم اضافه کنید
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className="flex items-center gap-1.5 rounded-full border border-border bg-secondary/40 py-1 pe-1 ps-3 text-sm"
              >
                <span className="text-foreground">{cat.title}</span>
                <span className="text-xs text-muted-foreground">({cat.itemCount})</span>
                <button
                  type="button"
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                  onClick={() => {
                    setCatForm({ id: cat.id, name: cat.title, sortOrder: cat.sortOrder });
                    setCatDialogOpen(true);
                  }}
                >
                  <Pencil className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                  onClick={() => setCatToDelete({ id: cat.id, name: cat.title })}
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">آیتم‌ها</h2>
        <Button className="gap-2" onClick={() => setView({ mode: "edit", id: null })}>
          <Plus className="h-4 w-4" /> آیتم جدید
        </Button>
      </div>

      {itemsLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      ) : !items || items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          هنوز آیتمی ثبت نشده است
        </p>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((item) => {
            const Icon = getIcon(item.icon);
            return (
              <div
                key={item.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                    <Icon className="h-4.5 w-4.5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate text-sm font-semibold text-foreground">
                        {item.title}
                      </h3>
                      {!item.published && <Badge variant="secondary">پیش‌نویس</Badge>}
                    </div>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.categoryTitle ?? "بدون دسته"} ·{" "}
                      <span dir="ltr">
                        /{type === "product" ? "products" : "solutions"}/{item.slug}
                      </span>
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="gap-1"
                    onClick={() => togglePublishedMutation.mutate(item)}
                    title={item.published ? "پنهان کردن از سایت" : "انتشار در سایت"}
                  >
                    {item.published ? (
                      <Eye className="h-3.5 w-3.5" />
                    ) : (
                      <EyeOff className="h-3.5 w-3.5" />
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1"
                    onClick={() => setView({ mode: "edit", id: item.id })}
                  >
                    <Pencil className="h-3.5 w-3.5" /> ویرایش
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                    onClick={() => setItemToDelete(item)}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={catDialogOpen} onOpenChange={setCatDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{catForm.id ? "ویرایش دسته‌بندی" : "دسته‌بندی جدید"}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1.5">
              <Label>نام دسته‌بندی</Label>
              <Input
                value={catForm.name}
                onChange={(e) => setCatForm((f) => ({ ...f, name: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>ترتیب نمایش</Label>
              <Input
                type="number"
                value={catForm.sortOrder}
                onChange={(e) =>
                  setCatForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              disabled={!catForm.name || saveCategoryMutation.isPending}
              onClick={() => saveCategoryMutation.mutate()}
              className="gap-2"
            >
              {saveCategoryMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!catToDelete} onOpenChange={(v) => !v && setCatToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف دسته‌بندی</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{catToDelete?.name}» مطمئن هستید؟ آیتم‌های این دسته حذف نمی‌شوند، فقط بدون
              دسته‌بندی می‌مانند.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => catToDelete && deleteCategoryMutation.mutate(catToDelete.id)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!itemToDelete} onOpenChange={(v) => !v && setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>حذف آیتم</AlertDialogTitle>
            <AlertDialogDescription>
              آیا از حذف «{itemToDelete?.title}» مطمئن هستید؟ این عمل غیرقابل بازگشت است.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>انصراف</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => itemToDelete && deleteItemMutation.mutate(itemToDelete.id)}
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

interface ItemFormState {
  id?: string | undefined;
  categoryId: string | null;
  slug: string;
  icon: string;
  title: string;
  shortDesc: string;
  description: string;
  bullets: string[];
  sortOrder: number;
  published: boolean;
}

const emptyItem: ItemFormState = {
  id: undefined,
  categoryId: null,
  slug: "",
  icon: "Sparkles",
  title: "",
  shortDesc: "",
  description: "",
  bullets: [""],
  sortOrder: 0,
  published: true,
};

function ItemEditor({
  id,
  type,
  categories,
  getFn,
  saveFn,
  onBack,
  onSaved,
}: {
  id: string | null;
  type: CatalogType;
  categories: { id: string; title: string }[];
  getFn: ReturnType<typeof useServerFn<typeof adminGetCatalogItem>>;
  saveFn: ReturnType<typeof useServerFn<typeof adminSaveCatalogItem>>;
  onBack: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<ItemFormState>(emptyItem);

  const { data, isLoading } = useQuery({
    queryKey: ["admin-catalog-item", id],
    queryFn: () => (id ? getFn({ data: { id } }) : Promise.resolve(null)),
    enabled: !!id,
  });

  useEffect(() => {
    if (data) {
      setForm({
        id: data.id,
        categoryId: data.categoryId,
        slug: data.slug,
        icon: data.icon,
        title: data.title,
        shortDesc: data.shortDesc,
        description: data.description,
        bullets: data.bullets.length > 0 ? data.bullets : [""],
        sortOrder: data.sortOrder,
        published: data.published,
      });
    }
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: () =>
      saveFn({
        data: {
          ...form,
          type,
          bullets: form.bullets.map((b) => b.trim()).filter(Boolean),
        },
      }),
    onSuccess: () => {
      toast.success("آیتم ذخیره شد");
      onSaved();
    },
    onError: () => toast.error("خطا در ذخیره آیتم"),
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

  function updateBullet(index: number, value: string) {
    setForm((f) => ({ ...f, bullets: f.bullets.map((b, i) => (i === index ? value : b)) }));
  }
  function addBullet() {
    setForm((f) => ({ ...f, bullets: [...f.bullets, ""] }));
  }
  function removeBullet(index: number) {
    setForm((f) => ({ ...f, bullets: f.bullets.filter((_, i) => i !== index) }));
  }

  const SelectedIcon = getIcon(form.icon);
  const basePath = type === "product" ? "/products" : "/solutions";

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button variant="outline" size="icon" onClick={onBack}>
          <ArrowRight className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{id ? "ویرایش آیتم" : "آیتم جدید"}</h1>
          <p className="text-sm text-muted-foreground">
            این آیتم در مگامنوی سربرگ، صفحه {type === "product" ? "محصولات" : "راه‌کارها"} و یک صفحه
            اختصاصی نمایش داده می‌شود
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="flex flex-col gap-4 lg:col-span-2">
          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <Label>عنوان</Label>
              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>اسلاگ (آدرس، اختیاری)</Label>
              <div className="flex items-center gap-2">
                <span dir="ltr" className="shrink-0 text-xs text-muted-foreground">
                  {basePath}/
                </span>
                <Input
                  dir="ltr"
                  value={form.slug}
                  onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>توضیح کوتاه (برای مگامنو و کارت لیست)</Label>
              <Input
                value={form.shortDesc}
                onChange={(e) => setForm((f) => ({ ...f, shortDesc: e.target.value }))}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label>محتوای کامل صفحه اختصاصی (Markdown)</Label>
              <p className="text-xs text-muted-foreground">
                این متن، مقاله اصلی صفحه است — هرچه کامل‌تر و طولانی‌تر باشد برای سئوی گوگل بهتر
                است. از ## برای زیرعنوان و پاراگراف‌های جدا برای متن استفاده کنید.
              </p>
              <Textarea
                rows={14}
                dir="rtl"
                className="font-mono text-sm"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>
          </section>

          <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <Label>امکانات (بولت‌های صفحه اختصاصی)</Label>
              <Button size="sm" variant="outline" className="gap-1" onClick={addBullet}>
                <Plus className="h-3.5 w-3.5" /> افزودن
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              {form.bullets.map((b, i) => (
                <div key={i} className="flex items-center gap-2">
                  <Input
                    value={b}
                    onChange={(e) => updateBullet(i, e.target.value)}
                    placeholder="یک قابلیت..."
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="shrink-0 text-muted-foreground"
                    onClick={() => removeBullet(i)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="flex flex-col gap-4">
          <section className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex flex-col gap-1.5">
              <Label>دسته‌بندی</Label>
              <Select
                value={form.categoryId ?? "none"}
                onValueChange={(v) =>
                  setForm((f) => ({ ...f, categoryId: v === "none" ? null : v }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="انتخاب دسته‌بندی" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">بدون دسته‌بندی</SelectItem>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>آیکون</Label>
              <div className="flex items-center gap-2 rounded-lg border border-border p-2">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-primary/10">
                  <SelectedIcon className="h-4 w-4 text-primary" />
                </div>
                <Select
                  value={form.icon}
                  onValueChange={(v) => setForm((f) => ({ ...f, icon: v }))}
                >
                  <SelectTrigger className="border-0 shadow-none">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="max-h-64">
                    {ICON_NAMES.map((name) => {
                      const IconOption = getIcon(name);
                      return (
                        <SelectItem key={name} value={name}>
                          <span className="flex items-center gap-2">
                            <IconOption className="h-4 w-4" /> {name}
                          </span>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <Label>ترتیب نمایش</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm((f) => ({ ...f, sortOrder: Number(e.target.value) || 0 }))}
              />
            </div>

            <div className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
              <Label className="cursor-pointer">منتشرشده (نمایش در سایت)</Label>
              <Switch
                checked={form.published}
                onCheckedChange={(v) => setForm((f) => ({ ...f, published: v }))}
              />
            </div>
          </section>

          <Button
            disabled={!form.title || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="w-full gap-2"
          >
            {saveMutation.isPending && <Loader2 className="h-4 w-4 animate-spin" />} ذخیره آیتم
          </Button>
          <p className="text-xs text-muted-foreground">
            عنوان و توضیحات سئوی این صفحه (متا‌تگ‌ها) را می‌توانید جداگانه از بخش «سئو» برای مسیر{" "}
            <span dir="ltr">
              {basePath}/{form.slug || "..."}
            </span>{" "}
            تنظیم کنید.
          </p>
        </div>
      </div>
    </div>
  );
}
