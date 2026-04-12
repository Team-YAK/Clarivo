import test, { after } from "node:test";
import assert from "node:assert/strict";

import { streamAndConfirmIntent } from "../src/utils/patientApi.ts";

const encoder = new TextEncoder();
const originalFetch = global.fetch;
const originalWarn = console.warn;

function makeSseResponse(lines: string[]): Response {
  const body = new ReadableStream({
    start(controller) {
      for (const line of lines) {
        controller.enqueue(encoder.encode(line));
      }
      controller.close();
    },
  });

  return new Response(body, {
    status: 200,
    headers: { "Content-Type": "text/event-stream" },
  });
}

after(() => {
  global.fetch = originalFetch;
  console.warn = originalWarn;
});

test("streamAndConfirmIntent performs intent then confirm without tree fallback routes", async () => {
  console.warn = () => {};
  const calls: string[] = [];

  global.fetch = (async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    calls.push(url);

    if (url.endsWith("/api/intent")) {
      return makeSseResponse([
        `data: ${JSON.stringify({ token: "I want " })}\n`,
        `data: ${JSON.stringify({ token: "coffee" })}\n`,
        `data: ${JSON.stringify({
          done: true,
          session_id: "s_intent_1",
          full_sentence: "I want coffee",
          confidence: 0.94,
        })}\n`,
      ]);
    }

    if (url.endsWith("/api/confirm")) {
      assert.equal(init?.method, "POST");
      return new Response(
        JSON.stringify({
          session_id: "s_intent_1",
          sentence: "I want coffee",
          audio_url: "/audio/coffee.mp3",
          voice_source: "cloned",
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  }) as typeof fetch;

  const tokens: string[] = [];
  const result = await streamAndConfirmIntent({
    path: ["drink", "coffee"],
    onToken: (token) => {
      tokens.push(token);
    },
  });

  assert.deepEqual(tokens, ["I want ", "coffee"]);
  assert.equal(result.sentence, "I want coffee");
  assert.equal(result.sessionId, "s_intent_1");
  assert.equal(result.audioUrl, "/audio/coffee.mp3");
  assert.equal(result.voiceSource, "cloned");
  assert.equal(result.error, null);
  assert.deepEqual(
    calls.map((url) => url.slice(url.lastIndexOf("/api"))),
    ["/api/intent", "/api/confirm"],
  );
  assert.ok(calls.every((url) => !url.includes("/api/tree/select")));
  assert.ok(calls.every((url) => !url.includes("/api/tree/confirm")));
});

test("streamAndConfirmIntent returns confirm failure without static menu fallback", async () => {
  console.warn = () => {};
  global.fetch = (async (input: RequestInfo | URL) => {
    const url = String(input);

    if (url.endsWith("/api/intent")) {
      return makeSseResponse([
        `data: ${JSON.stringify({ token: "Need " })}\n`,
        `data: ${JSON.stringify({
          done: true,
          session_id: "s_intent_2",
          full_sentence: "Need help",
          confidence: 0.71,
        })}\n`,
      ]);
    }

    if (url.endsWith("/api/confirm")) {
      return new Response("boom", { status: 500 });
    }

    throw new Error(`Unexpected fetch URL: ${url}`);
  }) as typeof fetch;

  const result = await streamAndConfirmIntent({
    path: ["help"],
  });

  assert.equal(result.sentence, "Need help");
  assert.equal(result.audioUrl, null);
  assert.equal(result.voiceSource, null);
  assert.equal(result.error, "Intent confirmation failed");
});
