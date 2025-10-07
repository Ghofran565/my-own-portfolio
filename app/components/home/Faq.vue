<script setup lang="ts">
import { withLeadingSlash } from 'ufo'
import type { Collections } from '@nuxt/content'

const route = useRoute()
const { locale } = useI18n()

// const slug = computed(() => withLeadingSlash(String(route.params.slug)))
// const { data: faq } = await useAsyncData('faq-' + slug.value, async () => {
//   const collection = ('faq_' + locale.value) as keyof Collections
//   return await queryCollection(collection).first() as Collections['faq_en'] | Collections['faq_fr']
// }, {
//   watch: [locale],
// })

// const items = computed(() => {
//   return faq.value?.faqQuestions.map((faq) => {
//     return {
//       label: faq.title,
//       key: faq.title.toLowerCase(),
//       questions: faq.questions,
//     }
//   })
// })

const ui = {
  root: 'flex items-center gap-4 w-full',
  list: 'relative flex bg-transparent dark:bg-transparent gap-2',
  indicator: 'absolute top-[4px] duration-200 ease-out focus:outline-none rounded-full bg-white/10 dark:bg-neutral-900',
  trigger: [
    'relative inline-flex items-center justify-center flex-shrink-0 focus:outline-none transition-colors duration-200 ease-out border-white/10 border-2',
    'px-3 py-2 font-medium rounded-full',
    'hover:bg-neutral-900/80',
    'data-[state=active]:text-highlighted',
    'data-[state=inactive]:text-muted',
  ],
  label: 'truncate',
}

// Discord Widget Code
// Define interface for Discord API response
interface DiscordActivity {
  id: string
  name: string
  type: number
  state?: string
  details?: string
  timestamps?: { start?: number; end?: number }
  assets?: { large_image?: string; large_text?: string; small_image?: string; small_text?: string }
  created_at?: number
  platform?: string
  sync_id?: string
  party?: { id: string }
  application_id?: string
}

interface SpotifyData {
  song: string
  artist: string
  album: string
  album_art_url: string
  timestamps: { start: number; end: number }
  track_id: string
}

interface DiscordData {
  discord_user: {
    id: string
    username: string
    global_name: string
    display_name: string
    avatar: string
  }
  activities: DiscordActivity[]
  discord_status: 'online' | 'dnd' | 'idle' | 'offline'
  active_on_discord_web: boolean
  active_on_discord_desktop: boolean
  active_on_discord_mobile: boolean
  active_on_discord_embedded: boolean
  listening_to_spotify: boolean
  spotify: SpotifyData | null
}

// Fetch Discord data
const { data: discordData, error: discordError } = await useFetch<{ data: DiscordData; success: boolean }>(
  'https://api.lanyard.rest/v1/users/1298823045959647254',
  {
    server: true,
    watch: false,
    default: () => ({
      data: {
        discord_user: { id: '', username: '', global_name: '', display_name: '', avatar: '' },
        activities: [],
        discord_status: 'offline',
        active_on_discord_web: false,
        active_on_discord_desktop: false,
        active_on_discord_mobile: false,
        active_on_discord_embedded: false,
        listening_to_spotify: false,
        spotify: null,
      },
      success: false,
    }),
  }
)

// Discord Computed properties for status and activities
const statusConfig = computed(() => {
  switch (discordData.value?.data.discord_status) {
    case 'online':
      return { icon: 'i-lucide-circle', color: 'text-green-500', text: 'Online' }
    case 'dnd':
      return { icon: 'i-lucide-minus-circle', color: 'text-red-500', text: 'Do Not Disturb' }
    case 'idle':
      return { icon: 'i-lucide-moon', color: 'text-yellow-500', text: 'Away' }
    default:
      return { icon: 'i-lucide-circle-off', color: 'text-gray-500', text: 'Offline' }
  }
})

