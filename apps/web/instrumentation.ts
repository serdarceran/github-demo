export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { syncSystemAdmins } = await import("./lib/syncAdmins");
    await syncSystemAdmins();
  }
}
