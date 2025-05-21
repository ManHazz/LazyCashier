import { NextResponse } from "next/server";

export const runtime = "edge";

export async function POST(request) {
  try {
    // Log the incoming request
    console.log("Received OCR request");

    const formData = await request.formData();
    const imageFile = formData.get("image");

    if (!imageFile) {
      console.error("No image file provided");
      return NextResponse.json(
        { error: "No image file provided" },
        { status: 400 }
      );
    }

    // Convert the file to base64
    const arrayBuffer = await imageFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");

    // Log the API key status (not the actual key)
    console.log("API Key present:", !!process.env.OCR_SPACE_API_KEY);

    // Create URLSearchParams for OCR.space API
    const params = new URLSearchParams();
    params.append("apikey", process.env.OCR_SPACE_API_KEY || "");
    params.append("language", "eng");
    params.append("isOverlayRequired", "false");
    params.append("detectOrientation", "true");
    params.append("scale", "true");
    params.append("OCREngine", "2");
    params.append("filetype", "jpg");
    params.append("base64Image", base64Image);

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