const devices = computed(() => {
  const devicesList = []
  if (discordData.value?.data.active_on_discord_desktop) devicesList.push({ name: 'Desktop', icon: 'i-lucide-monitor' })
  if (discordData.value?.data.active_on_discord_mobile) devicesList.push({ name: 'Mobile', icon: 'i-lucide-smartphone' })
  if (discordData.value?.data.active_on_discord_web) devicesList.push({ name: 'Web', icon: 'i-lucide-globe' })
  if (discordData.value?.data.active_on_discord_embedded) devicesList.push({ name: 'Embedded', icon: 'i-lucide-gamepad' })
  return devicesList
})

const customStatus = computed(() => {
  return discordData.value?.data.activities.find((act) => act.name === 'Custom Status') || null
})

const primaryActivity = computed(() => {
  return discordData.value?.data.activities.find((act) => act.name !== 'Spotify' && act.name !== 'Custom Status') || null
})

const otherActivities = computed(() => {
  return discordData.value?.data.activities.filter(
    (act) => act.name !== 'Spotify' && act.name !== 'Custom Status' && act !== primaryActivity.value
  ) || []
})

const activityIcon = (activity: DiscordActivity) => {
  const name = activity.name.toLowerCase()
  if (name.includes('visual studio code')) return 'i-lucide-code'
  if (name.includes('minecraft')) return 'i-lucide-cube'
  return 'i-lucide-activity'
}

const activityTypeConfig = (activity: DiscordActivity) => {
  const name = activity.name.toLowerCase()
  if (name.includes('visual studio code')) {
    return { icon: 'i-lucide-code-2', text: 'Coding' }
  }
  switch (activity.type) {
    case 0: return { icon: 'i-lucide-gamepad-2', text: 'Playing' }
    case 1: return { icon: 'i-lucide-video', text: 'Streaming' }
    case 2: return { icon: 'i-lucide-music', text: 'Listening' }
    case 3: return { icon: 'i-lucide-eye', text: 'Watching' }
    case 4: return { icon: 'i-lucide-trophy', text: 'Competing' }
    default: return { icon: 'i-lucide-activity', text: '' }
  }
}

