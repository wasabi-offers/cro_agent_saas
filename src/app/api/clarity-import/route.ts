import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { apiKey, numOfDays = 1, dimensions = [] } = await request.json();

    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 400 }
      );
    }

    // Build query params
    const params = new URLSearchParams({
      numOfDays: numOfDays.toString(),
    });

    // Add dimensions (max 3)
    dimensions.slice(0, 3).forEach((dim: string, index: number) => {
      params.append(`dimension${index + 1}`, dim);
    });

    // Call Clarity API
    const response = await fetch(
      `https://www.clarity.ms/export-data/api/v1/project-live-insights?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Clarity API error:', response.status, errorText);

      if (response.status === 401) {
        return NextResponse.json(
          { success: false, error: 'Invalid API key' },
          { status: 401 }
        );
      }

      if (response.status === 429) {
        return NextResponse.json(
          { success: false, error: 'Rate limit exceeded. Max 10 requests per day.' },
          { status: 429 }
        );
      }

      return NextResponse.json(
        { success: false, error: `Clarity API error: ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract key metrics from response
    const trafficData = data.find((metric: any) => metric.metricName === 'Traffic');
    const totalSessions = trafficData?.information?.reduce(
      (sum: number, info: any) => sum + parseInt(info.totalSessionCount || '0', 10),
      0
    ) || 0;

    const totalUsers = trafficData?.information?.reduce(
      (sum: number, info: any) => sum + parseInt(info.distantUserCount || '0', 10),
      0
    ) || 0;

    return NextResponse.json({
      success: true,
      data: {
        raw: data,
        summary: {
          sessions: totalSessions,
          users: totalUsers,
          lastSync: new Date().toISOString(),
        },
      },
    });
  } catch (error: any) {
    console.error('Clarity import error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to import Clarity data' },
      { status: 500 }
    );
  }
}
