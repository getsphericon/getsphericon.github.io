// The product areas: they feed the Product menu and the pages under /product.
// Promo copy, but every claim comes from the docs (docs is the place for the how).
import type { icons } from './ui'

type Icon = keyof typeof icons
// A line of the example window: text and an optional tone.
export type Line = [text: string, tone?: 'dim' | 'accent' | 'ok' | 'info']

export interface Product {
  slug: string
  name: string
  short: string
  headline: string
  lede: string
  example: { title: string; lines: Line[] }
  // Alt text of the app screenshot at /images/product/<slug>.png (see Screenshot in the product page)
  screenshot: string
  benefits: { icon: Icon; title: string; text: string }[]
  steps: { title: string; text: string }[]
  closing: string
  docs: string
}

export const products: Product[] = [
  {
    slug: 'contacts',
    name: 'Contacts & tracking',
    short: 'Know who they are before they sign up',
    headline: 'Every visitor becomes a contact you understand',
    lede: 'A small tracker turns anonymous visits into contacts. When someone signs up, what they did before is already on their record.',
    example: {
      title: 'your site',
      lines: [
        ['// Record something a visitor did', 'dim'],
        ["_omq.push(['track', 'viewed_pricing', { plan: 'team' }])"],
        [''],
        ['// They sign up: now we know who it was', 'dim'],
        ["_omq.push(['identify', { email: 'ada@example.com' }])", 'accent'],
        [''],
        ['Earlier anonymous activity is stitched onto the contact.', 'ok'],
      ],
    },
    benefits: [
      { icon: 'user', title: 'From anonymous to known', text: 'Identify a visitor and everything they did while anonymous lands on the contact, so pre-signup behavior is visible to your segments.' },
      { icon: 'zap', title: 'Events, not guesses', text: 'signed_up, viewed_pricing, email.opened: immutable events attached to the person, ready to segment on.' },
      { icon: 'filter', title: 'Your own fields', text: 'Typed custom fields and tags that match your data model, not a fixed template of someone else’s.' },
      { icon: 'code', title: 'Browser or server', text: 'Drop in one script, or send events from your backend. Load your history into a new setup.' },
    ],
    steps: [
      { title: 'Add the script', text: 'One tag on your pages, with a collect key from your workspace.' },
      { title: 'Track and identify', text: 'Send the events that matter and tell Sphericon who the visitor is.' },
      { title: 'Act on it', text: 'Build segments and automations from what people actually did.' },
    ],
    closing: 'Start knowing your audience',
    docs: '/docs/guide/tracking',
    screenshot: 'A contact profile in Sphericon: details, custom fields and a timeline of the events the contact triggered',
  },
  {
    slug: 'segments',
    name: 'Segments',
    short: 'Describe an audience once',
    headline: 'Describe an audience once. It stays right.',
    lede: 'Segments are saved rules, evaluated live. No exports, no stale lists, no “who did we send this to last time?”.',
    example: {
      title: 'segment: almost customers',
      lines: [
        ['Match all of', 'dim'],
        ['  plan           is  free', 'accent'],
        ['  viewed_pricing did in the last 14 days', 'accent'],
        ['  email.opened   did not in the last 30 days', 'accent'],
        [''],
        ['Preview updates as you edit the rule.', 'ok'],
      ],
    },
    benefits: [
      { icon: 'filter', title: 'Rules, not lists', text: 'A segment is a query, not a copied list. Membership moves as your data does.' },
      { icon: 'zap', title: 'Behavior-aware', text: 'Target on what contacts did, or did not do, within the last N days. Even email.opened and email.clicked.' },
      { icon: 'eye', title: 'See before you send', text: 'A live preview shows how many contacts match while you edit the rule.' },
      { icon: 'shield', title: 'Consent already applied', text: 'Opt-outs and suppressions always subtract from the result. You cannot target them by accident.' },
    ],
    steps: [
      { title: 'Combine conditions', text: 'Attributes, custom fields, tags and events, with all/any and nested groups.' },
      { title: 'Check the preview', text: 'Confirm the audience is who you meant.' },
      { title: 'Send to it', text: 'Use the segment for a broadcast, evaluated the moment sending starts.' },
    ],
    closing: 'Build your first segment',
    docs: '/docs/guide/segments',
    screenshot: 'The Sphericon segment editor: a rule combining plan, a pricing-page view and email opens, with a live count of 11 matching contacts',
  },
  {
    slug: 'broadcasts',
    name: 'Broadcasts',
    short: 'One email to the right segment',
    headline: 'Write once. Send to exactly the right people.',
    lede: 'Pick a segment, write the message, test it, then send now or schedule it. Read the report when it is done.',
    example: {
      title: 'broadcast',
      lines: [
        ['Subject  {{ first_name }}, still thinking it over?', 'accent'],
        ['Audience almost customers'],
        [''],
        ['draft → scheduled → sending → sent', 'dim'],
        [''],
        ['Report  sent · opened · clicked · unsubscribed', 'ok'],
      ],
    },
    benefits: [
      { icon: 'user', title: 'Personal by default', text: 'Liquid merge tags and conditionals fill in the contact’s name and any of their custom fields.' },
      { icon: 'eye', title: 'See it before they do', text: 'Send a test first. Once your domain is verified, to any address you choose.' },
      { icon: 'send', title: 'Now or later', text: 'Send immediately or schedule it. Changed your mind? Unschedule it again.' },
      { icon: 'lock', title: 'Built to finish', text: 'Sending runs on a durable job queue backed by PostgreSQL, so a restart does not lose work.' },
    ],
    steps: [
      { title: 'Write it', text: 'Name, sender, subject and body, from a template or from scratch.' },
      { title: 'Test it', text: 'Check the message in a real inbox.' },
      { title: 'Send it', text: 'Send or schedule, then read the report: sent, opened, clicked and unsubscribed.' },
    ],
    closing: 'Send your first broadcast',
    docs: '/docs/guide/sending',
    screenshot: 'The report of a sent broadcast in Sphericon: recipients, opens, clicks, failures and the delivery, open and click rates',
  },
  {
    slug: 'automations',
    name: 'Automations',
    short: 'Let events do the work',
    headline: 'Set it up once. Let events do the rest.',
    lede: 'An automation starts when a contact does something, then runs your steps in order. Each person goes through it once.',
    example: {
      title: 'automation: welcome (example)',
      lines: [
        ['trigger  signed_up', 'accent'],
        ['  ↓'],
        ['email     Welcome aboard'],
        ['wait      2 days', 'dim'],
        ['email     Getting started'],
        ['apply_tag onboarded', 'ok'],
      ],
    },
    benefits: [
      { icon: 'zap', title: 'Triggered by behavior', text: 'Start from any event, such as signed_up, the moment it happens.' },
      { icon: 'workflow', title: 'Simple steps that compose', text: 'Send an email, wait, add or remove a tag. Put them in the order you need.' },
      { icon: 'shield', title: 'Safe to try', text: 'Automations are created as drafts and go live only when you activate them. Contacts are enrolled once.' },
      { icon: 'lock', title: 'Leaving means leaving', text: 'Every automation is its own unsubscribe scope, so opting out of one sequence does not silence the others.' },
    ],
    steps: [
      { title: 'Choose the trigger', text: 'The event that should start the sequence.' },
      { title: 'Add the steps', text: 'Emails, waits and tags, in order.' },
      { title: 'Activate', text: 'Review the draft, then switch it on.' },
    ],
    closing: 'Automate your first sequence',
    docs: '/docs/guide/sending',
    screenshot: 'The Sphericon automations list: onboarding, trial nudge and win-back sequences with their triggers and status',
  },
  {
    slug: 'transactional',
    name: 'Transactional',
    short: 'Receipts and resets from your app',
    headline: 'Receipts and resets, from your own domain',
    lede: 'Your app makes one API call. Sphericon renders the template, signs the message and sends it, with the same consent rules as the rest of your mail.',
    example: {
      title: 'POST /api/emails',
      lines: [
        ['{', 'dim'],
        ['  "templateId": 12,'],
        ['  "destination": "ada@example.com",', 'accent'],
        ['  "variables": { "reset_url": "https://app.example.com/reset" }'],
        ['}', 'dim'],
        [''],
        ['Suppressed addresses come back as status "suppressed".', 'ok'],
      ],
    },
    benefits: [
      { icon: 'code', title: 'One call', text: 'Name a template and the variables to fill. That is the whole integration.' },
      { icon: 'receipt', title: 'Change wording without a deploy', text: 'Transactional templates are bound by reference, so your team can update a receipt without shipping code.' },
      { icon: 'shield', title: 'Never mail a bounce', text: 'An address that hard-bounced or complained is never mailed, and you are told it was suppressed.' },
      { icon: 'lock', title: 'No opt-out of a password reset', text: 'Transactional mail skips marketing unsubscribes, because nobody can opt out of their own reset link.' },
    ],
    steps: [
      { title: 'Create a template', text: 'Write the message once, with variables where you need them.' },
      { title: 'Call the API', text: 'From your backend, when something happens.' },
      { title: 'Delivered, signed', text: 'DKIM-signed by Sphericon over SMTP or an SES-compatible API.' },
    ],
    closing: 'Send your first receipt',
    docs: '/docs/guide/sending',
    screenshot: 'The Sphericon history of transactional emails, with sent, suppressed and failed messages',
  },
  {
    slug: 'deliverability',
    name: 'Deliverability & consent',
    short: 'Stay out of spam and out of trouble',
    headline: 'Stay out of the spam folder, and out of trouble',
    lede: 'Deliverability and consent are part of the product, not an add-on. The rules apply to every email, from every surface.',
    example: {
      title: 'tracking domain',
      lines: [
        ['track.example.com  CNAME  edge.sphericon…', 'dim'],
        [''],
        ['Pending        waiting for the CNAME'],
        ['DNS verified   certificate can be issued', 'accent'],
        ['Serving        links use your own hostname', 'ok'],
      ],
    },
    benefits: [
      { icon: 'shield', title: 'Verified domains only', text: 'You can only send from a domain you control. Sphericon signs every message with DKIM, whichever transport carries it.' },
      { icon: 'lock', title: 'Consent on every send', text: 'Suppressions, unsubscribes and, if you require it, confirmed opt-in are checked on every send path.' },
      { icon: 'webhook', title: 'Bounces become suppressions', text: 'Callbacks from SES, Postmark and Mailgun turn hard bounces and complaints into suppressions automatically.' },
      { icon: 'eye', title: 'Links on your hostname', text: 'Put open and click tracking on track.your-domain, so the link host matches your From address.' },
    ],
    steps: [
      { title: 'Verify your domain', text: 'Publish one TXT record. Nothing else in setup waits for DNS.' },
      { title: 'Connect your provider', text: 'Add SMTP or an SES-compatible API, plus the callbacks for your provider.' },
      { title: 'Send with confidence', text: 'Consent rules apply without you thinking about them.' },
    ],
    closing: 'Send mail you can stand behind',
    docs: '/docs/guide/deliverability',
    screenshot: 'Sphericon sending settings: connected providers with send limits, verified sending domains and the suppression list',
  },
  {
    slug: 'ai-agents',
    name: 'AI agents (MCP)',
    short: 'Let your agent run the workspace',
    headline: 'Let your agent run the routine work',
    lede: 'Every API operation is an MCP tool. Claude or any MCP client can build segments, draft broadcasts and author automations. A human sends.',
    example: {
      title: 'claude',
      lines: [
        ['> Draft a win-back broadcast for contacts who went quiet.', 'ok'],
        ['segments_preview → broadcasts_create → email_lint', 'info'],
        ['Draft saved. Review and send it in the app.', 'dim'],
      ],
    },
    benefits: [
      { icon: 'bot', title: 'Always up to date', text: 'Tools are projected from the API contract, not written by hand, so an agent never lags behind the product.' },
      { icon: 'send', title: 'Drafts by default', text: 'Sending needs its own scope plus mcp:send. Without it, those tools are not even listed.' },
      { icon: 'shield', title: 'Consent only narrows', text: 'An agent can suppress an address or record an unsubscribe. Lifting a suppression is not possible over the API or MCP.' },
      { icon: 'eye', title: 'Contact text is data', text: 'Names, fields and event properties come back marked as untrusted, and the model is told never to treat them as instructions.' },
    ],
    steps: [
      { title: 'Connect', text: 'Claude Code or any MCP client with a token, or a claude.ai connector over OAuth 2.1.' },
      { title: 'Ask', text: 'Or start from a playbook: welcome, win-back or list hygiene.' },
      { title: 'Review and send', text: 'The agent drafts. You decide what goes out.' },
    ],
    closing: 'Connect your agent',
    docs: '/docs/guide/mcp',
    screenshot: 'Sphericon API keys, including scoped tokens created for AI agents over MCP',
  },
]
