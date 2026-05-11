import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.set("trust proxy", true);
  app.use(express.json());

  // In-memory store for tokens (for demo purposes)
  let fitbitTokens: any = null;

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Google Auth URL
  app.get("/api/auth/url", (req, res) => {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return res.status(500).json({ error: "GOOGLE_CLIENT_ID not configured" });
    }

    // Extremely robust redirect URI detection
    const forwardedHost = req.get("x-forwarded-host");
    const forwardedProto = req.get("x-forwarded-proto");
    const host = forwardedHost || req.get("host");
    const protocol = forwardedProto || (host?.includes("localhost") ? "http" : "https");
    
    // If we have an APP_URL env var, we should use that as the base
    let redirectUri = `${protocol}://${host}/auth/callback`;
    if (process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL" && !host?.includes("localhost")) {
        redirectUri = `${process.env.APP_URL.replace(/\/$/, "")}/auth/callback`;
    }
    
    console.log(`[OAuth] Final Redirect URI: ${redirectUri}`);

    const params = new URLSearchParams({
      client_id: clientId,
      response_type: "code",
      scope: "https://www.googleapis.com/auth/fitness.activity.read https://www.googleapis.com/auth/fitness.sleep.read https://www.googleapis.com/auth/fitness.nutrition.read profile email openid",
      redirect_uri: redirectUri,
      access_type: "offline",
      prompt: "consent",
    });

    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}` });
  });

  // OAuth Callback
  app.get(["/auth/callback", "/auth/callback/"], async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).send("No code provided");

    const forwardedHost = req.get("x-forwarded-host");
    const forwardedProto = req.get("x-forwarded-proto");
    const host = forwardedHost || req.get("host");
    const protocol = forwardedProto || (host?.includes("localhost") ? "http" : "https");
    
    let redirectUri = `${protocol}://${host}/auth/callback`;
    if (process.env.APP_URL && process.env.APP_URL !== "MY_APP_URL" && !host?.includes("localhost")) {
        redirectUri = `${process.env.APP_URL.replace(/\/$/, "")}/auth/callback`;
    }

    console.log(`[OAuth] Callback Redirect URI: ${redirectUri}`);

    try {
      const response = await axios.post("https://oauth2.googleapis.com/token", {
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      });

      fitbitTokens = response.data;

      res.send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
            <div style="text-align: center; background: white; padding: 2rem; border-radius: 1.5rem; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1);">
                <div style="color: #10b981; font-size: 3rem; margin-bottom: 1rem;">✓</div>
                <h2 style="color: #1e293b; margin-bottom: 0.5rem;">Google Health Connected</h2>
                <p style="color: #64748b;">You can close this window now.</p>
                <script>
                if (window.opener) {
                    window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
                    setTimeout(() => window.close(), 1500);
                }
                </script>
            </div>
          </body>
        </html>
      `);
    } catch (error: any) {
      res.status(500).send("Authentication failed");
    }
  });

  // Sync Data
  app.get("/api/watch/sync", async (req, res) => {
    if (!fitbitTokens) return res.status(401).json({ error: "Not connected" });

    const fetchData = async (token: string) => {
        const startOfDay = new Date().setHours(0,0,0,0);
        const endOfTime = Date.now();
        
        return await axios.post(
          "https://fitness.googleapis.com/fitness/v1/users/me/dataset:aggregate",
          {
            aggregateBy: [
              { dataTypeName: "com.google.step_count.delta" },
              { dataTypeName: "com.google.sleep.segment" },
              { dataTypeName: "com.google.hydration" }
            ],
            bucketByTime: { durationMillis: 86400000 },
            startTimeMillis: startOfDay,
            endTimeMillis: endOfTime,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
    };

    try {
        let fitnessRes;
        try {
            fitnessRes = await fetchData(fitbitTokens.access_token);
        } catch (error: any) {
            // Try refreshing token if unauthorized
            if (error.response?.status === 401 && fitbitTokens.refresh_token) {
                console.log("[OAuth] Token expired, refreshing...");
                const refreshRes = await axios.post("https://oauth2.googleapis.com/token", {
                    client_id: process.env.GOOGLE_CLIENT_ID,
                    client_secret: process.env.GOOGLE_CLIENT_SECRET,
                    refresh_token: fitbitTokens.refresh_token,
                    grant_type: "refresh_token",
                });
                fitbitTokens = { ...fitbitTokens, ...refreshRes.data };
                fitnessRes = await fetchData(fitbitTokens.access_token);
            } else {
                throw error;
            }
        }

        const bucket = fitnessRes.data.bucket?.[0];
        const datasets = bucket?.dataset || [];
        
        let steps = 0;
        let sleepHours = 7; // Default if no data
        let hydrationMl = 0;

        datasets.forEach((ds: any) => {
            const dataTypeName = ds.dataSourceId?.split(':')?.[1];
            const value = ds.point?.[0]?.value?.[0];

            if (ds.point?.[0]) {
                if (ds.dataSourceId.includes("step_count.delta")) {
                    steps = value?.intVal || 0;
                } else if (ds.dataSourceId.includes("sleep.segment")) {
                    // Sleep is often returned as segments, simplified here
                    const durationMillis = ds.point.reduce((acc: number, p: any) => acc + (p.endTimeNanos - p.startTimeNanos), 0) / 1000000;
                    sleepHours = Math.round((durationMillis / (1000 * 60 * 60)) * 10) / 10 || 7;
                } else if (ds.dataSourceId.includes("hydration")) {
                    hydrationMl = (value?.fpVal || 0) * 1000;
                }
            }
        });

        res.json({
            steps,
            sleep: sleepHours,
            hydration: hydrationMl,
            lastSync: new Date().toISOString()
        });
    } catch (error: any) {
        const errorData = error.response?.data;
        console.error("[OAuth] Sync error full response:", JSON.stringify(errorData, null, 2));
        
        // Extract message from various possible Google error formats
        const message = errorData?.error?.message || errorData?.message || error.message;
        const details = typeof message === 'string' ? message : JSON.stringify(message);
        
        const isApiDisabled = details?.toLowerCase().includes("fitness api has not been used") || 
                            details?.toLowerCase().includes("disabled") ||
                            errorData?.error?.status === "PERMISSION_DENIED";

        res.status(500).json({ 
            error: "Sync failed",
            details: details,
            isApiDisabled: isApiDisabled
        });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
