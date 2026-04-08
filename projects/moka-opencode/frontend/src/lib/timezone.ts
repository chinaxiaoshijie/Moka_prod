/**
 * 时间处理工具函数
 *
 * 核心原则：
 * - 数据库永远存储 UTC 时间（带 Z 后缀）
 * - 前端显示永远用本地时间
 * - datetime-local 的值是本地时间（不带时区）
 *
 * 重要：datetime-local 的值格式是 "YYYY-MM-DDTHH:mm"
 * 这个格式没有时区信息，必须明确告诉 JavaScript 这是本地时间！
 */

/**
 * 将本地 datetime-local 输入值转换为 UTC ISO 字符串
 *
 * @param localValue - datetime-local 值（如 "2026-04-08T16:00"）
 * @returns UTC ISO 字符串（如 "2026-04-08T08:00:00.000Z"）
 *
 * 关键：datetime-local 的值是本地时间！必须用本地时间解析！
 */
export function localToUTC(localValue: string): string {
  if (!localValue) return "";

  // datetime-local 格式：YYYY-MM-DDTHH:mm
  // 例如：2026-04-08T16:00 表示上海时间 16:00

  // 方法：用本地时间解析
  // new Date("2026-04-08T16:00") 在不同浏览器行为不一致
  // 安全方法：分别获取日期和时间部分，然后用 new Date(year, month-1, day, hour, minute)
  // 这会创建一个本地时间的 Date 对象

  const [datePart, timePart] = localValue.split("T");
  if (!datePart || !timePart) return "";

  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // 用本地时间创建 Date 对象（注意：month 是 0-indexed）
  const localDate = new Date(year, month - 1, day, hour, minute, 0, 0);

  // 转换为 UTC ISO 字符串
  return localDate.toISOString();
}

/**
 * 将 UTC 时间字符串转换为 datetime-local 输入值
 *
 * @param utcStr - UTC 时间字符串（如 "2026-04-08T08:00:00.000Z"）
 * @returns datetime-local 值（如 "2026-04-08T16:00"）
 *
 * 关键：UTC 时间必须转换为本地时间显示！
 */
export function utcToLocalInput(utcStr: string): string {
  if (!utcStr) return "";

  // 解析 UTC 时间字符串
  const utcDate = new Date(utcStr);

  if (isNaN(utcDate.getTime())) return "";

  // 用本地时间方法获取各个部分
  const year = utcDate.getFullYear();
  const month = String(utcDate.getMonth() + 1).padStart(2, "0");
  const day = String(utcDate.getDate()).padStart(2, "0");
  const hours = String(utcDate.getHours()).padStart(2, "0");
  const minutes = String(utcDate.getMinutes()).padStart(2, "0");

  // 返回 datetime-local 格式
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

/**
 * 将 UTC 时间字符串转换为本地显示格式
 *
 * @param utcStr - UTC 时间字符串（如 "2026-04-08T08:00:00.000Z"）
 * @returns 本地时间字符串（如 "2026年4月8日 16:00"）
 */
export function formatUTCToLocal(utcStr: string): string {
  if (!utcStr) return "";

  const date = new Date(utcStr);

  if (isNaN(date.getTime())) return "";

  // toLocaleString 会自动将 UTC 转换为本地时间
  return date.toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * 将 UTC 时间字符串转换为简短显示格式
 *
 * @param utcStr - UTC 时间字符串
 * @returns 简短格式（如 "4月8日 16:00"）
 */
export function formatUTCToShort(utcStr: string): string {
  if (!utcStr) return "";

  const date = new Date(utcStr);

  if (isNaN(date.getTime())) return "";

  return date.toLocaleString("zh-CN", {
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

/**
 * 格式化为日期（不含时间）
 *
 * @param utcStr - UTC 时间字符串
 * @returns 日期格式（如 "2026年4月8日"）
 */
export function formatDateOnly(utcStr: string): string {
  if (!utcStr) return "";

  const date = new Date(utcStr);

  if (isNaN(date.getTime())) return "";

  return date.toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

/**
 * 格式化为时间（不含日期）
 *
 * @param utcStr - UTC 时间字符串
 * @returns 时间格式（如 "16:00"）
 */
export function formatTimeOnly(utcStr: string): string {
  if (!utcStr) return "";

  const date = new Date(utcStr);

  if (isNaN(date.getTime())) return "";

  return date.toLocaleTimeString("zh-CN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}