import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listLoginAttempts } from "@/lib/admin.functions";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleString("fa-IR");
  } catch {
    return iso;
  }
}

export default function LoginLogsSection() {
  const listFn = useServerFn(listLoginAttempts);
  const { data, isLoading } = useQuery({ queryKey: ["login-attempts"], queryFn: () => listFn() });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">تاریخچه ورود</h1>
        <p className="text-sm text-muted-foreground">لیست تلاش‌های ورود موفق و ناموفق به پنل مدیریت</p>
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full" />
      ) : !data || data.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">هیچ رکوردی ثبت نشده است</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border bg-card shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-right">ایمیل</TableHead>
                <TableHead className="text-right">وضعیت</TableHead>
                <TableHead className="text-right">آدرس IP</TableHead>
                <TableHead className="text-right">مرورگر</TableHead>
                <TableHead className="text-right">توضیح</TableHead>
                <TableHead className="text-right">تاریخ</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.id}>
                  <TableCell className="font-medium text-foreground" dir="ltr">{row.email}</TableCell>
                  <TableCell>
                    {row.success ? (
                      <Badge className="bg-green-600 text-white hover:bg-green-600">موفق</Badge>
                    ) : (
                      <Badge variant="destructive">ناموفق</Badge>
                    )}
                  </TableCell>
                  <TableCell dir="ltr" className="text-muted-foreground">{row.ipAddress ?? "-"}</TableCell>
                  <TableCell className="max-w-[220px] truncate text-xs text-muted-foreground" dir="ltr" title={row.userAgent ?? ""}>{row.userAgent ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{row.reason ?? "-"}</TableCell>
                  <TableCell className="text-muted-foreground">{formatDate(row.createdAt)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
