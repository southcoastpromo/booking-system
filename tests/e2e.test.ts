import request from "supertest";
import express from "express";
import healthRoute from "../server/routes/health";

const app = express();
app.use(healthRoute);

describe("GET /health", () => {
  it("should return ok", async () => {
    const res = await request(app).get("/health");
    expect(res.status).toBe(200);
    expect(res.body).toMatchObject({ ok: true });
  });
});
