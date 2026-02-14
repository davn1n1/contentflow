-- Add new KB categories: app-data, navigation, chat
ALTER TABLE help_articles DROP CONSTRAINT IF EXISTS help_articles_category_check;
ALTER TABLE help_articles ADD CONSTRAINT help_articles_category_check CHECK (category IN (
  'getting-started',
  'copy-script',
  'audio',
  'video',
  'render',
  'troubleshooting',
  'account',
  'remotion',
  'app-data',
  'navigation',
  'chat'
));
