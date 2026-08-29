import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { Loader2, Sparkles, Wand2, Image as ImageIcon, Copy } from "lucide-react";
import { generateBlogPost, improveText, generateImage } from "@/lib/ai.functions";
import { listCategories } from "@/lib/blog.functions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

function GenerateArticleTab() {
  const genFn = useServerFn(generateBlogPost);
  const categoriesFn = useServerFn(listCategories);
  const { data: categories } = useQuery({ queryKey: ["categories"], queryFn: () => categoriesFn() });

  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("حرفه‌ای و روان");
  const [length, setLength] = useState<"short" | "medium" | "long">("medium");
  const [saveAsDraft, setSaveAsDraft] = useState(true);
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [result, setResult] = useState<Awaited<ReturnType<typeof genFn>> | null>(null);

  const mutation = useMutation({
    mutationFn: () => genFn({ data: { topic, tone, length, saveAsDraft, categoryId } }),
    onSuccess: (data) => {
      setResult(data);
      toast.success(data.postId ? "مقاله تولید و به‌عنوان پیش‌نویس ذخیره شد" : "مقاله تولید شد");
    },
    onError: (e: Error) => toast.error(e.message || "خطا در تولید مقاله"),
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <Label>موضوع مقاله</Label>
          <Textarea rows={3} value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="مثلاً: راهنمای کامل سئو داخلی سایت" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-1.5">
            <Label>لحن نوشتار</Label>
            <Input value={tone} onChange={(e) => setTone(e.target.value)} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label>طول متن</Label>
            <Select value={length} onValueChange={(v) => setLength(v as typeof length)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="short">کوتاه</SelectItem>
                <SelectItem value="medium">متوسط</SelectItem>
                <SelectItem value="long">بلند</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>دسته‌بندی</Label>
          <Select value={categoryId ?? "none"} onValueChange={(v) => setCategoryId(v === "none" ? null : v)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="none">بدون دسته‌بندی</SelectItem>
              {categories?.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between">
          <Label>ذخیره به‌عنوان پیش‌نویس</Label>
          <Switch checked={saveAsDraft} onCheckedChange={setSaveAsDraft} />
        </div>
        <Button disabled={!topic.trim() || mutation.isPending} onClick={() => mutation.mutate()} className="gap-2">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          تولید مقاله
        </Button>
      </div>

      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">پیش‌نمایش نتیجه</h3>
        {!result ? (
          <p className="text-sm text-muted-foreground">پس از تولید، نتیجه اینجا نمایش داده می‌شود.</p>
        ) : (
          <div className="flex flex-col gap-2 overflow-auto">
            <p className="font-bold text-foreground">{result.title}</p>
            <p className="text-sm text-muted-foreground">{result.excerpt}</p>
            <div className="flex flex-wrap gap-1">
              {result.tags.map((t) => (
                <span key={t} className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">{t}</span>
              ))}
            </div>
            <Textarea readOnly rows={12} dir="rtl" value={result.content} className="font-mono text-xs" />
          </div>
        )}
      </div>
    </div>
  );
}

function ImproveTextTab() {
  const improveFn = useServerFn(improveText);
  const [text, setText] = useState("");
  const [instruction, setInstruction] = useState("این متن را روان‌تر و حرفه‌ای‌تر کن");
  const [output, setOutput] = useState("");

  const mutation = useMutation({
    mutationFn: () => improveFn({ data: { text, instruction } }),
    onSuccess: (data) => {
      setOutput(data.text);
      toast.success("متن بهبود یافت");
    },
    onError: (e: Error) => toast.error(e.message || "خطا در بهبود متن"),
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <Label>دستور ویرایش</Label>
          <Input value={instruction} onChange={(e) => setInstruction(e.target.value)} />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>متن اصلی</Label>
          <Textarea rows={10} value={text} onChange={(e) => setText(e.target.value)} />
        </div>
        <Button disabled={!text.trim() || mutation.isPending} onClick={() => mutation.mutate()} className="gap-2">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
          بهبود متن
        </Button>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-foreground">متن بهبودیافته</h3>
          {output && (
            <Button size="sm" variant="outline" className="gap-1" onClick={() => { navigator.clipboard.writeText(output); toast.success("کپی شد"); }}>
              <Copy className="h-3.5 w-3.5" /> کپی
            </Button>
          )}
        </div>
        <Textarea readOnly rows={12} value={output} placeholder="نتیجه اینجا نمایش داده می‌شود" />
      </div>
    </div>
  );
}

function GenerateImageTab() {
  const genFn = useServerFn(generateImage);
  const [prompt, setPrompt] = useState("");
  const [alt, setAlt] = useState("");
  const [result, setResult] = useState<{ id: string; url: string } | null>(null);

  const mutation = useMutation({
    mutationFn: () => genFn({ data: { prompt, alt } }),
    onSuccess: (data) => {
      setResult(data);
      toast.success("تصویر تولید و در رسانه‌ها ذخیره شد");
    },
    onError: (e: Error) => toast.error(e.message || "خطا در تولید تصویر"),
  });

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 shadow-sm">
        <div className="flex flex-col gap-1.5">
          <Label>توضیح تصویر (Prompt)</Label>
          <Textarea rows={4} value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder="مثلاً: تصویر کاور مینیمال درباره هوش مصنوعی" />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>متن جایگزین (Alt)</Label>
          <Input value={alt} onChange={(e) => setAlt(e.target.value)} />
        </div>
        <Button disabled={!prompt.trim() || mutation.isPending} onClick={() => mutation.mutate()} className="gap-2">
          {mutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
          تولید تصویر
        </Button>
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm">
        <h3 className="font-semibold text-foreground">پیش‌نمایش</h3>
        {result ? (
          <img src={result.url} alt={alt} className="w-full rounded-lg border border-border object-cover" />
        ) : (
          <p className="text-sm text-muted-foreground">پس از تولید، تصویر اینجا نمایش داده می‌شود.</p>
        )}
      </div>
    </div>
  );
}

export default function AiSection() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">دستیار هوش مصنوعی</h1>
        <p className="text-sm text-muted-foreground">تولید مقاله، بهبود متن و ساخت تصویر با هوش مصنوعی</p>
      </div>
      <Tabs defaultValue="generate">
        <TabsList>
          <TabsTrigger value="generate">تولید مقاله</TabsTrigger>
          <TabsTrigger value="improve">بهبود متن</TabsTrigger>
          <TabsTrigger value="image">تولید تصویر</TabsTrigger>
        </TabsList>
        <TabsContent value="generate" className="mt-6">
          <GenerateArticleTab />
        </TabsContent>
        <TabsContent value="improve" className="mt-6">
          <ImproveTextTab />
        </TabsContent>
        <TabsContent value="image" className="mt-6">
          <GenerateImageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
