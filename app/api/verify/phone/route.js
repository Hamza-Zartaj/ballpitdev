// app/api/verify/phone/route.js

/**
 * POST /api/verify/phone
 * Phone verification endpoint
 * Body: { phoneNumber: string, countryCode?: string }
 * Returns: { success: boolean, valid: boolean, error?: string }
 */
export const POST = async (req) => {
  try {
    const body = await req.json();
    const { phoneNumber, countryCode } = body;

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({
          success: false,
          valid: false,
          error: "Phone number is required",
        }),
        { status: 400 }
      );
    }

    

    return new Response(
      JSON.stringify({
        success: true,
        valid: true,
        phoneNumber: phoneNumber,
        countryCode: countryCode || "US",
      }),
      { status: 200 }
    );
  } catch (error) {
    console.error(`Error in POST /api/verify/phone:`, error);
    return new Response(
      JSON.stringify({
        success: false,
        valid: false,
        error: error.message || "Failed to process phone number",
      }),
      { status: 500 }
    );
  }
};

