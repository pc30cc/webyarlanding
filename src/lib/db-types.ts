// تایپ ردیف جدول‌های db/schema.sql برای کلاینت pg-db.server (فقط نوع؛ هیچ کدی اجرا نمی‌کند).
// با هر تغییر در db/schema.sql این فایل را هم به‌روز کنید: ستون nullable یعنی «| null»، و
// ستونی که nullable است یا مقدار پیش‌فرض دارد در فهرست دوم (اختیاری هنگام درج) می‌آید.

/** ستون‌های ردیف، و ستون‌هایی که هنگام درج می‌توان ننوشت (nullable یا دارای DEFAULT) */
export interface TableDef<TRow, TOptional extends keyof TRow> {
  Row: TRow;
  Insert: Simplify<Omit<TRow, TOptional> & Partial<Pick<TRow, TOptional>>>;
  Update: Partial<TRow>;
}

type Simplify<T> = { [K in keyof T]: T[K] } & {};

export interface DbTables {
  app_download_clicks: TableDef<
    {
      app_id: string;
      created_at: string;
      id: string;
      platform: string;
      referrer: string | null;
      user_agent: string | null;
    },
    "created_at" | "platform" | "referrer" | "user_agent"
  >;
  apps: TableDef<
    {
      created_at: string;
      description: string;
      download_url: string;
      enabled: number;
      features_json: string;
      icon_url: string;
      id: string;
      min_os: string;
      name: string;
      platform: string;
      screenshots_json: string;
      short_desc: string;
      size: string;
      slug: string;
      sort_order: number;
      subtitle: string;
      updated_at: string;
      version: string;
    },
    | "created_at"
    | "description"
    | "download_url"
    | "enabled"
    | "features_json"
    | "icon_url"
    | "min_os"
    | "platform"
    | "screenshots_json"
    | "short_desc"
    | "size"
    | "sort_order"
    | "subtitle"
    | "updated_at"
    | "version"
  >;
  autoblog_runs: TableDef<
    {
      details: string | null;
      error: string | null;
      finished_at: string | null;
      id: string;
      post_ids: string;
      posts_created: number;
      posts_requested: number;
      started_at: string;
      status: string;
      trigger_source: string;
    },
    | "details"
    | "error"
    | "finished_at"
    | "post_ids"
    | "posts_created"
    | "posts_requested"
    | "started_at"
    | "status"
    | "trigger_source"
  >;
  autoblog_settings: TableDef<
    {
      author: string | null;
      category_id: string | null;
      created_at: string;
      enabled: number;
      id: string;
      last_run_at: string | null;
      master_prompt: string;
      next_topic_seed: number;
      posts_per_day: number;
      publish_status: string;
      run_hours: string;
      topic_pool: string;
      total_generated: number;
      updated_at: string;
      with_image: number;
    },
    | "author"
    | "category_id"
    | "created_at"
    | "enabled"
    | "last_run_at"
    | "master_prompt"
    | "next_topic_seed"
    | "posts_per_day"
    | "publish_status"
    | "run_hours"
    | "topic_pool"
    | "total_generated"
    | "updated_at"
    | "with_image"
  >;
  backup_runs: TableDef<
    {
      checksum: string | null;
      error: string | null;
      filename: string | null;
      finished_at: string | null;
      id: string;
      path: string | null;
      provider: string | null;
      row_count: number;
      size_bytes: number | null;
      started_at: string;
      status: string;
      table_count: number;
      trigger_source: string;
    },
    | "checksum"
    | "error"
    | "filename"
    | "finished_at"
    | "path"
    | "provider"
    | "row_count"
    | "size_bytes"
    | "started_at"
    | "status"
    | "table_count"
    | "trigger_source"
  >;
  blog_categories: TableDef<
    {
      created_at: string;
      description: string | null;
      id: string;
      name: string;
      parent_id: string | null;
      seo_description: string | null;
      seo_title: string | null;
      slug: string;
      sort_order: number;
      updated_at: string;
    },
    | "created_at"
    | "description"
    | "parent_id"
    | "seo_description"
    | "seo_title"
    | "sort_order"
    | "updated_at"
  >;
  blog_post_tags: TableDef<
    {
      created_at: string;
      post_id: string;
      tag_id: string;
    },
    "created_at"
  >;
  blog_posts: TableDef<
    {
      author: string | null;
      canonical_url: string | null;
      category_id: string | null;
      content: string | null;
      cover_image: string | null;
      created_at: string;
      excerpt: string | null;
      focus_keyword: string | null;
      id: string;
      indexable: number;
      published_at: string | null;
      robots: string;
      seo_description: string | null;
      seo_title: string | null;
      slug: string;
      status: string;
      tags_csv: string;
      title: string;
      updated_at: string;
    },
    | "author"
    | "canonical_url"
    | "category_id"
    | "content"
    | "cover_image"
    | "created_at"
    | "excerpt"
    | "focus_keyword"
    | "indexable"
    | "published_at"
    | "robots"
    | "seo_description"
    | "seo_title"
    | "status"
    | "tags_csv"
    | "updated_at"
  >;
  blog_tags: TableDef<
    {
      created_at: string;
      description: string | null;
      id: string;
      name: string;
      seo_description: string | null;
      seo_title: string | null;
      slug: string;
      sort_order: number;
      updated_at: string;
    },
    "created_at" | "description" | "seo_description" | "seo_title" | "sort_order" | "updated_at"
  >;
  catalog_categories: TableDef<
    {
      created_at: string;
      id: string;
      name: string;
      sort_order: number;
      type: string;
      updated_at: string;
    },
    "created_at" | "sort_order" | "updated_at"
  >;
  catalog_items: TableDef<
    {
      bullets_json: string;
      category_id: string | null;
      created_at: string;
      description: string;
      icon: string;
      id: string;
      published: number;
      short_desc: string;
      slug: string;
      sort_order: number;
      title: string;
      type: string;
      updated_at: string;
    },
    | "bullets_json"
    | "category_id"
    | "created_at"
    | "description"
    | "icon"
    | "published"
    | "short_desc"
    | "sort_order"
    | "updated_at"
  >;
  contact_messages: TableDef<
    {
      created_at: string;
      email: string | null;
      id: string;
      ip_address: string | null;
      message: string;
      name: string;
      phone: string | null;
      status: string;
      subject: string | null;
    },
    "created_at" | "email" | "ip_address" | "phone" | "status" | "subject"
  >;
  login_attempts: TableDef<
    {
      created_at: string;
      email: string;
      id: string;
      ip_address: string | null;
      reason: string | null;
      success: number;
      user_agent: string | null;
    },
    "created_at" | "ip_address" | "reason" | "success" | "user_agent"
  >;
  media_assets: TableDef<
    {
      alt: string | null;
      created_at: string;
      filename: string;
      height: number | null;
      id: string;
      mime_type: string | null;
      path: string;
      provider: string;
      size_bytes: number | null;
      updated_at: string;
      uploaded_by: string | null;
      url: string;
      width: number | null;
    },
    | "alt"
    | "created_at"
    | "height"
    | "mime_type"
    | "size_bytes"
    | "updated_at"
    | "uploaded_by"
    | "width"
  >;
  scheduler_runs: TableDef<
    {
      job: string;
      last_note: string | null;
      last_run_at: string;
      last_status: string | null;
    },
    "last_note" | "last_run_at" | "last_status"
  >;
  seo_pages: TableDef<
    {
      canonical_url: string | null;
      created_at: string;
      description: string | null;
      id: string;
      locale: string | null;
      og_image: string | null;
      page_key: string;
      path: string;
      robots: string;
      schema_json: string | null;
      title: string | null;
      updated_at: string;
    },
    | "canonical_url"
    | "created_at"
    | "description"
    | "locale"
    | "og_image"
    | "path"
    | "robots"
    | "schema_json"
    | "title"
    | "updated_at"
  >;
  seo_proposals: TableDef<
    {
      action: string;
      after_json: string;
      applied_at: string | null;
      before_json: string;
      created_at: string;
      decided_at: string | null;
      detail: string;
      error: string;
      id: string;
      kind: string;
      severity: string;
      source: string;
      status: string;
      target: string;
      title: string;
    },
    | "after_json"
    | "applied_at"
    | "before_json"
    | "created_at"
    | "decided_at"
    | "detail"
    | "error"
    | "kind"
    | "severity"
    | "source"
    | "status"
    | "target"
    | "title"
  >;
  settings: TableDef<
    {
      id: string;
      is_private: number;
      setting_key: string;
      setting_value: string;
      updated_at: string;
    },
    "is_private" | "setting_value" | "updated_at"
  >;
  site_presence: TableDef<
    {
      last_seen: string;
      path: string;
      session_id: string;
    },
    "last_seen"
  >;
  site_visits: TableDef<
    {
      created_at: string;
      id: string;
      path: string;
      session_id: string;
    },
    "created_at"
  >;
  user_sessions: TableDef<
    {
      created_at: string;
      expires_at: string;
      id: string;
      ip_address: string | null;
      token_hash: string;
      user_agent: string | null;
      user_id: string;
    },
    "created_at" | "ip_address" | "user_agent"
  >;
  users: TableDef<
    {
      created_at: string;
      display_name: string | null;
      email: string;
      id: string;
      is_active: number;
      last_login_at: string | null;
      password_hash: string;
      role: string;
      updated_at: string;
    },
    "created_at" | "display_name" | "is_active" | "last_login_at" | "role" | "updated_at"
  >;
}

export type TableName = keyof DbTables;
export type TableRow<T extends TableName> = DbTables[T]["Row"];
export type TableInsert<T extends TableName> = DbTables[T]["Insert"];
export type TableUpdate<T extends TableName> = DbTables[T]["Update"];
