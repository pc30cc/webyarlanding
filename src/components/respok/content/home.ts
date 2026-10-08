import {
  BarChart3,
  BookOpen,
  Bot,
  Eye,
  Globe,
  Layers,
  Mail,
  MessageSquare,
  Phone,
  Plug,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  siGmail,
  siInstagram,
  siPrestashop,
  siShopify,
  siTelegram,
  siWhatsapp,
  siWoocommerce,
  siWordpress,
} from "simple-icons";
import { gate, joinEn, type ContentFlags, type FaqCopy, type FeatureCopy, type FeatureNeed } from ".";

export interface ChannelCopy {
  name: string;
  /** Brand color without "#". */
  hex: string;
  /** 24×24 SVG path (simple-icons) … */
  path?: string;
  viewBox?: string;
  /** … or an image in /public. */
  img?: string;
  /** Being rolled out: shown with a "soon" mark. */
  soon?: boolean;
}

export interface ModuleGroupCopy {
  title: string;
  icon: LucideIcon;
  items: string[];
  needs?: FeatureNeed;
}

export interface ConversationCopy {
  name: string;
  message: string;
  time: string;
  avatar: string;
  needs?: FeatureNeed;
}

/** Every channel the unified inbox shows on the Persian home page. */
const CHANNELS: ChannelCopy[] = [
  { name: "Telegram", hex: "26A5E4", path: siTelegram.path },
  { name: "WhatsApp", hex: "25D366", path: siWhatsapp.path },
  { name: "Instagram", hex: "FF0069", path: siInstagram.path },
  { name: "Bale", hex: "4CEBB4", img: "/brands/bale.svg" },
  { name: "Gmail", hex: "EA4335", path: siGmail.path },
  {
    name: "Yahoo Mail",
    hex: "6001D2",
    path: "M18.86 1.56L14.27 11.87H19.4L24 1.56H18.86M0 6.71L5.15 18.27L3.3 22.44H7.83L14.69 6.71H10.19L7.39 13.44L4.62 6.71H0M15.62 12.87C13.95 12.87 12.71 14.12 12.71 15.58C12.71 17 13.91 18.19 15.5 18.19C17.18 18.19 18.43 16.96 18.43 15.5C18.43 14.03 17.23 12.87 15.62 12.87Z",
  },
  {
    name: "WHMCS",
    hex: "840FFF",
    path: "M1.93206 17.9126C-0.935444 14.0008 -0.616832 8.46645 2.92652 4.92173C6.83675 1.02931 13.1607 1.01965 17.0709 4.93139C20.9812 8.84313 20.9715 15.1695 17.0709 19.0716C13.5373 22.6067 8.00499 22.9447 4.0851 20.0665C4.22993 18.7625 4.79957 17.5166 5.79402 16.5217C8.1112 14.2037 11.8476 14.1554 14.1455 16.4541C14.1841 16.4928 14.3676 16.6763 14.522 16.5217C14.6765 16.3672 14.4834 16.174 14.4545 16.1451C12.2338 13.9236 12.1373 10.176 14.4545 7.85796C14.4834 7.82898 14.6765 7.65512 14.5124 7.49093C14.3483 7.32673 14.1648 7.52956 14.1455 7.54888C11.9152 9.78002 8.15947 9.84763 5.86161 7.54888C5.82299 7.51024 5.62023 7.34605 5.48506 7.48127C5.3499 7.61649 5.49472 7.8 5.55265 7.85796C7.82155 10.1277 7.82155 13.8753 5.48506 16.2127C4.50992 17.1882 3.23547 17.7677 1.93206 17.9126Z",
    viewBox: "-1 0 22 24",
  },
  { name: "WordPress", hex: "21759B", path: siWordpress.path },
  { name: "WooCommerce", hex: "96588A", path: siWoocommerce.path },
  { name: "Shopify", hex: "7AB55C", path: siShopify.path },
  { name: "PrestaShop", hex: "DF0067", path: siPrestashop.path },
];

