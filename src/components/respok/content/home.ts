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
  siTelegram,
  siWhatsapp,
  siWoocommerce,
} from "simple-icons";
import {
  gate,
  joinEn,
  type ContentFlags,
  type FaqCopy,
  type FeatureCopy,
  type FeatureNeed,
} from ".";

/*
 * Every claim below was checked against the app's source code (kindred-core-build).
 * Not offered, so never mentioned: screen sharing, Shopify/PrestaShop/plain WordPress,
 * Slack, email campaigns, sales pipeline, public REST API/webhooks, SSO/2FA, audit logs,
 * white label, AI summaries, response-time reports, report export, a 7-day full trial.
 */

export interface ChannelCopy {
  name: string;
  /** Brand color without "#". */
  hex: string;
  /** 24×24 SVG path … */
  path?: string;
  viewBox?: string;
  /** … or an image in /public. */
  img?: string;
  /** What it connects to: the inbox, the email inbox or the store/AI. */
  kind: "inbox" | "email" | "store";
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

const CHANNELS: ChannelCopy[] = [
  { name: "Telegram", hex: "26A5E4", path: siTelegram.path, kind: "inbox" },
  { name: "WhatsApp", hex: "25D366", path: siWhatsapp.path, kind: "inbox" },
  { name: "Instagram", hex: "FF0069", path: siInstagram.path, kind: "inbox" },
  { name: "Bale", hex: "4CEBB4", img: "/brands/bale.svg", kind: "inbox" },
  { name: "Gmail", hex: "EA4335", path: siGmail.path, kind: "email" },
  {
    name: "Yahoo Mail",
    hex: "6001D2",
    path: "M18.86 1.56L14.27 11.87H19.4L24 1.56H18.86M0 6.71L5.15 18.27L3.3 22.44H7.83L14.69 6.71H10.19L7.39 13.44L4.62 6.71H0M15.62 12.87C13.95 12.87 12.71 14.12 12.71 15.58C12.71 17 13.91 18.19 15.5 18.19C17.18 18.19 18.43 16.96 18.43 15.5C18.43 14.03 17.23 12.87 15.62 12.87Z",
    kind: "email",
  },
  { name: "WooCommerce", hex: "96588A", path: siWoocommerce.path, kind: "store" },
  {
    name: "OpenCart",
    hex: "23A8E0",
    // Simplified cart mark (OpenCart is not in simple-icons).
    path: "M2 4h3l2.4 10.2a2 2 0 0 0 2 1.6h8.2a2 2 0 0 0 1.9-1.4L22 8H7.2M9.5 21a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm8 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z",
    kind: "store",
  },
  {
    name: "WHMCS",
    hex: "840FFF",
    path: "M1.93206 17.9126C-0.935444 14.0008 -0.616832 8.46645 2.92652 4.92173C6.83675 1.02931 13.1607 1.01965 17.0709 4.93139C20.9812 8.84313 20.9715 15.1695 17.0709 19.0716C13.5373 22.6067 8.00499 22.9447 4.0851 20.0665C4.22993 18.7625 4.79957 17.5166 5.79402 16.5217C8.1112 14.2037 11.8476 14.1554 14.1455 16.4541C14.1841 16.4928 14.3676 16.6763 14.522 16.5217C14.6765 16.3672 14.4834 16.174 14.4545 16.1451C12.2338 13.9236 12.1373 10.176 14.4545 7.85796C14.4834 7.82898 14.6765 7.65512 14.5124 7.49093C14.3483 7.32673 14.1648 7.52956 14.1455 7.54888C11.9152 9.78002 8.15947 9.84763 5.86161 7.54888C5.82299 7.51024 5.62023 7.34605 5.48506 7.48127C5.3499 7.61649 5.49472 7.8 5.55265 7.85796C7.82155 10.1277 7.82155 13.8753 5.48506 16.2127C4.50992 17.1882 3.23547 17.7677 1.93206 17.9126Z",
    viewBox: "-1 0 22 24",
    kind: "store",
  },
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
        ? `${brand} puts a chat widget on your website so you can talk to visitors live, and invite them to a voice or video call, right where they decide.`
        : `${brand} puts a chat widget on your website so you can talk to visitors live, right where they decide.`,
      install: "Install in minutes, no developer needed.",
      badge: `${joinEn(["Live chat", call && "voice and video calls", ai && "an AI agent"])}, in one dashboard`,
      primaryCta: "Start free",
      secondaryCta: "See features & pricing",
      appsCta: "Download the apps",
      note: "One snippet of code · connectors for WooCommerce, OpenCart and WHMCS",
      chat: {
        agent: `${brand} support`,
        status: "We usually reply in a few minutes",
        messages: [
          { from: "agent" as const, text: "Hi there! How can I help?" },
          { from: "visitor" as const, text: "How much is the Pro plan?" },
          {
            from: "agent" as const,
            text: call
              ? "Happy to walk you through it on a quick video call 👇"
              : "Let me connect you with someone from our team 👇",
          },
        ],
        composer: "Write a message…",
      },
    },
    channels: {
      question: "Can I answer everything from one place?",
      eyebrow: "Unified inbox",
      title: "Every conversation in one inbox",
      lede: "Telegram, WhatsApp, Instagram and Bale messages arrive in the same inbox as your website chat. Your Gmail or Yahoo mailbox lives in the built-in email inbox, and store connectors bring your shop into the conversation.",
      groups: {
        inbox: "Messaging channels",
        email: "Email inbox",
        store: "Store connectors",
      },
      items: CHANNELS,
    },
    apps: {
      question: "Can I reply from my phone?",
      eyebrow: "Apps",
      title: `${brand} goes wherever you go`,
      lede: "Answer customers from your phone or desktop with instant notifications, using the same account as the web dashboard.",
      allApps: "All apps and screenshots",
    },
    chat: {
      question: "Where do my visitors' messages go?",
      eyebrow: "Live chat",
      title: "Every customer conversation, in one dashboard",
      lede: `Every message sent from your website lands in the ${brand} inbox, ready to answer from the web dashboard${call ? ", with calls one click away" : ""}.`,
      features: [
        { title: "Real-time conversations", body: "See messages as they arrive, with typing indicators and read receipts." },
        { title: "Your widget, your brand", body: "Your colors, logo, welcome message and launcher, on the left or the right, in English, Persian or Turkish." },
        { title: "Files, photos and voice notes", body: "Let visitors send attachments and voice notes when you switch them on." },
        { title: "Opening hours", body: "Set your hours, then show an away message or a leave-a-message form." },
        { title: "Pre-chat form", body: "Ask for a name, email or phone before the chat, with optional verification." },
        { title: "Proactive messages", body: "Greet visitors automatically based on the page, time on page, scroll or exit intent." },
      ] satisfies FeatureCopy[],
      conversations: gate(
        [
          { name: "Sara Mitchell", message: "How much is the Pro plan?", time: "2 min", avatar: "/avatars/c1.jpg" },
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
          eyebrow: "Voice & video calls",
          title: "When text isn't enough, start a call",
          lede: "Invite a visitor to a voice or video call straight from the chat. They join in their browser, with nothing to install.",
          features: [
            { title: "Calls from the chat", body: "Send a call invitation from the conversation; the visitor joins with one click." },
            { title: "Nothing to install", body: "Calls run in the visitor's browser, inside the chat widget." },
            { title: "HD video", body: "720p video calls for a clear picture." },
            { title: "A call button for your site", body: "Add a separate call widget with a live queue, callback requests, recording and call ratings." },
          ] satisfies FeatureCopy[],
          video: { src: "/videos/video-call.mp4", poster: "/videos/video-call-poster.jpg", operator: "/videos/operator.mp4" },
        }
      : null,
    platform: {
      question: "Is it only a chat box?",
      eyebrow: "Everything in one platform",
      title: "Beyond chat: everything for customer conversations",
      lede: `${call ? "Live chat and calls are" : "Live chat is"} just the start. ${joinEn([ai && "An AI agent", "contacts", "a knowledge base", "SEO tools", "web analytics"])} live in the same dashboard.`,
      features: gate(
        [
          { icon: MessageSquare, title: "Shared inbox", body: "Open, pending and resolved views. Assign, transfer, prioritize and tag conversations, add internal notes and reply faster with / saved replies." },
          { icon: Phone, title: "Call center", body: "A live call queue, callback requests, call recording, transfers and call ratings, with today's call stats at a glance.", needs: "call" },
          { icon: Bot, title: "AI agent", body: "Trained on your website, files and Q&A. It answers visitors in their language, stays on your topics and hands the chat to your team when it should.", needs: "ai" },
          { icon: Sparkles, title: "AI drafts for operators", body: "Draft a reply in one click, pick a tone, edit it and send. Rate drafts and see how your team uses them.", needs: "ai" },
          { icon: Users, title: "Contacts", body: "Profiles with tags, notes, and chat and call history. Import and export contacts as CSV." },
          { icon: Eye, title: "Live visitors", body: "See who's on your site right now on a map, with the current page, journey, referrer and device, and start a chat in one click." },
          { icon: BookOpen, title: "Knowledge base", body: `Write help articles once: they power the help tab in your widget${ai ? " and the AI agent, and AI can draft articles from your website" : ""}.` },
          { icon: Search, title: "SEO & web analytics", body: "Site audit, Core Web Vitals, keywords, rank tracking, backlinks, Search Console insights, Brand Radar and website analytics from the same snippet." },
          { icon: Mail, title: "Email inbox", body: "Connect your Gmail or Yahoo mailbox and read and reply to email next to your chats." },
          { icon: Plug, title: "Channels & connectors", body: "Telegram, WhatsApp, Instagram and Bale in the inbox. WooCommerce, OpenCart and WHMCS connectors, and a JavaScript API for the widget." },
          { icon: BarChart3, title: "Reports", body: "A dashboard with daily activity and conversation volume, plus each teammate's assigned, resolved and replied conversations." },
          { icon: ShieldCheck, title: "Security & privacy", body: "Email sign-in codes, active-session control, IP masking by default, and data export or erasure on request." },
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
        { title: "Add it to your website", body: "Paste it before the closing body tag, or install a store connector.", time: "00:30" },
        {
          title: "Start talking",
          body: call ? "From that moment, chats and calls arrive in your dashboard." : "From that moment, chats arrive in your dashboard.",
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
          { icon: Layers, title: "Workspace and conversations", items: ["Overview and daily activity", "Shared inbox with saved replies", "Team chat and internal notes", "Departments and automatic assignment", "Widget appearance and opening hours"] },
          { icon: Phone, title: "Call center", needs: "call", items: ["Voice and video calls from the chat", "Live call queue", "Callback requests", "Call recordings", "Call widget for your site"] },
          { icon: Bot, title: "Artificial intelligence", needs: "ai", items: ["Knowledge sources: website, files, Q&A", "Playground to test answers", "Behavior, tone and handoff rules", "AI drafts for operators", "Unanswered questions and handoff reasons"] },
          { icon: Search, title: "SEO and analytics", items: ["Site audit and Core Web Vitals", "Keyword research and rank tracking", "Google Search Console insights", "Brand Radar and AI-crawler log analysis", "Website analytics, events and funnels"] },
          { icon: Users, title: "Customers and team", items: ["Contacts with tags and notes", "CSV import and export", "Live visitors on a map", "Admins, operators and departments", "Team activity"] },
          {
            icon: Globe,
            title: "Connections and account",
            items: [
              "Telegram, WhatsApp, Instagram and Bale",
              "Gmail and Yahoo email inbox",
              "WooCommerce, OpenCart and WHMCS connectors",
              "Allowed domains for your widget",
              ai ? "Billing, wallet and AI usage" : "Billing and wallet",
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
            a: `A chat widget sits on your website, backed by a complete dashboard: ${joinEn(["a shared inbox", call && "voice and video calls", ai && "an AI agent", "contacts", "live visitors", "a knowledge base", "SEO and analytics tools"])}.`,
          },
          {
            q: "How do I install it?",
            a: "Paste a short code snippet before your site's closing body tag. If you run WooCommerce, OpenCart or WHMCS, install the connector instead and the widget is added for you.",
          },
          {
            q: "How do voice and video calls work?",
            a: "Invite a visitor to a call from the chat; they join in the browser, with nothing to install. For inbound calls, add the call widget to your site: it has a live queue, callback requests, recording and call ratings.",
            needs: "call",
          },
          {
            q: "How is the AI agent trained?",
            a: "Point it at your website, upload files and add Q&A pairs or help articles. Test its answers in the playground, set its tone and when it should hand off, and turn your team's replies into new answers after you approve them.",
            needs: "ai",
          },
          {
            q: "Which channels does it connect to?",
            a: "Telegram, WhatsApp, Instagram and Bale arrive in the shared inbox. Gmail and Yahoo Mail connect to the built-in email inbox. Connectors for WooCommerce, OpenCart and WHMCS add the widget to your store and let the AI agent answer product and order questions.",
          },
          {
            q: "What do the SEO and analytics tools include?",
            a: "A site audit with Core Web Vitals, keyword research, rank tracking, backlinks, Google Search Console insights, AI-crawler log analysis, Brand Radar, and website analytics with events and funnels. Some tools depend on your plan.",
          },
          {
            q: "How does team access work?",
            a: "Invite teammates as admins or operators, group them into departments and let conversations be assigned automatically or round-robin. You can see what each teammate handled.",
          },
          {
            q: "How are privacy requests handled?",
            a: "Export or erase a contact's or visitor's data on request from the privacy section of your dashboard. Visitor IP addresses are masked by default.",
          },
        ] satisfies FaqCopy[],
        flags,
      ),
    },
    finalCta: {
      question: "Ready to answer your first visitor?",
      title: `Put ${brand} on your website today`,
      lede: `${joinEn(["Conversations", call && "calls", ai && "AI", "contacts", "SEO", "analytics"])}, all from one dashboard.`,
    },
  };
}

export type HomeContent = ReturnType<typeof getHomeContent>;
