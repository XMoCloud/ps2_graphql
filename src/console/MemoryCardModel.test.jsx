import React from "react";
import {afterEach,describe,expect,it,vi} from "vitest";
import {act,cleanup,fireEvent,render,screen} from "@testing-library/react";
import MemoryCardModel from "./MemoryCardModel";
import {drawMemoryCard} from "./memoryCardRenderer";

vi.mock("./memoryCardRenderer",()=>({frontTexture:()=>({}),rearTexture:async()=>({}),drawMemoryCard:vi.fn()}));
afterEach(()=>{cleanup();vi.useRealTimers();vi.clearAllMocks();});

describe("memory-card hover continuity",()=>{
  it("begins at the resting pose and settles back to the same pose on every exit",async()=>{
    vi.useFakeTimers();
    await act(async()=>render(<button>Card<MemoryCardModel card={{id:"module",short:"MODULE",color:"#597abe"}} number={0}/></button>));
    expect(drawMemoryCard.mock.calls.at(-1).slice(2)).toEqual([0,0]);
    const button=screen.getByRole("button",{name:"Card"});
    for(let visit=0;visit<2;visit++){
      fireEvent.pointerEnter(button);
      // Entry itself must not change orientation before the first animation frame.
      expect(drawMemoryCard.mock.calls.at(-1).slice(2)).toEqual([0,0]);
      act(()=>vi.advanceTimersByTime(48));
      expect(drawMemoryCard.mock.calls.at(-1)[2]).toBeGreaterThan(0);
      expect(drawMemoryCard.mock.calls.at(-1)[2]).toBeLessThan(4);
      fireEvent.pointerLeave(button);
      act(()=>vi.advanceTimersByTime(500));
      expect(drawMemoryCard.mock.calls.at(-1).slice(2)).toEqual([0,0]);
      expect(vi.getTimerCount()).toBe(0);
    }
  });
});
