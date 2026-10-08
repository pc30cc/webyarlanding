import type { PostDto } from "@/lib/blog.functions";
import { useContent } from "../content";
import { getBlogContent } from "../content/blog";
import { useRespok } from "../shared/context";

/** Category name for a post, translated when the admin has a translation. */
export function usePostCategory(post: PostDto): string {
  const { t } = useRespok();
  const blog = useContent(getBlogContent);
  return post.categoryName ? t(post.categoryName) : blog.general;
}
