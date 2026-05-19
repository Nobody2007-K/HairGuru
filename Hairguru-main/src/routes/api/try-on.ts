import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { generateAiTryOn } from "@/lib/ai-try-on.server";

const requestSchema = z.object({
  hairstyleName: z.string().min(1),
  imageBase64: z.string().min(1),
});

export const Route = createFileRoute("/api/try-on")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const data = requestSchema.parse(await request.json());
          const result = await generateAiTryOn(data);

          return Response.json({
            success: true,
            response: result.image,
            provider: result.provider,
          });
        } catch (error) {
          const details = error instanceof Error ? error.message : "Try-on failed";

          return Response.json(
            {
              success: false,
              error: "Try-on failed",
              details,
            },
            { status: 400 },
          );
        }
      },
    },
  },
});
