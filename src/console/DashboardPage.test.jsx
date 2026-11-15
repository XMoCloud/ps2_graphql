import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import DashboardPage from "./DashboardPage";
import { SAMPLE } from "./data";

vi.mock("./Charts",async original=>({ ...await original(), XPChart:()=>null,
  OutcomeChart:({passed,failed})=><div>{passed} passed / {failed} failed</div> }));
vi.mock("./InsightCharts",()=>({CommunityChart:()=>null,ProjectXPChart:()=>null}));
afterEach(cleanup);

describe("overview summaries",()=>{
  it("shows a past failed attempt after a pass while counting a reissued project once",()=>{
    const path="/bahrain/bh-module/lem-in";
    const failed={id:1,objectId:1,path,grade:.8,createdAt:"2026-01-01",object:{id:1,name:"lem-in",type:"project"}};
    const passed={...failed,id:2,objectId:2,path:`${path}-reissued`,grade:1.2,createdAt:"2026-02-01",object:{id:2,name:"lem-in",type:"project"}};
    const data={...SAMPLE,results:[],allProgress:[failed,passed,failed],allTransactions:[],transactions:[]};
    render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><DashboardPage data={data}/></MemoryRouter>);
    expect(screen.getByText("1 passed / 1 failed")).toBeTruthy();
    expect(screen.getByText("1 unique project.")).toBeTruthy();
    expect(screen.getByText(/including past failures/)).toBeTruthy();
  });
  it("shows only graded project outcomes and replaces repeated audit/skill panels",()=>{
    const projects=[1,0,null].map((grade,i)=>({id:i+1,objectId:i+1,path:`/bahrain/bh-module/project-${i}`,
      grade,createdAt:"2026-01-01",type:"user_audit",object:{id:i+1,name:`project-${i}`,type:"project"}}));
    const data={...SAMPLE,results:projects,allProgress:[],allTransactions:[],transactions:[]};
    render(<MemoryRouter future={{v7_startTransition:true,v7_relativeSplatPath:true}}><DashboardPage data={data}/></MemoryRouter>);
    expect(screen.getByText("1 passed / 1 failed")).toBeTruthy();
    expect(screen.getByText("1 ungraded project excluded from this chart.")).toBeTruthy();
    for(const name of ["User Distribution","Projects XP"]) expect(screen.getByRole("heading",{name})).toBeTruthy();
    for(const name of ["Audit exchange","Skill signal"]) expect(screen.queryByRole("heading",{name})).toBeNull();
    expect(screen.getByText("Skills Mastered")).toBeTruthy();
    expect(screen.getByText("Piscines Completed")).toBeTruthy();
    expect(screen.queryByText("Projects passed")).toBeNull();
  });
});
