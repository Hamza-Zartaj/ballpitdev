// app/api/verify/email/route.js

/**
 * POST /api/verify/email
 * Email verification endpoint
 * Body: { email: string }
 * Returns: { success: boolean, valid: boolean, error?: string }
 */
export const POST = async (req) => {
  try {
    const body = await req.json();
    const { email } = body;

    if (!email) {
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          error: "Email address is required",
        }),
        { status: 400 }
      );
    }

    

    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        email: email,
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in POST /api/verify/email:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        valid: false,
        error: error.message || "Failed to process email",
      }),
      { status: 500 }
    );
  }
};
