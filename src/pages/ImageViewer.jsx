import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";

/**
 * Image Viewer Component
 * Handles /i/:id routes and serves images from the PHP endpoint
 */
function ImageViewer() {
  const { id } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);

  useEffect(() => {
    if (!id) {
      setError("Invalid image ID");
      setLoading(false);
      return;
    }

    // Validate ID format (16 hex characters)
    if (!/^[a-f0-9]{16}$/i.test(id)) {
      setError("Invalid image ID format");
      setLoading(false);
      return;
    }

    // Build the PHP endpoint URL
    const apiUrl = import.meta.env.VITE_API_URL || "";
    let endpointUrl;
    
    if (apiUrl) {
      const baseUrl = apiUrl.replace(/\/+$/, "");
      endpointUrl = `${baseUrl}/i.php?id=${id}`;
    } else {
      // For development, use relative path
      endpointUrl = `/i.php?id=${id}`;
    }

    // Test if the image loads
    const img = new Image();
    img.onload = () => {
      setImageUrl(endpointUrl);
      setLoading(false);
    };
    img.onerror = () => {
      setError("Image not found");
      setLoading(false);
    };
    img.src = endpointUrl;
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#e91e63] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading image...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center">
          <p className="text-red-600 text-lg mb-4">{error}</p>
          <a
            href="/"
            className="text-[#e91e63] hover:underline"
          >
            Go to Home
          </a>
        </div>
      </div>
    );
  }

  if (imageUrl) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100 p-4">
        <div className="max-w-4xl w-full">
          <img
            src={imageUrl}
            alt="Shared photo"
            className="w-full h-auto rounded-lg shadow-lg"
            style={{ maxHeight: "90vh", objectFit: "contain" }}
          />
          <div className="mt-4 text-center">
            <a
              href="/"
              className="text-[#e91e63] hover:underline font-semibold"
            >
              ← Back to Home
            </a>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default ImageViewer;

