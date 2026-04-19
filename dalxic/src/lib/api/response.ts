export function ok(data: unknown) {
  return Response.json({ success: true, data })
}

export function fail(error: string, status = 400) {
  return Response.json({ success: false, error }, { status })
}
