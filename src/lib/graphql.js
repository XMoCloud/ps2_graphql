import { getToken } from './auth';

const GRAPHQL_URL = 'https://learn.reboot01.com/api/graphql-engine/v1/graphql';

export async function graphqlQuery(query, variables = {}) {
  const token = getToken();
  
  const response = await fetch(GRAPHQL_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  const result = await response.json();
  
  if (result.errors) {
    throw new Error(result.errors[0].message);
  }
  
  return result.data;
}

export const QUERIES = {
  USER: `
    query {
      user {
        id
        login
        firstName
        lastName
        email
        createdAt
      }
    }
  `,

  LEVEL: `
    query {
      transaction(
        where: {
          type: { _eq: "level" }
          path: { _like: "%bh-module%" }
        }
        order_by: { amount: desc }
        limit: 1
      ) {
        amount
      }
    }
  `,
  
  AUDIT_TOTALS: `
    query {
      up: transaction_aggregate(
        where: { type: { _eq: "up" } }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
      down: transaction_aggregate(
        where: { type: { _eq: "down" } }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
    }
  `,
  
  XP_OVERVIEW: `
    query {
      transaction_aggregate(
        where: {
          event: { path: { _eq: "/bahrain/bh-module" } }
          type: { _eq: "xp" }
        }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
      result(
        where: {
          _and: [
            { path: { _like: "%bh-module%" } }
            { type: { _eq: "user_audit" } }
            { grade: { _gte: 1.0 } }
          ]
        }
        order_by: { createdAt: desc }
      ) {
        grade
        object {
          name
        }
      }
    }
  `,
  
  XP_PROGRESS: `
    query {
      transaction_aggregate(
        where: {
          event: { path: { _eq: "/bahrain/bh-module" } }
          type: { _eq: "xp" }
        }
      ) {
        aggregate {
          sum {
            amount
          }
        }
      }
      transaction(
        where: {
          type: { _eq: "xp" }
          object: { type: { _eq: "project" } }
        }
        order_by: { createdAt: asc }
      ) {
        createdAt
        amount
        object {
          name
        }
      }
    }
  `,
  
  PROJECTS: `
    query {
      result(
        where: {
          _and: [
            { path: { _like: "%bh-module%" } }
            { type: { _eq: "user_audit" } }
          ]
        }
        order_by: { createdAt: desc }
      ) {
        grade
        createdAt
        object {
          name
        }
      }
      transaction(
        where: {
          type: { _eq: "xp" }
          path: { _like: "%bh-module%" }
        }
      ) {
        amount
        object {
          name
        }
      }
    }
  `,
  
  SKILLS: `
    query {
      transaction(
        where: { type: { _like: "skill_%" } }
        distinct_on: [type]
        order_by: [{ type: asc }, { amount: desc }]
      ) {
        type
        amount
      }
    }
  `,
};
