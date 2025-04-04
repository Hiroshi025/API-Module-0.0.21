import { StreamSite } from "@typings/types/types";

export const DATA_PATH = "./data.json";
export const SCHEDULE_QUERY = `query($page: Int, $amount: Int = 50, $ids: [Int!]!, $nextDay: Int!, $dateStart: Int) {
  Page(page: $page, perPage: $amount) {
    pageInfo {
      hasNextPage
    }
    airingSchedules(notYetAired: true, mediaId_in: $ids, sort: TIME, airingAt_greater: $dateStart, airingAt_lesser: $nextDay) {
      media {
        id
        siteUrl
        format
        duration
        episodes
        title {
          native
          romaji
          english
        }
        coverImage {
          large
          color
        }
        externalLinks {
          site
          url
        }
      }
      id
      episode
      airingAt
      timeUntilAiring
    }
  }
}`;

const iconIds = process.env.STREAM_SITE_ICONS
  ? process.env.STREAM_SITE_ICONS.split(",")
  : new Array(8).fill(null);
export const STREAMING_SITES: StreamSite[] = [
  { name: "Amazon", icon: iconIds[0] },
  { name: "AnimeLab", icon: iconIds[1] },
  { name: "Crunchyroll", icon: iconIds[2] },
  { name: "Funimation", icon: iconIds[3] },
  { name: "HIDIVE", icon: iconIds[4] },
  { name: "Hulu", icon: iconIds[5] },
  { name: "Netflix", icon: iconIds[6] },
  { name: "VRV", icon: iconIds[7] },
  { name: "YouTube", icon: iconIds[8], filter: ({ url }) => url.includes("/playlist") },
  { name: "Bilibili TV", icon: iconIds[9] },
  { name: "iQIYI", icon: iconIds[10] },
];