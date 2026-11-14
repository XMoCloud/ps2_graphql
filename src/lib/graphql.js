import { getToken } from "./auth";

const GRAPHQL_URL = "https://learn.reboot01.com/api/graphql-engine/v1/graphql";

export async function graphqlQuery(query, variables = {}) {
  const token = getToken();

  const response = await fetch(GRAPHQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Your session expired. Please sign in again."
        : "The service could not be reached.",
    );
  const result = await response.json();

  if (result.errors) {
    throw new Error(result.errors[0].message);
  }

  return result.data;
}

// Continue even if the server applies a smaller page cap than requested.
// Stable ID ordering prevents equal timestamps from reordering pages.
export async function graphqlPages(query, collection, request = graphqlQuery, variables = {}) {
  const rows = [],
    seen = new Set();
  let first;
  for (let page = 0; page < 200; page++) {
    const data = await request(query, { ...variables, limit: 500, offset: rows.length });
    if (!first) first = data;
    const batch = data[collection];
    if (!Array.isArray(batch)) throw new Error("Missing GraphQL collection");
    if (!batch.length) return { ...first, [collection]: rows };
    for (const row of batch) {
      if (seen.has(row.id))
        throw new Error("Records changed while loading. Refresh to retry.");
      seen.add(row.id);
      rows.push(row);
    }
  }
  throw new Error(
    "History is too large to load completely. Narrow the query scope.",
  );
}
