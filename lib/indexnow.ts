export async function pingIndexNow(secretId: number | string) {
  try {
    const host = process.env.ENGINE_URL ? new URL(process.env.ENGINE_URL).hostname : 'secretbox.hive.baby';
    const protocol = process.env.ENGINE_URL ? new URL(process.env.ENGINE_URL).protocol : 'https:';
    const baseUrl = `${protocol}//${host}`;

    const key = 'secretbox_indexnow_verification_key_5566';
    const keyLocation = `${baseUrl}/${key}.txt`;
    const targetUrl = `${baseUrl}/secret/${secretId}`;

    const payload = {
      host,
      key,
      keyLocation,
      urlList: [targetUrl],
    };

    console.log(`Submitting URL to IndexNow: ${targetUrl}`);
    const res = await fetch('https://api.indexnow.org/IndexNow', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log(`IndexNow ping successful for secret ID ${secretId}`);
    } else {
      console.warn(`IndexNow ping returned status ${res.status}: ${await res.text()}`);
    }
  } catch (err) {
    console.error('Failed to submit URL to IndexNow:', err);
  }
}
