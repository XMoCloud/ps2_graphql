import { describe, expect, it } from "vitest";
import { projectOutcomes, completedPiscines, projectXPBreakdown, communityDistribution,
  skillGains, skillHistory, auditBalanceHistory, auditOutcomes, preciseXP, cohortOptions, studentCohort } from "./analytics";

describe("dashboard metric integrity", () => {
  it("excludes ungraded projects and counts a graded zero as failed", () => {
    expect(projectOutcomes([{grade:1.2},{grade:0},{grade:null},{grade:undefined}]))
      .toEqual({passed:1,failed:1,ungraded:2,projects:4});
  });
  it("retains failed progress attempts after a pass without counting mirrored result grades twice",()=>{
    const failed={id:10,grade:0,createdAt:"2026-01-01"};
    const passed={id:11,grade:1.2,createdAt:"2026-02-01"};
    expect(projectOutcomes([{name:"lem-in",passed:true,grade:1.2,
      progress:[failed,{...failed,id:"10"},passed],history:[{...passed,id:200}]}]))
      .toEqual({passed:1,failed:1,ungraded:0,projects:1});
  });
  it("counts distinct historical result attempts while merging duplicate project names",()=>{
    const failed={id:1,grade:.5,createdAt:"2026-01-01"};
    const passed={id:3,grade:1.2,createdAt:"2026-03-01"};
    expect(projectOutcomes([
      {name:" GraphQL ",objectId:10,path:"/old/graphql",history:[failed,{id:2,grade:0,createdAt:"2026-02-01"}],progress:[]},
      {name:"graphql",objectId:20,path:"/new/graphql",history:[{...failed,id:"1"},passed,passed],progress:[]},
      {name:"filler",grade:null,history:[],progress:[]},
    ])).toEqual({passed:1,failed:2,ungraded:1,projects:2});
  });
  it("requires a passing piscine root, not just enrollment or passing exercises", () => {
    expect(completedPiscines({events:[{event:{path:"/bahrain/bh-piscine"}}],allProgress:[
      {path:"/bahrain/bh-piscine/hello",grade:1},{path:"/bahrain/bh-module/piscine-js",grade:0},
      {path:"/bahrain/bh-module/piscine-rust",grade:1},
    ],results:[{path:"/bahrain/bh-module/piscine-rust",grade:1}]})).toBe(1);
  });
  it("keeps every XP unit, deduplicates transaction IDs and separates same-name contexts", () => {
    const a={id:1,path:"/one/same",objectId:1,amount:75250,object:{name:"same"}};
    const rows=projectXPBreakdown([a,a,{...a,id:2,amount:123},{...a,id:3,path:"/two/same",amount:500},
      {...a,id:4,type:"level",amount:80},{...a,id:5,amount:-123}]);
    expect(rows.map(r=>r.amount)).toEqual([75250,500]);
    expect(rows.reduce((n,r)=>n+r.amount,0)).toBe(75750);
    expect(preciseXP(75250)).toBe("75.25 kB");
    expect(preciseXP(2551250)).toBe("2.55 MB");
    expect(projectXPBreakdown([{...a,id:6,amount:-100}])[0].amount).toBe(-100);
  });
  it("counts students once and respects range boundaries, zeroes and missing ratios", () => {
    const people=[{id:1,userId:1,level:39,userAuditRatio:.9},{id:2,userId:1,level:40,userAuditRatio:1},
      {id:3,userId:2,level:50,userAuditRatio:null},{id:4,userId:3,level:0,userAuditRatio:0}];
    const levels=communityDistribution(people,"level",40);
    expect(levels.reduce((n,r)=>n+r.count,0)).toBe(3);
    expect(levels.find(r=>r.isYou)).toMatchObject({name:"40–49",count:1});
    expect(communityDistribution(people,"ratio",1).reduce((n,r)=>n+r.count,0)).toBe(2);
    expect(communityDistribution(people,"ratio",1).find(r=>r.isYou)).toMatchObject({name:"1–1.5",count:1});
  });
});
describe("distinct audit and skill insights", () => {
  const now=new Date("2026-11-15T00:00:00Z");
  it("measures personal-best improvement, ignoring declines and future records", () => {
    const skills=[{type:"skill_go",name:"Go"},{type:"skill_js",name:"JavaScript"}];
    const history=[{type:"skill_go",amount:40,createdAt:"2026-01-01"},
      {type:"skill_go",amount:20,createdAt:"2026-02-01"},{type:"skill_go",amount:55,createdAt:"2026-11-01"},
      {type:"skill_go",amount:80,createdAt:"2027-01-01"},{type:"skill_js",amount:15,createdAt:"2026-11-01"}];
    expect(skillGains(history,skills,90,now).map(r=>[r.name,r.gain])).toEqual([["Go",15],["JavaScript",15]]);
    const points=skillHistory(history,skills,now);
    expect(points.at(-1)).toEqual({date:"2026-11-01",skill_go:55,skill_js:15});
    expect(points[1].skill_go).toBe(40);
  });
  it("carries earlier credits into the balance and ends at the platform totals", () => {
    const history=[{type:"up",amount:1000,createdAt:"2025-01-01"},
      {type:"down",amount:300,createdAt:"2026-10-01"},{type:"up",amount:200,createdAt:"2026-11-01"},
      {type:"up",amount:9999,createdAt:"2027-01-01"}];
    const rows=auditBalanceHistory(history,1200,300,now);
    expect(rows[0].balance).toBe(1000);
    expect(rows.at(-2).balance).toBe(700);
    expect(rows.at(-1).balance).toBe(900);
    expect(auditBalanceHistory([],1200,300,now)).toEqual([]);
  });
  it("separates failed reviews from waiting and expired assignments", () => {
    const [given]=auditOutcomes([{grade:1},{grade:0},{grade:null,endAt:"2020-01-01"},{grade:null,endAt:"2027-01-01"}],[],now.getTime());
    expect(given).toEqual({name:"Given",passed:1,failed:1,open:1,expired:1});
  });
});

describe("cohort population mapping",()=>{
  const labels=[{name:"Cohort 4-SP7&8",description:"Module #763"},
    {name:"Cohort 4-SP9",description:"Module #763"},
    {name:"Cohort 8",description:"Event #2775"},
    {name:"Cohort 31uag",description:"Module #2775"},
    {name:"Cohort 5",description:"No module identifier"}];
  it("groups cohort variants, ignores malformed labels and maps the student's enrollment",()=>{
    const cohorts=cohortOptions(labels);
    expect(cohorts).toEqual([{id:"4",name:"Cohort 4",eventIds:[763]},{id:"8",name:"Cohort 8",eventIds:[2775]}]);
    expect(studentCohort(cohorts,[{userId:123,eventId:763}],"123").name).toBe("Cohort 4");
    expect(studentCohort(cohorts,[],123,[{eventId:2775,event:{path:"/bahrain/bh-module"}}]).name).toBe("Cohort 8");
    expect(studentCohort(cohorts,[],123)).toBeNull();
  });
});
