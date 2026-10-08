/**
 * English legal and support texts. Used by /privacy, /terms and /help (English pages,
 * also shown in Persian mode when "fully English legal pages" is on) and by the English
 * Respok templates, so both always show the same wording.
 */
export const LEGAL_EFFECTIVE_DATE_EN = "September 1, 2026";

export interface LegalSection {
  title: string;
  body: string[];
}

export function privacySectionsEn(brand: string, email: string, address: string) {
  return [
    {
      title: "1. Introduction",
      body: [
        `This Privacy Policy explains how ${brand} ("we", "us", "our") collects, uses, discloses, stores and protects personal information when you use our website, mobile applications and related services (together, the "Services").`,
        `By using the Services you agree to this Policy. If you do not agree, please stop using the Services.`,
      ],
    },
    {
      title: "2. Information We Collect",
      body: [
        "Account data: name, email address, phone number (if you provide it) and the password hash used to sign you in.",
        "Content data: messages, tickets, files, contacts and other content you or your end users submit to the Services.",
        "Usage data: pages viewed, features used, approximate location derived from IP address, device type, operating system, browser and crash reports.",
        "Transaction data: subscription plan, billing status and invoice records. Full payment card numbers are never stored by us; they are handled by our payment processors.",
      ],
    },
    {
      title: "3. How We Use Information",
      body: [
        "To create and maintain your account and authenticate you.",
        "To provide, operate, support, secure and improve the Services.",
        "To communicate with you about service updates, security notices and support requests.",
        "To detect, prevent and investigate fraud, abuse and violations of our Terms of Use.",
        "To comply with legal obligations.",
      ],
    },
    {
      title: "4. Legal Bases",
      body: [
        "Where required by law, we process personal data on the basis of contract performance (delivering the Services you requested), legitimate interests (security, product improvement), consent (optional communications) and legal obligations.",
      ],
    },
    {
      title: "5. Sharing and Disclosure",
      body: [
        "We do not sell your personal information and we do not share it with third parties for their own advertising.",
        "We share data only with service providers acting on our behalf (hosting, storage, email delivery, analytics, payment processing) under contractual confidentiality obligations, and when required by applicable law or valid legal process.",
      ],
    },
    {
      title: "6. Children's Privacy",
      body: [
        "The Services are not directed to children under 13 years of age, and we do not knowingly collect personal information from them. If you believe a child has provided us personal data, contact us and we will delete it.",
      ],
    },
    {
      title: "7. Data Security",
      body: [
        "We use encryption in transit (TLS), password hashing, access controls, audit logging and regular backups to protect your data. No method of transmission or storage is completely secure, but we work to protect your information and will notify you of a breach where required by law.",
      ],
    },
    {
      title: "8. Data Retention",
      body: [
        "We keep personal data for as long as your account is active and for as long as needed to provide the Services. After account deletion we remove or anonymize personal data within 30 days, except where longer retention is required for legal, accounting or security reasons.",
      ],
    },
    {
      title: "9. Your Rights and Account Deletion",
      body: [
        "You may request access to, correction of, export of, or deletion of your personal data at any time. You may also object to or restrict certain processing and withdraw consent where processing is based on consent.",
        `To delete your account and all associated personal data, email ${email} from the address linked to your account with the subject "Account Deletion Request". We confirm and complete verified requests within 30 days.`,
      ],
    },
    {
      title: "10. Cookies and Similar Technologies",
      body: [
        "We use strictly necessary cookies to keep you signed in and to secure the Services, and optional analytics cookies to understand usage. You can control cookies through your browser settings; disabling necessary cookies may break parts of the Services.",
      ],
    },
    {
      title: "11. International Transfers",
      body: [
        "Your data may be processed on servers located in countries other than your own. Where such transfers occur, we apply appropriate safeguards required by applicable data protection law.",
      ],
    },
    {
      title: "12. Changes to This Policy",
      body: [
        "We may update this Policy from time to time. Material changes will be announced on this page with a new effective date, and where appropriate by email or in-app notice.",
      ],
    },
    {
      title: "13. Contact Us",
      body: [
        `Questions, privacy requests or complaints: ${email}`,
        address ? `Postal address: ${address}` : "",
        "We respond to privacy requests within 30 days.",
      ].filter(Boolean),
    },
  ];
}

