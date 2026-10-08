import ReactMarkdown from "react-markdown";

/**
 * Markdown body (blog posts, catalog descriptions). Headings are demoted so the page
 * keeps a single h1. Styling comes from the template through `className`.
 */
export function Markdown({
  children,
  className,
  dir,
}: {
  children: string;
  className?: string;
  dir?: "ltr" | "rtl" | "auto";
}) {
  return (
    <div className={className} dir={dir}>
      <ReactMarkdown
        components={{
          h1: ({ node: _node, ...props }) => <h2 {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
