// Simple health check function to test if Netlify Functions work
export default async (req, context) => {
    return new Response(
        JSON.stringify({
            status: "ok",
            message: "Health check successful",
            timestamp: new Date().toISOString(),
            functions: "working"
        }),
        {
            status: 200,
            headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }
    );
};
