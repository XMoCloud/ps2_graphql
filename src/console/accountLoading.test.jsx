import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, renderHook, waitFor } from "@testing-library/react";
import { useAccount } from "./data";
import { ACCOUNT_QUERIES } from "./queries";
import { graphqlPages, graphqlQuery } from "../lib/graphql";

vi.mock("../lib/auth",()=>({getUserIdFromToken:()=>"123"}));
vi.mock("../lib/graphql",()=>({graphqlPages:vi.fn(),graphqlQuery:vi.fn()}));
afterEach(()=>{cleanup();vi.clearAllMocks();});

describe("account and community loading",()=>{
  it("keeps personal history scoped and omits undeclared account variables from the community query",async()=>{
    graphqlQuery.mockResolvedValue({user:[{id:123,totalUp:0,totalDown:0}],event_user:[],
      moduleXP:{aggregate:{sum:{amount:0}}},allXP:{aggregate:{sum:{amount:0}}}});
    graphqlPages.mockImplementation(async(query,collection,request,variables)=>{
      if(query===ACCOUNT_QUERIES.community){
        if("userId" in variables) throw new Error("unexpected variables: userId");
        return {event_user:[{id:1,userId:12,level:40,userAuditRatio:1}]};
      }
      if(query===ACCOUNT_QUERIES.cohorts){
        expect(variables).toEqual({});
        return {label:[{id:1,name:"Cohort 4",description:"Module #763"}]};
      }
      expect(variables).toEqual({userId:123});
      return {[collection]:[]};
    });
    const {result}=renderHook(()=>useAccount(false));
    await waitFor(()=>expect(result.current.loading).toBe(false));
    expect(result.current.errors).toEqual([]);
    expect(result.current.data.communityUsers).toHaveLength(1);
    expect(result.current.data.communityCohorts[0].name).toBe("Cohort 4");
    expect(graphqlQuery.mock.calls[0][1]).toEqual({userId:123});
  });
});
