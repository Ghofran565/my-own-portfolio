export default defineAppConfig({
  global: {
    meetingLink: '/fa/contact',
    available: false
  },
  profile: {
    name: 'Mohammad Hossein Ghofran',
    job: 'Backend developer',
    email: 'mhg4660@gmail.com',
    phone: '(+989)933409540',
    picture: 'https://avatars.githubusercontent.com/u/120258023?v=4',
  },
  socials: {
    github: 'https://github.com/Ghofran565',
    discord: 'https://discord.gg/9ngaRvjGBp',
    telegram: 'https://t.me/@ghofran565',
  },
  seo: {
    title: 'Mohammad Hossein Ghofran | About me',
    description: 'This is a simple About me website just for me and i have got nothing else to say',
    url: 'https://ghofran.armatzone.com',
  },
  ui: {
    colors: {
      primary: 'emerald',
      neutral: 'neutral',
    },
    notifications: {
      position: 'top-0 bottom-auto',
    },
    notification: {
      progress: {
        base: 'absolute bottom-0 end-0 start-0 h-0',
        background: 'bg-transparent dark:bg-transparent',
      },
    },
    button: {
      slots: {
        base: 'cursor-pointer',
      },
      defaultVariants: {
        color: 'neutral',
      },
    },
    input: {
      defaultVariants: {
        color: 'neutral',
      },
    },
    textarea: {
      defaultVariants: {
        color: 'neutral',
      },
    },
    icons: {
      loading: 'lucide:loader',
    },
  },
  link: [
    {
      rel: 'icon',
      type: 'image/x-icon',
      href: '/favicon.ico',
    },
    {
      rel: 'apple-touch-icon',
      sizes: '180x180',
      href: '/apple-touch-icon.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '32x32',
      href: '/favicon-32x32.png',
    },
    {
      rel: 'icon',
      type: 'image/png',
      sizes: '16x16',
      href: '/favicon-16x16.png',
    },
    {
      rel: 'manifest',
      href: '/site.webmanifest',
    },
  ],
})