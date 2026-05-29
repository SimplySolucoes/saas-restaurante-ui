const DEFAULT_LOCAL_API = "http://127.0.0.1:8001/api";

function parseList(value) {
  return (value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

const tunnelFrontHosts = parseList(
  process.env.NEXT_PUBLIC_TUNNEL_FRONT_HOSTS || "cold-actors-stay.loca.lt"
);

const tunnelApiUrl =
  process.env.NEXT_PUBLIC_TUNNEL_API_URL ||
  "https://camcorder-untagged-reappear.ngrok-free.dev/api";

/** URL da API conforme o host do browser (localhost vs túnel do front). */
export function getApiUrl() {
  if (
    typeof window !== "undefined" &&
    tunnelFrontHosts.includes(window.location.hostname)
  ) {
    return tunnelApiUrl;
  }
  return process.env.NEXT_PUBLIC_API_URL || DEFAULT_LOCAL_API;
}
