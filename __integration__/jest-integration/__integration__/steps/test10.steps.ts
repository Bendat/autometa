import { Given } from "@autometa/runner";

Given('a string {primitive}', (val)=>{
    expect(val).toBe("abc123")
})