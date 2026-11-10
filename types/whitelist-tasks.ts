export type TaskLink = {
  label: string;
  url: string;
};

export type WhitelistTask = {
  id: string;
  headline: string;
  description: string;
  links: TaskLink[];
  field_key: 'x_username' | 'reply_link' | 'custom' | 'none';
  field_label?: string;
  field_placeholder?: string;
  required?: boolean;
};

export const DEFAULT_WHITELIST_TASKS: WhitelistTask[] = [
  {
    id: 'task-1',
    headline: 'Follow @Buzquitos & @Mical_xz',
    description: 'Follow both @Buzquitos and @Mical_xz on X.',
    links: [
      { label: 'Follow @Buzquitos', url: 'https://x.com/Buzquitos' },
      { label: 'Follow @Mical_xz', url: 'https://x.com/Mical_xz' }
    ],
    field_key: 'x_username',
    field_label: 'YOUR X / TWITTER USERNAME',
    field_placeholder: '@yourhandle',
    required: true
  },
  {
    id: 'task-2',
    headline: 'Like, Retweet & Reply to Pinned Post',
    description: 'Like, retweet, and reply to our pinned post on @Buzquitos.',
    links: [
      { label: 'Open Pinned Post', url: 'https://x.com/Buzquitos' }
    ],
    field_key: 'reply_link',
    field_label: 'SUBMIT YOUR REPLY LINK',
    field_placeholder: 'https://x.com/...',
    required: true
  }
];

