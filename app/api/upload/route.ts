import { NextRequest, NextResponse } from "next/server";
import { uploadToCloudinary } from "@/lib/cloudinary";
import { store } from "@/lib/mock-data";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    let fileData = "";
    let folder = "kiddieops/children";
    let entityType = "child_avatar";
    let entityId: string | undefined = undefined;

    if (contentType.includes("application/json")) {
      const body = await req.json();
      fileData = body.file || body.dataUri;
      if (body.folder) folder = body.folder;
      if (body.entityType) entityType = body.entityType;
      if (body.entityId) entityId = body.entityId;
    } else if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      folder = (formData.get("folder") as string) || folder;
      entityType = (formData.get("entityType") as string) || entityType;
      entityId = (formData.get("entityId") as string) || undefined;

      if (file) {
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        const base64 = buffer.toString("base64");
        fileData = `data:${file.type || "image/jpeg"};base64,${base64}`;
      }
    }

    if (!fileData) {
      return NextResponse.json({ error: "No file or dataUri provided" }, { status: 400 });
    }

    // Auto-detect video vs image
    const isVideo = fileData.startsWith("data:video") || fileData.includes(".mp4") || fileData.includes(".webm");
    const targetResourceType: "video" | "image" = isVideo ? "video" : "image";

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(fileData, {
      folder,
      resourceType: targetResourceType,
    });

    // Store in media_assets registry (Store and PostgreSQL)
    const assetId = `media-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
    const savedAsset = store.addMediaAsset({
      id: assetId,
      publicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      resourceType: uploadResult.resourceType,
      format: uploadResult.format,
      uploadedAt: new Date().toISOString(),
      entityType,
      entityId,
    });

    let pgAssetId: string | undefined = undefined;
    try {
      const { db } = await import("@/lib/db");
      const { mediaAssets } = await import("@/lib/db/schema");
      const { eq } = await import("drizzle-orm");

      const [inserted] = await db
        .insert(mediaAssets)
        .values({
          publicId: uploadResult.publicId,
          secureUrl: uploadResult.secureUrl,
          resourceType: uploadResult.resourceType as any,
          format: uploadResult.format,
          entityType,
          entityId: entityId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(entityId) ? entityId : null,
        })
        .onConflictDoNothing()
        .returning();

      if (inserted?.id) {
        pgAssetId = inserted.id;
      } else {
        const existing = await db
          .select({ id: mediaAssets.id })
          .from(mediaAssets)
          .where(eq(mediaAssets.publicId, uploadResult.publicId))
          .limit(1);
        if (existing[0]?.id) pgAssetId = existing[0].id;
      }
    } catch (dbErr) {
      console.warn("DB mediaAssets sync note in upload route:", dbErr);
    }

    return NextResponse.json({
      success: true,
      assetId: pgAssetId || savedAsset.id,
      publicId: uploadResult.publicId,
      secureUrl: uploadResult.secureUrl,
      format: uploadResult.format,
    });
  } catch (error: any) {
    console.error("Cloudinary upload route error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload to Cloudinary" },
      { status: 500 }
    );
  }
}