export function getHomeContent(flags: ContentFlags) {
  const { callEnabled: call, aiEnabled: ai, brand } = flags;
  return {
    hero: {
      eyebrow: "Live chat for websites",
      /** Visitor question used by the Thread template's opening conversation. */
      question: "How do I talk to my website visitors?",
      answer: "Paste one line of code. We take it from there.",
      title: call
        ? ["Live chat and video calls,", "with one line of code."]
        : ["Live chat for your website,", "with one line of code."],
      lede: call
        ? `${brand} is a chat widget that sits on your website and lets you talk to visitors live, and call them on video, right where they decide.`
        : `${brand} is a chat widget that sits on your website and lets you talk to visitors live, right where they decide.`,
      install: "Install in under 5 minutes, no developer needed.",
      badge: `${joinEn(["Live chat", call && "video calls", call && "call center", ai && "AI agent"])}, in one dashboard`,
      primaryCta: "Try every feature free for 7 days",
      secondaryCta: "See features & pricing",
      appsCta: "Download the apps",
      note: "One snippet of code · ready-made plugins for WordPress, WooCommerce, Shopify and PrestaShop",
      chat: {
        agent: `${brand} support`,
        status: "We usually reply in a few minutes",
        messages: [
          { from: "agent" as const, text: "Hi there! How can I help?" },
          { from: "visitor" as const, text: "How much is the Professional plan?" },
          {
            from: "agent" as const,
            text: call
              ? "Let me walk you through it on a quick video call 👇"
              : "Let me connect you with one of our team 👇",
          },
        ],
        composer: "Write a message…",
      },
    },
    channels: {
      question: "Can I answer everything from one place?",
      eyebrow: "Unified inbox",
      title: "Answer every message from one inbox",
      lede: "Telegram, WhatsApp, Instagram and Bale messages, Gmail and Yahoo email, WHMCS tickets and WooCommerce and Shopify orders, all next to your website's live chat. No more jumping between a dozen apps.",
      items: CHANNELS,
    },
    apps: {
      question: "Can I reply from my phone?",
      eyebrow: "Native apps",
      title: `${brand} goes wherever you go`,
      lede: call
        ? "Answer chats, take video calls and never miss a customer on iPhone, Android, Mac and Windows, with instant notifications."
        : "Answer chats and never miss a customer on iPhone, Android, Mac and Windows, with instant notifications.",
      allApps: "All apps and screenshots",
    },
    chat: {
      question: "Where do my visitors' messages go?",
      eyebrow: "Live chat",
      title: "Every customer conversation, in one dashboard",
      lede: `Every message sent from your website shows up in the ${brand} dashboard, ready to answer from your phone or your desktop.`,
      features: [
        { title: "Real-time conversations", body: "See visitor messages the moment they arrive and reply instantly." },
        { title: "Mobile and desktop apps", body: "Reach every conversation from anywhere." },
        { title: "Complete customer history", body: "See each customer's past visits and previous conversations." },
        { title: "Automatic welcome message", body: "Send the first message automatically with simple rules." },
      ] satisfies FeatureCopy[],
      conversations: gate(
        [
          { name: "Sara Mitchell", message: "How much is the Professional plan?", time: "2 min", avatar: "/avatars/c1.jpg" },
          { name: "Daniel Reyes", message: "I have a problem with my payment", time: "10 min", avatar: "/avatars/c2.jpg" },
          { name: "Mia Thompson", message: "Thanks for your help!", time: "25 min", avatar: "/avatars/c3.jpg" },
          { name: "Leo Carter", message: "Can we do a video call?", time: "1 hr", avatar: "/avatars/c4.jpg", needs: "call" },
        ] satisfies ConversationCopy[],
        flags,
      ),
    },
    video: call
      ? {
          question: "What if text isn't enough?",
          eyebrow: "Video calls",
          title: "When text isn't enough, turn on the camera",
          lede: "Start an HD video call with a customer in one click, right inside the chat. They don't install an app or a plugin.",
          features: [
            { title: "One-click calls", body: "Straight from the chat window, with no links or separate software." },
            { title: "Screen sharing", body: "Share your screen to guide customers step by step." },
            { title: "Nothing to install", body: "Calls run in the customer's browser, no app download." },
            { title: "HD quality", body: "A clear picture, even on a limited connection." },
          ] satisfies FeatureCopy[],
          video: { src: "/videos/video-call.mp4", poster: "/videos/video-call-poster.jpg", operator: "/videos/operator.mp4" },
        }
      : null,
    platform: {
      question: "Is it only a chat box?",
      eyebrow: "Everything in one platform",
      title: "Beyond chat: a complete CRM for customer communication",
      lede: `${call ? "Live chat and video calls are" : "Live chat is"} just the start. ${joinEn([ai && "AI", "CRM", "automation", "campaigns", "reporting"])} live in the same dashboard, with no extra tools.`,
      features: gate(
        [
          { icon: MessageSquare, title: "Unified inbox", body: "Website widget, email and messaging channels in one shared inbox, with saved replies, team chat and routing to the right department." },
          { icon: Phone, title: "Call center", body: "Voice and video calls, a live call queue, callback requests, call recording and answering hours, all in the call center panel.", needs: "call" },
          { icon: Bot, title: "Advanced AI agent", body: "Train the agent on your website and knowledge base, test it in the playground and with test scenarios, and set routing, triggers and answer-quality reports.", needs: "ai" },
          { icon: Sparkles, title: "AI help for operators", body: "Reply suggestions, conversation summaries and tone fixes in real time, plus analytics on how often they're used.", needs: "ai" },
          { icon: Users, title: "Contacts and customer profiles", body: "A full profile for every contact, notes and tags, a bulk import wizard and contact exports." },
          { icon: Eye, title: "Visitor tracking", body: "See which page each visitor is on, where they came from and the path they took, and start a conversation right then." },
          { icon: BookOpen, title: "Knowledge base and help center", body: "Write help articles, build a knowledge base from your website automatically and publish a help center that answers without an operator." },
          { icon: Search, title: "SEO and web analytics", body: "A site explorer, Google Search Console, brand monitoring, crawler-bot analysis and website traffic stats in one place." },
          { icon: Mail, title: "Email and campaigns", body: "Receive and answer email in the same inbox and send targeted email campaigns to different audience segments." },
          { icon: Plug, title: "Plugins and integrations", body: "Install on WordPress, WooCommerce, Shopify and PrestaShop, connect messaging channels and manage the domains allowed to load the widget." },
          { icon: BarChart3, title: "Reports and analytics", body: "Response times, conversation volume, operator activity and call performance in clear charts you can export." },
          { icon: ShieldCheck, title: "Security, roles and privacy", body: "Role-based access for your team, account security settings, phone verification and handling of your users' privacy requests." },
        ] satisfies FeatureCopy[],
        flags,
      ),
    },
    steps: {
      question: "How long does setup take?",
      eyebrow: "Quick start",
      title: "Three steps to your first conversation",
      items: [
        { title: "Copy the widget code", body: "Get a small snippet of code from your dashboard.", time: "00:00" },
        { title: "Add it to your website", body: "Paste it just before the closing body tag of your site.", time: "00:30" },
        {
          title: "Start talking",
          body: call ? "From that moment, messages and calls arrive in your dashboard." : "From that moment, messages arrive in your dashboard.",
          time: "05:00",
        },
      ],
    },
    modules: {
      question: "What do I get after I sign in?",
      eyebrow: "Inside the dashboard",
      title: "Everything you get after signing in",
      lede: `The real sections of the ${brand} dashboard, from conversations${call ? " and calls" : ""} to ${joinEn([ai && "AI", "SEO", "contacts", "account settings"])}.`,
      groups: gate(
        [
          { icon: Layers, title: "Workspace and conversations", items: ["Overview and daily metrics", "Inbox with saved replies", "Team chat and internal handoffs", "Working hours and away message", "Website widget and its appearance"] },
          { icon: Phone, title: "Call center", needs: "call", items: ["Voice and video calls from the chat", "Live call queue", "Callback requests", "Call recording and archive", "Call setup guide and settings"] },
          { icon: Bot, title: "Artificial intelligence", needs: "ai", items: ["Agent training and knowledge sources", "Playground and test scenarios", "Behavior rules, triggers and routing", "Smart operator assist", "Performance reports and top topics"] },
          { icon: Search, title: "SEO and analytics", items: ["Site explorer and page audits", "Google Search Console connection", "Brand monitoring", "Crawler bot analysis", "Website traffic stats"] },
          { icon: Users, title: "Customers and team", items: ["Contacts, tags and notes", "Contact import and export", "Live visitors", "Team, departments and access levels", "Operator activity reports"] },
          {
            icon: Globe,
            title: "Connections and account",
            items: [
              "WordPress, WooCommerce, Shopify and PrestaShop plugins",
              "Messaging channels",
              "Allowed domains",
              ai ? "Wallet, billing and AI credits" : "Wallet and billing",
              "Security and privacy settings",
            ],
          },
        ] satisfies ModuleGroupCopy[],
        flags,
      ),
      cta: "Compare plans and what each includes",
    },
    faq: {
      question: "I still have a question…",
      eyebrow: "FAQ",
      title: "Questions? We have answers.",
      items: gate(
        [
          {
            q: `What exactly does ${brand} add to my website?`,
            a: `A chat widget sits on your website, backed by a complete dashboard: ${joinEn(["a unified inbox", call && "a voice and video call center", ai && "an AI agent", "contacts", "live visitors", "a knowledge base", "SEO and analytics tools", "reports"])}.`,
          },
          {
            q: "How do I install it?",
            a: "Paste a short code snippet before your site's closing body tag. Step-by-step install guides for WordPress, WooCommerce, Shopify and PrestaShop are in your dashboard.",
          },
          {
            q: "How do voice and video calls work?",
            a: "Calls start right inside the chat window and run in the browser, so customers don't install anything. The call queue, callback requests and call recording live in the call center.",
            needs: "call",
          },
          {
            q: "How is the AI agent trained?",
            a: "You train the agent on your website pages and knowledge base articles, test its answers in the playground, give it behavior and routing rules, and follow answer quality in the reports.",
            needs: "ai",
          },
          {
            q: "Which channels and services does it connect to?",
            a: "Install plugins are available for WordPress, WooCommerce, Shopify and PrestaShop, and messaging channels such as Telegram, WhatsApp, Instagram and Slack are managed under integrations; some of these connections are still rolling out.",
          },
          {
            q: "What do the SEO and analytics tools include?",
            a: "A site explorer to audit your pages, a Google Search Console connection, brand monitoring, crawler-bot behavior analysis and website traffic statistics.",
          },
          {
            q: "How does team access control work?",
            a: "Organize team members into departments and give each role its own access level. Operator activity is visible and reportable.",
          },
          {
            q: "What about my users' privacy requests?",
            a: "The privacy section of the dashboard records and manages requests about user data and lets you choose where exports are stored.",
          },
        ] satisfies FaqCopy[],
        flags,
      ),
    },
    finalCta: {
      question: "Ready to answer your first visitor?",
      title: `Put ${brand} on your website today`,
      lede: `${joinEn(["Conversations", call && "calls", ai && "AI", "contacts", "SEO", "reports"])}, all from one dashboard.`,
    },
  };
}

export type HomeContent = ReturnType<typeof getHomeContent>;
