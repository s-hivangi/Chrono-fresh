export const API_BASE = (
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_API_BASE ||
  "http://127.0.0.1:8000"
).replace(/\/$/, '');
export const PRODUCE_TYPES = ["banana", "guava"];
export const STAGES = ["Fresh", "Early Ripening", "Mid-Ripening", "Late Ripening", "Spoiled"];

export function cap(s) {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export function isUrgent(p) {
  return p && (
    p.latest_stage === "Spoiled" ||
    p.latest_stage === "Late Ripening" ||
    (p.latest_days_remaining != null && p.latest_days_remaining <= 1.5)
  );
}

export function stageBadgeClass(stage) {
  if (!stage) return "badge badge-pending";
  const s = stage.toLowerCase();
  if (s.includes("early")) return "badge badge-early";
  if (s.includes("mid"))   return "badge badge-mid";
  if (s.includes("late"))  return "badge badge-late";
  if (s.includes("spoil")) return "badge badge-spoiled";
  return "badge badge-fresh";
}

export function stageStepClass(stage, seen) {
  if (!seen) return "stage-step";
  const s = stage.toLowerCase();
  if (s.includes("early")) return "stage-step active-early";
  if (s.includes("mid"))   return "stage-step active-mid";
  if (s.includes("late"))  return "stage-step active-late";
  if (s.includes("spoil")) return "stage-step active-spoiled";
  return "stage-step active-fresh";
}

export function headerBgClass(stage) {
  if (!stage) return "";
  const s = stage.toLowerCase();
  if (s.includes("early")) return "stage-early";
  if (s.includes("mid"))   return "stage-mid";
  if (s.includes("late"))  return "stage-late";
  if (s.includes("spoil")) return "stage-spoiled";
  return "";
}

export async function compressImage(file) {
  if (!file.type.startsWith("image/")) return file;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise((res, rej) => {
      const i = new Image();
      i.onload = () => res(i);
      i.onerror = rej;
      i.src = url;
    });
    const scale = Math.min(1, 1080 / Math.max(img.width, img.height));
    const c = document.createElement("canvas");
    c.width = Math.round(img.width * scale);
    c.height = Math.round(img.height * scale);
    c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
    const blob = await new Promise(r => c.toBlob(r, "image/jpeg", 0.85));
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    URL.revokeObjectURL(url);
  }
}
