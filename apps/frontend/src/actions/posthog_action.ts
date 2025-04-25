"use server"
import axios from "axios";

export async function getVisitorStats() {
    const apiKey = process.env.POSTHOG_PRIVATE_API_KEY
    const apiUrl = process.env.POSTHOG_API_HOST
    const projectId = process.env.POSTHOG_PROJECT_ID
    const insightId = "952330"
    const insightUrl = `${apiUrl}/api/projects/${projectId}/insights/${insightId}/`

    try {
    const response = await axios.get(
        insightUrl, 
        {
            headers: {
                Authorization: `Bearer ${apiKey}`
            }
        }
    );
    
    if (response.status !== 200) {
        const errorText = response.statusText
        return { error: `Failed to fetch insight data: ${errorText}` }
    }
    const data = response.data
    return data
    } catch (error) {
    console.error("Error fetching insight data:", error)
    
    return { error: "Failed to fetch insight data" }
}
    
}