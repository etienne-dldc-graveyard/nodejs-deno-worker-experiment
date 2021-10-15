const socket = await Deno.connect({
  transport: "unix",
  path: Deno.env.get("JARVIS_UNIX_SOCKET"),
});
