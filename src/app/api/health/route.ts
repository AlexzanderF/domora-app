// Liveness probe for container healthchecks. Deliberately independent of the
// database so a DB outage does not make the orchestrator restart web.
export const dynamic = "force-dynamic";

export function GET() {
  return Response.json(
    { status: "ok" },
    { headers: { "Cache-Control": "no-store" } },
  );
}
