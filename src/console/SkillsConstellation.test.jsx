import React from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import { SkillsPage } from "./StatusPages";
import { SAMPLE } from "./data";
import { skillRows } from "./catalog";

vi.mock("./Charts",async original=>({...await original(),ExchangeChart:()=>null}));
afterEach(cleanup);

describe("complete skill constellation",()=>{
  it("shows every skill, supports star selection and presents one-record histories clearly",()=>{
    const transactions=SAMPLE.skills.map(row=>({...row,createdAt:"2026-01-01T00:00:00Z"}));
    render(<SkillsPage data={{...SAMPLE,allTransactions:transactions}}/>);
    const skills=skillRows(SAMPLE);
    const constellation=within(screen.getByRole("group",{name:/Interactive skill constellation/}));
    expect(constellation.getAllByRole("button")).toHaveLength(skills.length);
    for(const skill of skills) expect(constellation.getByRole("button",{name:`${skill.name}, ${skill.amount} points`})).toBeTruthy();
    const rust=skills.find(row=>row.name==="Rust");
    fireEvent.click(constellation.getByRole("button",{name:`Rust, ${rust.amount} points`}));
    expect(screen.getByRole("combobox",{name:"Skill"}).value).toBe(rust.type);
    expect(within(screen.getByRole("figure",{name:"One recorded skill date"})).getByRole("heading",{name:"Rust"})).toBeTruthy();
    expect(screen.queryByText("Recent growth")).toBeNull();
    fireEvent.click(screen.getByRole("button",{name:"Technical skills",exact:true}));
    expect(screen.queryByRole("button",{name:`Rust, ${rust.amount} points`})).toBeNull();
    expect(screen.getByRole("button",{name:/Programming, \d+ points/})).toBeTruthy();
    fireEvent.click(screen.getByRole("button",{name:"All skills",exact:true}));
    expect(screen.getByRole("button",{name:`Rust, ${rust.amount} points`})).toBeTruthy();
  });
});
