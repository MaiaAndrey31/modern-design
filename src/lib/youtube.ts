const YOUTUBE_ID = /^[A-Za-z0-9_-]{11}$/;

/**
 * Extracts the 11-char video id from any common YouTube URL shape
 * (watch?v=, youtu.be/, /embed/, /shorts/, /live/) — or a bare id.
 * Returns null for anything else, so it doubles as the validator.
 */
export function parseYouTubeId(input: string): string | null {
  const value = input.trim();
  if (YOUTUBE_ID.test(value)) return value;

  let url: URL;
  try {
    url = new URL(value.startsWith("http") ? value : `https://${value}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www\.|m\.|music\.)/, "");
  let id: string | null = null;
  if (host === "youtu.be") {
    id = url.pathname.split("/")[1] ?? null;
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (url.pathname === "/watch") id = url.searchParams.get("v");
    else {
      const [, kind, candidate] = url.pathname.split("/");
      if (kind === "embed" || kind === "shorts" || kind === "live" || kind === "v") id = candidate ?? null;
    }
  }

  return id && YOUTUBE_ID.test(id) ? id : null;
}

/** Muted, looping, chrome-less embed suitable for a decorative background. */
export function youTubeBackgroundEmbedUrl(id: string): string {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    loop: "1",
    playlist: id, // required for loop=1 to work on a single video
    controls: "0",
    playsinline: "1",
    rel: "0",
    disablekb: "1",
    iv_load_policy: "3",
    fs: "0",
  });
  return `https://www.youtube-nocookie.com/embed/${id}?${params}`;
}
