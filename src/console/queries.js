// Account-scoped operations validated against the reference dashboard's API.
// Query templates contain no credentials, user identifiers or contact fields.
const page = "$userId: Int!, $limit: Int! = 500, $offset: Int! = 0";
export const ACCOUNT_QUERIES = {
  community: `query ConsoleCommunity($limit: Int! = 500, $offset: Int! = 0) {
    event_user(where: {event: {path: {_eq: "/bahrain/bh-module"}}}, order_by: {id: asc}, limit: $limit, offset: $offset) {
      id userId eventId level userAuditRatio
    }
  }`,
  cohorts: `query ConsoleCohorts($limit: Int! = 500, $offset: Int! = 0) {
    label(where: {name: {_ilike: "cohort%"}}, order_by: {id: asc}, limit: $limit, offset: $offset) {
      id name description
    }
  }`,
  profile: `query ConsoleProfile($userId: Int!) {
    user(where: {id: {_eq: $userId}}) {
      id login firstName lastName createdAt campus auditRatio totalUp totalDown
    }
    moduleXP: transaction_aggregate(where: {userId: {_eq: $userId}, type: {_eq: "xp"}, event: {path: {_eq: "/bahrain/bh-module"}}}) { aggregate { sum { amount } } }
    allXP: transaction_aggregate(where: {userId: {_eq: $userId}, type: {_eq: "xp"}}) { aggregate { sum { amount } } }
    event_user(where: {userId: {_eq: $userId}}) { id eventId level event { path } }
  }`,
  transactions: `query ConsoleTransactions(${page}) {
    transaction(where: {userId: {_eq: $userId}, _or: [{type: {_in: ["xp", "level", "up", "down"]}}, {type: {_like: "skill_%"}}]}, order_by: {id: asc}, limit: $limit, offset: $offset) {
      id type amount path createdAt objectId eventId object { id name type } event { path }
    }
  }`,
  progress: `query ConsoleProgress(${page}) {
    progress(where: {userId: {_eq: $userId}}, order_by: {id: asc}, limit: $limit, offset: $offset) {
      id objectId path grade isDone createdAt updatedAt object { id name type }
    }
  }`,
  results: `query ConsoleResults(${page}) {
    result(where: {userId: {_eq: $userId}}, order_by: {id: asc}, limit: $limit, offset: $offset) {
      id objectId path grade type createdAt object { id name type }
    }
  }`,
  given: `query ConsoleAuditsGiven(${page}) {
    audit(where: {auditorId: {_eq: $userId}}, order_by: {id: asc}, limit: $limit, offset: $offset) {
      id grade createdAt endAt resultId group { path }
    }
  }`,
  received: `query ConsoleAuditsReceived(${page}) {
    audit(where: {group: {members: {userId: {_eq: $userId}}}}, order_by: {id: asc}, limit: $limit, offset: $offset) {
      id grade createdAt endAt resultId group { path }
    }
  }`,
  groups: `query ConsoleGroups(${page}) {
    group_user(where: {userId: {_eq: $userId}}, order_by: {id: asc}, limit: $limit, offset: $offset) {
      id group {
        id objectId captainId status path createdAt updatedAt
        object { id name type attrs }
        members { userId user { id login firstName lastName } }
      }
    }
  }`,
};
