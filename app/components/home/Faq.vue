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
const { data: discordData, error } = await useFetch<{ data: DiscordData; success: boolean }>(
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

// Computed properties for status and activities
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

const primaryActivity = computed(() => {
  return discordData.value?.data.activities.find((act) => act.name !== 'Spotify') || null
})

const otherActivities = computed(() => {
  return discordData.value?.data.activities.filter((act) => act.name !== 'Spotify' && act !== primaryActivity.value) || []
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

// Get asset URLs
const getAssetUrl = (activity: DiscordActivity, type: 'large' | 'small') => {
  if (!activity.assets || !activity.application_id) return ''
  const assetId = type === 'large' ? activity.assets.large_image : activity.assets.small_image
  if (!assetId) return ''
  if (assetId.startsWith('spotify:')) {
    return type === 'large' ? discordData.value?.data.spotify?.album_art_url || '' : ''
  }
  return `https://cdn.discordapp.com/app-assets/${activity.application_id}/${assetId}.png`
}
</script>

<template>
  <!-- <div class="flex flex-col items-center justify-center space-y-8 w-full sm:px-20 md:px-30">
    <div class="flex flex-col items-center justify-center gap-2">
      <h3 class="font-newsreader italic text-white-shadow text-4xl">
        {{ faq!.title }}
      </h3>
      <p class="text-center text-sm font-medium text-muted">
        {{ faq!.subtitle }}
      </p>
    </div>
    <UTabs
      :items
      orientation="horizontal"
      :ui
    >
      <template #content="{ item }">
        <UAccordion
          :unmount-on-hide="false"
          trailing-icon="lucide:plus"
          :items="item.questions"
          :ui="{
            item: 'mb-2 group px-4 transform-gpu rounded-xl border border-white/10 bg-white/5 transition duration-500 will-change-transform hover:bg-white/[0.075]',
            trailingIcon: 'group-data-[state=closed]:rotate-0 group-data-[state=open]:rotate-135',
          }"
        >
          <template #body="{ item: _item }">
            <MDC
              :value="_item.content"
              unwrap="p"
            />
          </template>
        </UAccordion>
      </template>
    </UTabs>
  </div> -->
  <div class="flex items-center justify-center">
    <UCard
      class="w-full max-w-md bg-white/5 border border-white/10 backdrop-blur-lg shadow-xl rounded-2xl"
      :ui="{ body: { base: 'p-6' } }"
    >
      <div v-if="error" class="text-red-500 text-center">
        Failed to load Discord status
      </div>
      <div v-else class="flex flex-col gap-4">
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
          <div>
            <div class="flex items-center gap-2">
              <h3 class="text-lg font-semibold" :class="discordData.data.discord_status === 'offline' ? 'text-muted' : 'gradient-name'">
                {{ discordData.data.discord_user.display_name }}
              </h3>
              <div class="ml-[4] flex gap-0">
                <UIcon
                  v-for="device in devices"
                  :key="device.name"
                  :name="device.icon"
                  class="w-4 h-4 text-green-500"
                  :title="device.name"
                />
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UIcon :name="statusConfig.icon" :class="['-mr-1 w-4 h-4', statusConfig.color]" />
              <p class="text-sm text-muted">{{ statusConfig.text }}</p>
            </div>
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
      </div>
    </UCard>
  </div>
</template>

<style scoped>
.text-white-shadow {
  text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
}
.gradient-name {
  background-image: linear-gradient(45deg, #ff4848, #aa3b3b, #ff4848);
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
</style>