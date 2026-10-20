// The product areas: they feed the Product menu and the pages under /product. Text comes from the docs.
export interface Product {
  slug: string
  name: string
  short: string
  tagline: string
  points: { title: string; text: string }[]
  docs: string
}

export const products: Product[] = [
  {
    slug: 'contacts',
    name: 'Contacts & tracking',
    short: 'Know who they are and what they do',
    tagline: 'One record per person, and every action they take attached to it.',
    points: [
      { title: 'One record per person', text: 'Identified or still anonymous, with an email, a phone or your own user id, plus typed custom fields and tags.' },
      { title: 'Events as facts', text: 'signed_up, viewed_pricing, email.opened: immutable events attached to the contact, so behavior is something you can segment on.' },
      { title: 'Add the tracker', text: 'Connect your site or product, or send events from your server. Load history into a new setup.' },
    ],
    docs: '/docs/guide/tracking',
  },
  {
    slug: 'segments',
    name: 'Segments',
    short: 'Live rules, never stale lists',
    tagline: 'Describe a group of contacts once. It stays right as your data moves.',
    points: [
      { title: 'Attributes, fields, tags, events', text: 'Combine conditions with all/any and nest groups. Target on what a contact did or did not do, even email.opened.' },
      { title: 'Evaluated live', text: 'Membership is never copied. A segment is a query that runs when you preview it and when a broadcast starts sending.' },
      { title: 'Live preview', text: 'See how many contacts match as you edit the rule.' },
    ],
    docs: '/docs/guide/segments',
  },
  {
    slug: 'broadcasts',
    name: 'Broadcasts',
    short: 'One email to a segment',
    tagline: 'Write once, pick a segment, send now or schedule it, and read the report.',
    points: [
      { title: 'Templates with Liquid', text: 'Email-ready HTML with conditionals and merge tags from the contact and its custom fields.' },
      { title: 'Test before you send', text: 'Send a test to yourself, or to any address once you have a verified sending domain.' },
      { title: 'A report for every send', text: 'See how the broadcast performed once it has gone out.' },
    ],
    docs: '/docs/guide/sending',
  },
  {
    slug: 'automations',
    name: 'Automations',
    short: 'Sequences started by an event',
    tagline: 'Describe what should happen after something happens, once per contact.',
    points: [
      { title: 'Started by an event', text: 'A sequence of steps that begins when a contact does something, and runs once per contact.' },
      { title: 'Dry-run your steps', text: 'Check an HTTP step before the automation goes live.' },
      { title: 'Drafts first', text: 'Automations are authored as drafts and activated on purpose.' },
    ],
    docs: '/docs/guide/sending',
  },
  {
    slug: 'transactional',
    name: 'Transactional',
    short: 'Receipts and resets from your app',
    tagline: 'A single email your app triggers over the API, with your own variables.',
    points: [
      { title: 'Triggered over the API', text: 'Your app calls Sphericon when something happens, such as a receipt.' },
      { title: 'Template by reference', text: 'Your app can update its receipt wording without a deploy, because the template is bound by reference.' },
      { title: 'Same rules as marketing mail', text: 'Shared sending domains and consent rules across every send surface.' },
    ],
    docs: '/docs/guide/sending',
  },
  {
    slug: 'deliverability',
    name: 'Deliverability & consent',
    short: 'Consent derived on every send',
    tagline: 'Whether you may write to someone is never a flag. It is checked on every send path.',
    points: [
      { title: 'Suppressions and unsubscribes', text: 'Checked on every send path, and confirmed opt-in too if you require it.' },
      { title: 'Consent only narrows', text: 'Lifting a suppression is not available over the API or MCP at all.' },
      { title: 'Bounces and complaints', text: 'Provider callbacks from SES, Postmark and Mailgun feed suppression automatically.' },
    ],
    docs: '/docs/guide/deliverability',
  },
  {
    slug: 'ai-agents',
    name: 'AI agents (MCP)',
    short: 'Let your agent run the workspace',
    tagline: 'Every API operation is an MCP tool. Claude or any MCP client can operate the workspace.',
    points: [
      { title: 'Projected from the API', text: 'Tools come from the API contract, not by hand, so an agent never lags behind the product.' },
      { title: 'Drafts by default', text: 'Sending needs its own scope plus mcp:send, otherwise those tools are not even listed.' },
      { title: 'Playbooks built in', text: 'Walk an agent through a welcome automation, a win-back broadcast or list hygiene, leaving the send to a human.' },
    ],
    docs: '/docs/guide/mcp',
  },
]
