async function redisCommand(command) {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) {
    const error = new Error("Database belum dikonfigurasi.");
    error.statusCode = 503;
    throw error;
  }

  const response = await fetch(url.replace(/\/+$/, ""), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(command)
  });
  let result;
  try {
    result = await response.json();
  } catch {
    const error = new Error("Database mengembalikan respons yang tidak valid.");
    error.statusCode = 502;
    throw error;
  }
  if (!response.ok || result.error) {
    const error = new Error("Database menolak permintaan.");
    error.statusCode = 502;
    throw error;
  }
  return result.result;
}

module.exports = { redisCommand };
