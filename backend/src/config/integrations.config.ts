// Configurações de integrações com terceiros
export const INTEGRATIONS_CONFIG = {
  // Meta / Instagram + Facebook
  META: {
    APP_ID: '2147483647',
    APP_SECRET: '85465d3b8206e7672f32638e6fa949b2',
    REDIRECT_URI: 'https://your.app/api/integrations/callback/meta',
    GRAPH_VERSION: 'v19.0',
    SCOPES: [
      'pages_manage_metadata',
      'pages_read_engagement',
      'pages_manage_posts',
      'instagram_basic',
      'instagram_manage_insights',
      'instagram_manage_comments',
      'instagram_manage_messages'
    ],
    API_BASE_URL: 'https://graph.facebook.com'
  },

  // Google
  GOOGLE: {
    CLIENT_ID: '2147483647-5koerf66g86ae2vcfe5umnkt6lm8a4hq.apps.googleusercontent.com',
    CLIENT_SECRET: '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',
    REDIRECT_URI: 'https://your.app/api/integrations/callback/google',
    SCOPES: [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/gmail.send',
      'https://www.googleapis.com/auth/gmail.readonly',
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/meetings.space.created'
    ],
    API_BASE_URL: 'https://www.googleapis.com'
  },

  // Redis Cloud
  REDIS: {
    HOST: 'redis-19514.c99.us-east-1-4.ec2.redns.redis-cloud.com',
    PORT: 19514,
    PASSWORD: '6gNlKX7TTjOkkToNzxzt6wpyOYF3nQ0E',
    USERNAME: 'default',
    URL: 'redis://default:6gNlKX7TTjOkkToNzxzt6wpyOYF3nQ0E@redis-19514.c99.us-east-1-4.ec2.redns.redis-cloud.com:19514',
    DATABASE: 'database-MFURT77U',
    VERSION: '7.4',
    REGION: 'us-east-1',
    VENDOR: 'AWS'
  },

  // Configurações gerais
  GENERAL: {
    REDIS_URL: 'redis://default:6gNlKX7TTjOkkToNzxzt6wpyOYF3nQ0E@redis-19514.c99.us-east-1-4.ec2.redns.redis-cloud.com:19514',
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
  }
};

export default INTEGRATIONS_CONFIG;
