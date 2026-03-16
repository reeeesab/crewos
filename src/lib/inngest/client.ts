import { Inngest } from "inngest";

export const inngest = new Inngest({
  id: "saasforge",
  eventKey: process.env.INNGEST_EVENT_KEY ?? "local",
});
