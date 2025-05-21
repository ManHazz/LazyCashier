import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request) {
  try {
    const formData = await request.formData();
    const imageData = formData.get("image");

    if (!imageData) {
      return NextResponse.json(
        { error: "No image data provided" },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    const ocrFormData = new FormData();
    ocrFormData.append("apikey", process.env.OCR_SPACE_API_KEY);
    ocrFormData.append("language", "eng");
    ocrFormData.append("isOverlayRequired", "false");
    ocrFormData.append("detectOrientation", "true");
    ocrFormData.append("scale", "true");
    ocrFormData.append("OCREngine", "2");
    ocrFormData.append("filetype", "jpg");
    ocrFormData.append("base64Image", imageData);

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      body: ocrFormData,
    });

    if (!response.ok) {
      throw new Error(`OCR API error: ${response.status}`);
    }

    const result = await response.json();

    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage || "OCR processing failed");
    }

    if (!result.ParsedResults || result.ParsedResults.length === 0) {
      throw new Error("No text detected in the image");
    }

    return NextResponse.json(
      {
        text: result.ParsedResults[0].ParsedText,
        confidence: result.ParsedResults[0].TextOverlay?.MeanConfidence || 0,
      },
      {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json(
      { error: error.message || "OCR processing failed" },
      {
        status: 500,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
        },
      }
    );
  }
}

export async function OPTIONS() {
  return NextResponse.json(
    {},
    {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    }
  );
}