export function termsSectionsEn(brand: string, email: string) {
  return [
    {
      title: "1. Acceptance of Terms",
      body: [
        `These Terms of Use ("Terms") form a binding agreement between you and ${brand} regarding your use of our website, mobile applications and related services (the "Services"). By creating an account or using the Services you accept these Terms.`,
      ],
    },
    {
      title: "2. Eligibility",
      body: [
        "You must be at least 13 years old, and old enough to form a binding contract in your jurisdiction, to use the Services. If you use the Services on behalf of an organization, you confirm that you are authorized to bind that organization.",
      ],
    },
    {
      title: "3. Accounts and Security",
      body: [
        "You are responsible for the accuracy of your registration details, for keeping your credentials confidential and for all activity under your account. Notify us immediately at the contact address below if you suspect unauthorized access.",
      ],
    },
    {
      title: "4. Acceptable Use",
      body: [
        "You agree not to: break applicable laws; send spam, malware or unsolicited bulk messages; harass, threaten or abuse others; upload unlawful, infringing, hateful or sexually explicit content; attempt to access other users' data; reverse engineer, scrape or overload the Services; or resell the Services without written permission.",
        "We may suspend or terminate accounts that violate this section.",
      ],
    },
    {
      title: "5. User Content",
      body: [
        "You retain ownership of the content you submit. You grant us a limited, worldwide, non-exclusive license to host, process, transmit and display that content solely to operate and support the Services.",
        "You are responsible for your content and for having the rights required to submit it.",
      ],
    },
    {
      title: "6. Subscriptions, Billing and Cancellation",
      body: [
        "Paid plans are billed in advance on a recurring basis and renew automatically until cancelled. You can cancel at any time from your account settings or by contacting support; cancellation takes effect at the end of the current billing period.",
        "Purchases made through the Apple App Store or Google Play are billed by that store and are governed by the store's own billing, renewal and refund rules; manage or cancel those subscriptions in your store account settings.",
      ],
    },
    {
      title: "7. Third-Party Services",
      body: [
        "The Services may integrate with third-party platforms and plugins. Those services are governed by their own terms and privacy policies, and we are not responsible for their availability or conduct.",
      ],
    },
    {
      title: "8. Intellectual Property",
      body: [
        `All software, design, trademarks and content provided by ${brand} remain our property or that of our licensors and are protected by intellectual property laws. No rights are granted except those expressly stated in these Terms.`,
      ],
    },
    {
      title: "9. Service Availability",
      body: [
        'We work to keep the Services available and reliable, but they are provided on an "as is" and "as available" basis, without warranties of any kind to the extent permitted by law. Planned maintenance is announced in advance where practical.',
      ],
    },
    {
      title: "10. Limitation of Liability",
      body: [
        `To the maximum extent permitted by law, ${brand} is not liable for indirect, incidental, special or consequential damages, or for lost profits or data. Our total liability for any claim is limited to the amount you paid for the Services in the twelve months before the claim.`,
      ],
    },
    {
      title: "11. Termination",
      body: [
        "You may stop using the Services and delete your account at any time. We may suspend or terminate access for breach of these Terms, for legal reasons or for prolonged inactivity, with notice where reasonably possible.",
      ],
    },
    {
      title: "12. Changes to These Terms",
      body: [
        "We may update these Terms. Material changes will be posted on this page with a new effective date and, where appropriate, notified by email or in-app. Continued use after the changes take effect means you accept them.",
      ],
    },
    {
      title: "13. Governing Law",
      body: [
        "These Terms are governed by the laws applicable at our principal place of business, without regard to conflict-of-law rules. Mandatory consumer protections in your country of residence still apply.",
      ],
    },
    {
      title: "14. Contact",
      body: [`For questions about these Terms, contact ${email}.`],
    },
  ];
}

export const HELP_FAQS_EN = [
  {
    q: "How do I create an account?",
    a: "Open the app or the website, choose Sign up, enter your email address and a password, then confirm your email. You can start on the free plan and upgrade later.",
  },
  {
    q: "I forgot my password. What should I do?",
    a: 'Use the "Forgot password" link on the sign-in screen. A reset link is sent to your registered email address and stays valid for 60 minutes.',
  },
  {
    q: "How do I manage or cancel my subscription?",
    a: "Subscriptions purchased in the app are managed in your Apple App Store or Google Play account settings. Subscriptions purchased on our website can be cancelled from your account billing page. Cancellation takes effect at the end of the current billing period.",
  },
  {
    q: "How do I delete my account and data?",
    a: 'Email our support address from the address linked to your account with the subject "Account Deletion Request". We verify the request and permanently delete your account and personal data within 30 days.',
  },
  {
    q: "Is my data secure?",
    a: "Data is transmitted over TLS, passwords are stored only as salted hashes, access is restricted by role, and backups are taken regularly. See our Privacy Policy for full details.",
  },
  {
    q: "How do I report a bug or abuse?",
    a: 'Email support with the subject "Bug report" or "Abuse report", including your account email, device and app version, the steps to reproduce, and screenshots if available.',
  },
];