// Get Discord asset URLs
const getAssetUrl = (activity: DiscordActivity, type: 'large' | 'small') => {
  if (!activity.assets || !activity.application_id) return ''
  const assetId = type === 'large' ? activity.assets.large_image : activity.assets.small_image
  if (!assetId) return ''
  if (assetId.startsWith('spotify:')) {
    return type === 'large' ? discordData.value?.data.spotify?.album_art_url || '' : ''
  }
  return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${assetId}.png`
}

// GitHub Widget Code
interface GitHubUser {
  login: string
  id: number
  node_id: string
  avatar_url: string
  gravatar_id: string
  url: string
  html_url: string
  followers_url: string
  following_url: string
  gists_url: string
  starred_url: string
  subscriptions_url: string
  organizations_url: string
  repos_url: string
  events_url: string
  received_events_url: string
  type: string
  site_admin: boolean
  name?: string
  company?: string
  blog?: string
  location?: string
  email?: string
  hireable?: boolean
  bio?: string
  twitter_username?: string
  public_repos: number
  public_gists: number
  followers: number
  following: number
  created_at: string
  updated_at: string
}

interface GitHubRepo {
  id: number
  node_id: string
  name: string
  full_name: string
  private: boolean
  owner: {
    login: string
    id: number
    node_id: string
    avatar_url: string
    gravatar_id: string
    url: string
    html_url: string
    followers_url: string
    following_url: string
    gists_url: string
    starred_url: string
    subscriptions_url: string
    organizations_url: string
    repos_url: string
    events_url: string
    received_events_url: string
    type: string
    site_admin: boolean
  }
  html_url: string
  description?: string
  fork: boolean
  url: string
  forks_url: string
  keys_url: string
  collaborators_url: string
  teams_url: string
  hooks_url: string
  issue_events_url: string
  events_url: string
  assignees_url: string
  branches_url: string
  tags_url: string
  blobs_url: string
  git_tags_url: string
  git_refs_url: string
  trees_url: string
  statuses_url: string
  languages_url: string
  stargazers_url: string
  subscribers_url: string
  subscription_url: string
  commits_url: string
  contents_url: string
  compare_url: string
  merges_url: string
  archive_url: string
  downloads_url: string
  issues_url: string
  pulls_url: string
  milestones_url: string
  notifications_url: string
  labels_url: string
  releases_url: string
  deployments_url: string
  created_at: string
  updated_at: string
  pushed_at: string
  git_url: string
  ssh_url: string
  clone_url: string
  svn_url: string
  homepage?: string
  size: number
  stargazers_count: number
  watchers_count: number
  language?: string
  has_issues: boolean
  has_projects: boolean
  has_downloads: boolean
  has_wiki: boolean
  has_pages: boolean
  has_discussions: boolean
  archived: boolean
  disabled: boolean
  visibility: string
  license?: {
    key: string
    name: string
    node_id: string
    spdx_id: string
    url: string | null
    html_url?: string
  }
  allow_forking: boolean
  is_template: boolean
  forks: number
  open_issues: number
  watchers: number
  default_branch: string
  permissions?: {
    admin: boolean
    maintain?: boolean
    push?: boolean
    triage?: boolean
    pull?: boolean
  }
}

// Fetch GitHub data
const { data: githubData, error: githubError } = await useFetch<GitHubUser>(
  'https://api.github.com/users/ghofran565',
  {
    server: true,
    watch: false,
    default: () => null,
  }
)

const { data: githubReposData, error: githubReposError } = await useFetch<GitHubRepo[]>(
  'https://api.github.com/users/ghofran565/repos?sort=updated&per_page=1',
  {
    server: true,
    watch: false,
    default: () => [],
  }
)

// GitHub computed properties
const githubStats = computed(() => ({
  repos: githubData.value?.public_repos || 0,
  followers: githubData.value?.followers || 0,
  following: githubData.value?.following || 0,
  gists: githubData.value?.public_gists || 0,
}))

const githubTopRepos = computed(() => {
  return githubReposData.value.slice(0, 1).map(repo => ({
    name: repo.name,
    description: repo.description,
    language: repo.language,
    stars: repo.stargazers_count,
    forks: repo.forks,
    html_url: repo.html_url,
  }))
})

// Language color mapping
const getLanguageColor = (language: string) => {
  const colors: { [key: string]: string } = {
    javascript: '#f7df1e',
    typescript: '#3178c6',
    python: '#3776ab',
    java: '#007396',
    cpp: '#00599c',
    rust: '#dea584',
    go: '#00add8',
    php: '#777bb4',
    ruby: '#701516',
    swift: '#f05138',
    kotlin: '#00a2ee',
    dart: '#0175c2',
    vue: '#42b883',
    react: '#61dafb',
    html: '#e34f26',
    css: '#1572b6',
    scss: '#c6538c',
    json: '#ff9900',
    yaml: '#ff8c00',
    dockerfile: '#384d54',
    shell: '#89e051',
    makefile: '#427819',
    gitignore: '#e44b27',
    markdown: '#e15730',
    default: '#6a737d',
  }
  return colors[language?.toLowerCase() || 'default'] || colors.default
}
</script>

<template>
  <div class="flex flex-col sm:flex-row items-start justify-center gap-6 w-full max-w-7xl px-4 py-8">
    <!-- GitHub Widget -->
    <div class="w-full max-w-md min-w-[320px]">
      <UCard
        v-if="!githubError"
        class="w-full max-w-md min-w-[320px] min-h-[400px] max-h-[600px] bg-white/5 border border-white/10 backdrop-blur-lg shadow-xl rounded-2xl overflow-hidden flex flex-col"
        :ui="{ body: { base: 'p-6 flex-1 flex flex-col' } }"
      >
        <div class="flex flex-col gap-4 flex-1">
          <!-- GitHub User Info -->
          <div class="flex items-center gap-4">
            <ULink :to="githubData.html_url" target="_blank">
              <UAvatar
                :src="githubData.avatar_url"
                :alt="githubData.login"
                size="xl"
                class="relative cursor-pointer"
              />
            </ULink>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between">
                <div>
                  <h3 class="text-lg font-semibold aqua-gradient">{{ githubData.login }}</h3>
                  <div v-if="githubData.name" class="inline-flex items-center gap-2">
                    <div class="">
                      <span class="text-xs font-medium text-muted">{{ githubData.name }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- GitHub Stats -->
          <div class="grid grid-cols-4 gap-2 hidden sm:grid">
            <ULink :to="`${githubData.html_url}?tab=repositories`" target="_blank">
              <div class="text-center p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                <p class="text-lg font-bold text-white">{{ githubStats.repos }}</p>
                <p class="text-xs text-muted uppercase tracking-wide">Repos</p>
              </div>
            </ULink>
            <ULink :to="`${githubData.html_url}?tab=followers`" target="_blank">
              <div class="text-center p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                <p class="text-lg font-bold text-white">{{ githubStats.followers }}</p>
                <p class="text-xs text-muted uppercase tracking-wide">Followers</p>
              </div>
            </ULink>
            <ULink :to="`${githubData.html_url}?tab=following`" target="_blank">
              <div class="text-center p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                <p class="text-lg font-bold text-white">{{ githubStats.following }}</p>
                <p class="text-xs text-muted uppercase tracking-wide">Following</p>
              </div>
            </ULink>
            <ULink :to="`${githubData.html_url}?tab=gists`" target="_blank">
              <div class="text-center p-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer">
                <p class="text-lg font-bold text-white">{{ githubStats.gists }}</p>
                <p class="text-xs text-muted uppercase tracking-wide">Gists</p>
              </div>
            </ULink>
          </div>

          <!-- Divider after stats -->
          <hr class="border-white/10 hidden sm:block" />

          <!-- GitHub Location/Company/Blog -->
          <div class="space-y-2">
            <div v-if="githubData.location || githubData.company || githubData.blog" class="flex items-center justify-between gap-2">
              <div class="flex-1 flex gap-2">
                <div v-if="githubData.location" class="flex items-center gap-2 text-sm text-muted flex-1">
                  <UIcon name="i-lucide-map-pin" class="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span class="truncate">{{ githubData.location }}</span>
                </div>
                <div v-if="githubData.company" class="flex items-center gap-2 text-sm text-muted flex-1 hidden sm:flex">
                  <UIcon name="i-lucide-building-2" class="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <span class="truncate">{{ githubData.company }}</span>
                </div>
                <div v-if="githubData.blog" class="flex items-center gap-2 text-sm text-muted flex-1 hidden sm:flex">
                  <UIcon name="i-lucide-globe" class="w-4 h-4 flex-shrink-0 text-gray-400" />
                  <a :href="githubData.blog" target="_blank" class="hover:text-white transition-colors truncate">
                    {{ githubData.blog }}
                  </a>
                </div>
              </div>
            </div>
          </div>

          <!-- Divider after profile info -->
          <hr class="border-white/10" />

          <!-- Top Repository -->
          <div class="space-y-2 flex-1">
            <h4 class="text-sm font-medium text-white">Top Repository</h4>
            <div class="space-y-2 max-h-48 overflow-y-auto">
              <div
                v-for="repo in githubTopRepos"
                :key="repo.name"
                class="group p-3 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200 cursor-pointer"
                @click="$event.target.closest('a')?.click()"
              >
                <a :href="repo.html_url" target="_blank" class="block">
                  <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-white hover:text-blue-400 truncate block mb-1 group-hover:translate-x-1 transition-transform duration-200">
                        {{ repo.name }}
                      </p>
                      <p v-if="repo.description" class="text-xs text-muted line-clamp-2 mb-2">
                        {{ repo.description }}
                      </p>
                      <div v-if="repo.language" class="flex items-center gap-2 mb-2">
                        <div
                          class="w-2 h-2 rounded-full"
                          :style="{ backgroundColor: getLanguageColor(repo.language) }"
                        ></div>
                        <span class="text-xs text-muted">{{ repo.language }}</span>
                      </div>
                    </div>
                    <div class="flex flex-col items-end gap-1 ml-2 text-xs text-muted">
                      <div class="flex items-center gap-1">
                        <UIcon name="i-lucide-star" class="w-3 h-3" />
                        <span>{{ repo.stars }}</span>
                      </div>
                      <div class="flex items-center gap-1">
                        <UIcon name="i-lucide-git-fork" class="w-3 h-3" />
                        <span>{{ repo.forks }}</span>
                      </div>
                    </div>
                  </div>
                </a>
              </div>
            </div>
          </div>

          <!-- GitHub Profile Link Button -->
        </div>
      </UCard>
      <div v-else class="w-full max-w-md min-w-[320px] min-h-[400px] max-h-[600px] flex items-center justify-center rounded-2xl bg-white/5 border border-white/10 backdrop-blur-lg">
        <div class="text-center">
          <UIcon name="i-lucide-github" class="w-12 h-12 text-muted mx-auto mb-2" />
          <p class="text-muted">Failed to load GitHub data</p>
        </div>
      </div>
    </div>

    <!-- Discord Widget -->
    <div class="w-full max-w-md min-w-[320px]">
      <UCard
        class="w-full max-w-md min-w-[320px] min-h-[400px] max-h-[600px] bg-white/5 border border-white/10 backdrop-blur-lg shadow-xl rounded-2xl overflow-hidden flex flex-col"
        :ui="{ body: { base: 'p-6 flex-1 flex flex-col' } }"
      >
        <div v-if="discordError" class="text-red-500 text-center">
          Failed to load Discord status
        </div>
        <div v-else class="flex flex-col gap-3 flex-1">
          <!-- User Info -->
          <div class="flex items-center gap-4">
            <ULink to="https://discord.gg/9ngaRvjGBp" target="_blank">
              <UAvatar
                :src="`https://cdn.discordapp.com/avatars/${discordData.data.discord_user.id}/${discordData.data.discord_user.avatar}.png`"
                :alt="discordData.data.discord_user.display_name"
                size="xl"
                class="relative cursor-pointer"
              />
            </ULink>
            <div class="flex-1 min-w-0">
              <div class="flex items-center justify-between gap-2">
                <div class="flex items-center gap-2">
                  <h3 class="text-lg font-semibold" :class="discordData.data.discord_status === 'offline' ? 'text-muted' : 'gradient-name'">
                    {{ discordData.data.discord_user.display_name }}
                  </h3>
                  <div class="flex gap-0">
                    <UIcon
                      v-for="device in devices"
                      :key="device.name"
                      :name="device.icon"
                      class="w-4 h-4 text-green-500"
                      :title="device.name"
                    />
                  </div>
                </div>
              </div>
              <div class="flex items-center gap-2">
                <UIcon :name="statusConfig.icon" :class="['-mr-1 w-4 h-4', statusConfig.color]" />
                <p class="text-sm text-muted">{{ statusConfig.text }}</p>
              </div>
            </div>
          </div>

          <!-- Custom Status -->
          <div v-if="customStatus" class="relative">
            <div class="flex items-center gap-2 mb-1">
              <UIcon name="i-lucide-message-circle" class="-mr-1 w-4 h-4 text-green-500" />
              <p class="text-xs text-muted">Status</p>
            </div>
            <div class="relative border border-white/10 rounded-lg p-2">
              <p v-if="customStatus.state" class="text-sm font-medium text-white">{{ customStatus.state }}</p>
              <p v-if="customStatus.details" class="text-xs text-muted">{{ customStatus.details }}</p>
            </div>
          </div>

          <!-- Separator (hidden when offline) -->
          <hr v-if="discordData.data.discord_status !== 'offline'" class="border-white/10 my-2" />

          <!-- Activities -->
          <div class="flex flex-col gap-4">
            <!-- Spotify Activity -->
            <div v-if="discordData.data.listening_to_spotify && discordData.data.spotify">
              <div class="flex items-center gap-3 p-3 rounded-lg bg-white/10">
                <img
                  :src="discordData.data.spotify.album_art_url"
                  alt="Album art"
                  class="w-12 h-12 rounded-md"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-1">
                    <UIcon name="i-lucide-music" class="-mr-1 w-4 h-4 text-green-500" />
                    <p class="text-xs text-muted">Listening on Spotify</p>
                  </div>
                  <div class="bg-white/5 border border-white/10 rounded-md p-2">
                    <p class="text-sm font-medium text-white">{{ discordData.data.spotify.song }}</p>
                    <p class="text-xs text-muted">by {{ discordData.data.spotify.artist }}</p>
                  </div>
                </div>
              </div>
            </div>

            <!-- Primary Activity -->
            <div v-if="primaryActivity" class="flex items-center gap-3 p-3 rounded-lg bg-white/10">
              <div class="relative flex-shrink-0">
                <img
                  v-if="getAssetUrl(primaryActivity, 'large')"
                  :src="getAssetUrl(primaryActivity, 'large')"
                  :alt="primaryActivity.assets?.large_text || primaryActivity.name"
                  class="w-12 h-12 rounded-md"
                />
                <UIcon
                  v-else
                  :name="activityIcon(primaryActivity)"
                  class="w-12 h-12 text-muted"
                />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <UIcon :name="activityTypeConfig(primaryActivity).icon" class="-mr-1 w-4 h-4 text-green-500" />
                  <p class="text-xs text-muted">{{ activityTypeConfig(primaryActivity).text }}</p>
                </div>
                <div class="bg-white/5 border border-white/10 rounded-md p-2">
                  <p class="text-sm font-medium text-white">{{ primaryActivity.name }}</p>
                  <p v-if="primaryActivity.details" class="text-xs text-muted">{{ primaryActivity.details }}</p>
                  <p v-if="primaryActivity.state" class="text-xs text-muted">{{ primaryActivity.state }}</p>
                </div>
              </div>
            </div>

            <!-- Other Activities -->
            <div v-for="activity in otherActivities" :key="activity.id" class="flex items-center gap-3 p-3 rounded-lg bg-white/10">
              <div class="relative flex-shrink-0">
                <img
                  v-if="getAssetUrl(activity, 'large')"
                  :src="getAssetUrl(activity, 'large')"
                  :alt="activity.assets?.large_text || activity.name"
                  class="w-12 h-12 rounded-md"
                />
                <UIcon
                  v-else
                  :name="activityIcon(activity)"
                  class="w-12 h-12 text-muted"
                />
              </div>
              <div class="flex-1">
                <div class="flex items-center gap-2 mb-1">
                  <UIcon :name="activityTypeConfig(activity).icon" class="-mr-1 w-4 h-4 text-green-500" />
                  <p class="text-xs text-muted">{{ activityTypeConfig(activity).text }}</p>
                </div>
                <div class="bg-white/5 border border-white/10 rounded-md p-2">
                  <p class="text-sm font-medium text-white">{{ activity.name }}</p>
                  <p v-if="activity.details" class="text-xs text-muted">{{ activity.details }}</p>
                  <p v-if="activity.state" class="text-xs text-muted">{{ activity.state }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Discord Profile Link Button -->
        </div>
      </UCard>
    </div>
  </div>
</template>

<style scoped>
.text-white-shadow {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}

.gradient-name {
  background-image: linear-gradient(45deg, #ff4848, #802c2c, #ff4848);
  background-size: 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  font-weight: 600;
  animation: shimmer 1.4s linear infinite;
}
@keyframes shimmer {
  0% { background-position: 0% 50%; }
  100% { background-position: 200% 50%; }
}

.aqua-gradient {
  background-image: linear-gradient(45deg, #00d4ff, #0286b3, #00d4ff);
  background-size: 200%;
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  font-weight: 600;
  animation: shimmer 1.7s linear infinite;
}
</style>