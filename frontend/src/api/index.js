import { API_BASE, compressImage } from '../utils/helpers';

export async function fetchDashboard() {
  const res = await fetch(`${API_BASE}/dashboard`);
  if (!res.ok) throw new Error("Failed to fetch dashboard inventory");
  return await res.json();
}

export async function fetchHistory() {
  const res = await fetch(`${API_BASE}/history`);
  if (!res.ok) throw new Error("Failed to fetch audit history");
  return await res.json();
}

export async function fetchStats() {
  const res = await fetch(`${API_BASE}/dashboard/stats`);
  if (!res.ok) throw new Error("Failed to fetch inventory stats");
  return await res.json();
}

export async function fetchTimeline(productId) {
  const res = await fetch(`${API_BASE}/products/${productId}/timeline`);
  if (!res.ok) throw new Error("Failed to fetch product timeline");
  return await res.json();
}

export async function uploadBatchImages({ files, batchMode, linkMode, selected, produce }) {
  const fd = new FormData();
  fd.append("batch_mode", files.length === 1 ? "single" : batchMode);
  fd.append("storage_type", "room");

  if (linkMode === "existing" && selected) {
    fd.append("product_id", selected.product_id);
  } else {
    fd.append("produce_type", produce);
  }

  for (const f of files) {
    fd.append("files", await compressImage(f));
  }

  const res = await fetch(`${API_BASE}/uploads`, {
    method: "POST",
    body: fd,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail ?? "Upload failed");
  }

  return await res.json();
}
