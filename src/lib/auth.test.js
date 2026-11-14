import { afterEach, describe, expect, it, vi } from "vitest";
import { signIn } from "./auth";

afterEach(()=>vi.unstubAllGlobals());
describe("sign-in error classification", () => {
  it("preserves a rejected credential status for the red failure scene", async () => {
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:false,status:401,
      text:async()=>'{"error":"Incorrect password"}'}));
    await expect(signIn("preview-user","dummy-password"))
      .rejects.toMatchObject({status:401,message:'{"error":"Incorrect password"}'});
  });
  it("keeps server failures distinct from incorrect credentials", async () => {
    vi.stubGlobal("fetch",vi.fn().mockResolvedValue({ok:false,status:503,text:async()=>"Unavailable"}));
    await expect(signIn("preview-user","dummy-password")).rejects.toMatchObject({status:503});
  });
});
