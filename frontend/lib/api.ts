// バックエンドのAPIを呼ぶための小さな関数。
// APIのURLは .env.local の NEXT_PUBLIC_API_BASE_URL から読む。

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL;

export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`);

  if (!res.ok) {
    throw new Error(`APIエラー: ${res.status} ${res.statusText}`);
  }

  return (await res.json()) as T;
}
