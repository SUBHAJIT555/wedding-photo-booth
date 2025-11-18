/**
 * URL transformation utilities
 * Transforms localhost URLs to include /photo-booth/ path
 */

/**
 * Transform localhost URLs to include /photo-booth/ path
 * @param {string} url - The URL to transform
 * @returns {string} - Transformed URL
 */
export const transformLocalhostUrl = (url) => {
  if (!url || typeof url !== "string") {
    return url;
  }

  try {
    const urlObj = new URL(url);

    // Check if hostname is localhost
    if (urlObj.hostname === "localhost" || urlObj.hostname === "127.0.0.1") {
      // Get the pathname
      let pathname = urlObj.pathname;

      // Remove leading slash if present
      pathname = pathname.startsWith("/") ? pathname.substring(1) : pathname;

      // Check if /photo-booth/ is already in the path
      if (!pathname.startsWith("photo-booth/")) {
        // Add /photo-booth/ prefix
        pathname = "photo-booth/" + pathname;
      }

      // Reconstruct URL with new pathname
      urlObj.pathname = "/" + pathname;
      return urlObj.toString();
    }

    // Not localhost, return as is
    return url;
  } catch (error) {
    // If URL parsing fails, try simple string replacement
    if (url.includes("localhost")) {
      // Simple replacement for localhost URLs
      if (
        url.includes("http://localhost/") &&
        !url.includes("http://localhost/photo-booth/")
      ) {
        return url.replace(
          "http://localhost/",
          "http://localhost/photo-booth/"
        );
      }
      if (
        url.includes("http://127.0.0.1/") &&
        !url.includes("http://127.0.0.1/photo-booth/")
      ) {
        return url.replace(
          "http://127.0.0.1/",
          "http://127.0.0.1/photo-booth/"
        );
      }
    }

    // Return original if transformation fails
    return url;
  }
};

/**
 * Transform upload result URLs
 * @param {object} uploadResult - Upload result object with url and shortUrl
 * @returns {object} - Transformed upload result
 */
export const transformUploadResult = (uploadResult) => {
  if (!uploadResult) {
    return uploadResult;
  }

  return {
    ...uploadResult,
    url: transformLocalhostUrl(uploadResult.url),
    shortUrl: transformLocalhostUrl(uploadResult.shortUrl),
  };
};
