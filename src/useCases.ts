// Use cases, taken from the docs. They feed the landing section and /use-cases.
import { icons, tone } from './ui'

export const useCases = [
  {
    slug: 'welcome',
    name: 'Welcome new sign-ups',
    icon: icons.zap,
    tone: tone.amber,
    text: 'An event such as signed_up starts an automation that runs once per contact.',
    steps: ['Track signed_up from your site or server', 'Author the welcome sequence as a draft', 'Activate it when you are ready'],
    docs: '/docs/guide/sending',
  },
  {
    slug: 'win-back',
    name: 'Win back quiet contacts',
    icon: icons.send,
    tone: tone.rose,
    text: 'Target contacts who did not open or click lately, then send one broadcast to them.',
    steps: ['Build a segment on email.opened or email.clicked within the last N days', 'Preview how many contacts match', 'Send a test, then send or schedule the broadcast'],
    docs: '/docs/guide/segments',
  },
  {
    slug: 'transactional',
    name: 'Receipts and resets from your app',
    icon: icons.receipt,
    tone: tone.emerald,
    text: 'Your app triggers a single email over the API, with its own variables.',
    steps: ['Create a template your app refers to', 'Call the API when something happens', 'Update the wording later without a deploy'],
    docs: '/docs/guide/sending',
  },
  {
    slug: 'list-hygiene',
    name: 'Keep the list healthy',
    icon: icons.shield,
    tone: tone.sky,
    text: 'Bounces and complaints from your provider become suppressions, so you stop writing to them.',
    steps: ['Connect SES, Postmark or Mailgun callbacks', 'Suppressions are checked on every send path', 'Ask an agent to audit audience health with the list-hygiene playbook'],
    docs: '/docs/guide/deliverability',
  },
  {
    slug: 'gdpr',
    name: 'Answer a GDPR request',
    icon: icons.lock,
    tone: tone.indigo,
    text: 'Export everything held about one contact, or erase them, from your own workspace.',
    steps: ['Export one contact as a JSON file', 'Erase a contact when asked', 'Follow the guide step by step'],
    docs: '/docs/guide/gdpr',
  },
  {
    slug: 'agents',
    name: 'Let an agent do the routine work',
    icon: icons.bot,
    tone: tone.violet,
    text: 'Claude or any MCP client drafts broadcasts and automations. A human sends.',
    steps: ['Connect over MCP with a token or OAuth', 'Use the welcome, win-back and list-hygiene playbooks', 'Sending stays behind its own scope'],
    docs: '/docs/guide/mcp',
  },
]
