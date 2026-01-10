import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.3"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { type, notes } = await req.json()
        const apiKey = Deno.env.get('GEMINI_API_KEY')

        if (!apiKey) {
            return new Response(
                JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
            )
        }

        const genAI = new GoogleGenerativeAI(apiKey)
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" })

        const prompt = `
      You are a humorous but helpful health companion app called "DooDoo Log".
      The user just logged a bowel movement.
      
      Data:
      - Bristol Stool Scale Type: ${type}
      - User Notes: "${notes || 'None'}"

      Task:
      Provide a very short (max 2 sentences) witty comment about this entry.
      If the type indicates constipation (1-2) or diarrhea (6-7), gently suggest water or fiber in a fun way.
      If it's ideal (3-4), congratulate them.
      
      Tone: Fun, warm, supportive, brown-themed puns allowed but don't be gross.
      Important: Do NOT give serious medical advice.
    `

        const result = await model.generateContent(prompt)
        const text = result.response.text()

        return new Response(
            JSON.stringify({ message: text }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )
    } catch (error: any) {
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
