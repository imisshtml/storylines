// Campaign Progress Initialization API - Proxy to storylines-services

export async function POST(request: Request) {
  try {
    const { campaignId, adventureSlug } = await request.json();

    if (!campaignId || !adventureSlug) {
      return Response.json({
        success: false,
        error: 'Missing required fields: campaignId, adventureSlug'
      }, { status: 400 });
    }

    // Get the storylines-services URL (same pattern as story API)
    const servicesUrl = process.env.MIDDLEWARE_SERVICE_URL || 'http://localhost:3001';

    // Forward the request to storylines-services
    const response = await fetch(`${servicesUrl}/api/progress/initialize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        campaignId,
        adventureSlug
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ [CAMPAIGN PROGRESS API] Services error:', errorText);

      return Response.json({
        success: false,
        error: `Services error: ${response.status} ${response.statusText}`
      }, { status: response.status });
    }

    const result = await response.json();

    return Response.json(result);

  } catch (error) {
    console.error('❌ [CAMPAIGN PROGRESS API] Error:', error);

    return Response.json({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
} 