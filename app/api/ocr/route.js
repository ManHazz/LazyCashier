import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request) {
  try {
    // Log the incoming request
    console.log("Received OCR request");

    // Get the raw request body
    const body = await request.text();
    console.log("Request body type:", typeof body);

    // Parse the body as JSON
    let data;
    try {
      data = JSON.parse(body);
    } catch (e) {
      console.error("Failed to parse request body:", e);
      return NextResponse.json(
        { error: "Invalid request format" },
        { status: 400 }
      );
    }

    const imageData = data.image;
    if (!imageData) {
      console.error("No image data provided");
      return NextResponse.json(
        { error: "No image data provided" },
        { status: 400 }
      );
    }

    // Log the API key status (not the actual key)
    console.log("API Key present:", !!process.env.OCR_SPACE_API_KEY);

    // Create URLSearchParams instead of FormData
    const params = new URLSearchParams();
    params.append("apikey", process.env.OCR_SPACE_API_KEY || "");
    params.append("language", "eng");
    params.append("isOverlayRequired", "false");
    params.append("detectOrientation", "true");
    params.append("scale", "true");
    params.append("OCREngine", "2");
    params.append("filetype", "jpg");
    params.append("base64Image", imageData);

    console.log("Sending request to OCR.space API");

    const response = await fetch("https://api.ocr.space/parse/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    console.log("Received response from OCR.space API:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OCR API error:", errorText);
      throw new Error(`OCR API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("OCR API response:", JSON.stringify(result, null, 2));

    if (result.IsErroredOnProcessing) {
      throw new Error(result.ErrorMessage || "OCR processing failed");
    }

    if (!result.ParsedResults || result.ParsedResults.length === 0) {
      throw new Error("No text detected in the image");
    }

    return NextResponse.json({
      text: result.ParsedResults[0].ParsedText,
      confidence: result.ParsedResults[0].TextOverlay?.MeanConfidence || 0,
    });
  } catch (error) {
    console.error("OCR Error:", error);
    return NextResponse.json(
      {
        error: error.message || "OCR processing failed",
        details: error.stack,
      },
      { status: 500 }
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
