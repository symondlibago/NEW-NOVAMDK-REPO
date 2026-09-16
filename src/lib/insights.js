/* Same shape as lib/portal.js: one place that knows the endpoints, so the page
   only deals in data and errors it can show someone. */

async function post(url, body) {
  let res;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify(body),
    });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}

async function get(url) {
  let res;
  try {
    res = await fetch(url, { credentials: "same-origin" });
  } catch {
    throw new Error("Can't reach the server. Check your connection and try again.");
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.error || "Something went wrong. Please try again.");
    err.status = res.status;
    throw err;
  }
  return data;
}

/* All three go to one endpoint, which is a deployment constraint rather than a
   design choice: Vercel's Hobby plan caps a deployment at 12 serverless
   functions and api/ had reached 13. POST carries the auth actions, GET carries
   the data, and `resource` picks which data.

   They stay separate calls from the page's point of view: the CRM panels have no
   date window, and one source being slow or unconfigured must not hold up the
   other. */
export const insightsAuth = (body) => post("/api/insights", body);
export const insightsData = (days) => get(`/api/insights?days=${days}`);
export const insightsOps = () => get("/api/insights?resource=ops");
