import React from "react";
import {afterEach,describe,expect,it,vi} from "vitest";
import {cleanup,fireEvent,render,screen} from "@testing-library/react";
import {CommunityChart} from "./InsightCharts";

vi.mock("recharts",async original=>({...await original(),ResponsiveContainer:()=>null}));
afterEach(cleanup);

describe("community population filters",()=>{
  it("filters enrollment before counting, labels the selected cohort and respects missing ratios",()=>{
    const users=[{id:1,userId:1,eventId:763,level:40,userAuditRatio:1},
      {id:2,userId:1,eventId:763,level:41,userAuditRatio:1.1},
      {id:3,userId:2,eventId:763,level:35,userAuditRatio:null},
      {id:4,userId:3,eventId:1195,level:20,userAuditRatio:.5}];
    render(<CommunityChart users={users} labels={[{name:"Cohort 4-SP9",description:"Module #763"}]}
      userId={1} level={41} ratio={1.1}/>);
    expect(screen.getByText(/3 students · All Reboot01/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"My cohort · Cohort 4"}));
    expect(screen.getByText(/2 students · Cohort 4/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"Audit ratio",exact:true}));
    expect(screen.getByText(/1 students · Cohort 4/)).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"All Reboot01 students"}));
    expect(screen.getByText(/2 students · All Reboot01/)).toBeTruthy();
  });
});
