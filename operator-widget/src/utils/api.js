export async function apiGet(url) {
  const backend = import.meta.env.VITE_BACKEND_URL;
  const res = await fetch(`${backend}${url}`);
  return res.json();
}

export async function apiPost(url, body = {}) {
  const backend = import.meta.env.VITE_BACKEND_URL;
  const res = await fetch(`${backend}${url}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return res.json();
}