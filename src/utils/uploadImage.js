/**
 * Upload image to server and get shareable URL
 * @param {string} base64Image - Base64 encoded image data (with or without data:image prefix)
 * @returns {Promise<{url: string, shortUrl: string, id: string}>}
 */
// export const uploadImage = async (base64Image) => {
//   const apiUrl = import.meta.env.VITE_API_URL || "";

//   // If no API URL is configured, try to use the current origin (for development)
//   let uploadUrl;
//   if (!apiUrl) {
//     // For development, use the public folder directly
//     uploadUrl = "/upload-image.php";
//   } else {
//     // Remove trailing slash from apiUrl and add the endpoint
//     const baseUrl = apiUrl.replace(/\/+$/, "");
//     uploadUrl = `${baseUrl}/upload-image.php`;
//   }

//   try {
//     const response = await fetch(uploadUrl, {
//       method: "POST",
//       headers: {
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({
//         image: base64Image,
//       }),
//     });

//     if (!response.ok) {
//       // Try to get error message from response
//       let errorMessage = `Upload failed with status ${response.status}`;
//       try {
//         const errorData = await response.json();
//         errorMessage = errorData.message || errorMessage;
//       } catch (error) {
//         console.error("Error parsing response:", error);
//         // If response is not JSON, get text
//         const text = await response.text();
//         if (text) {
//           errorMessage = `Server error: ${text.substring(0, 100)}`;
//         }
//       }
//       throw new Error(errorMessage);
//     }

//     const data = await response.json();

//     if (!data.success) {
//       throw new Error(data.message || "Failed to upload image");
//     }

//     return {
//       url: data.data.url,
//       shortUrl: data.data.shortUrl,
//       id: data.data.id,
//     };
//   } catch (error) {
//     console.error("Error uploading image:", error);
//     throw error;
//   }
// };
export const uploadImage = async (base64Image) => {
  const apiUrl = import.meta.env.VITE_API_URL || "";

  const baseUrl = apiUrl.replace(/\/+$/, "");
  const uploadUrl = baseUrl
    ? `${baseUrl}/upload-image.php`
    : "/upload-image.php";

  try {
    const response = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ image: base64Image }),
    });

    // Read body ONCE
    const text = await response.text();

    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (error) {
      console.error("Error parsing response:", error);
      console.warn("Response is not valid JSON, raw text:", text.slice(0, 200));
    }

    if (!response.ok) {
      const messageFromJson = data && data.message;
      const fallback =
        text && !messageFromJson
          ? `Server error: ${text.slice(0, 200)}`
          : `Upload failed with status ${response.status}`;

      throw new Error(messageFromJson || fallback);
    }

    if (!data || !data.success) {
      throw new Error(data?.message || "Failed to upload image");
    }

    return {
      url: data.data.url,
      shortUrl: data.data.shortUrl,
      id: data.data.id,
    };
  } catch (error) {
    console.error("Error uploading image:", error);
    throw error;
  }
};
